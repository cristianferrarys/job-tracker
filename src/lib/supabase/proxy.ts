import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getPublicEnv } from "@/lib/env/public";
import type { Database } from "./database.types";

export type SessionResult = {
  /** Lets the request continue and carries any refreshed auth cookies. */
  response: NextResponse;
  isAuthenticated: boolean;
};

/**
 * Refreshes the Supabase auth session for the incoming request and reports whether the
 * request carries a valid session. It never redirects; callers decide what to do.
 */
export async function updateSession(request: NextRequest): Promise<SessionResult> {
  const env = getPublicEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Verifies the JWT (never trust getSession() on the server) and triggers setAll on refresh.
  const { data } = await supabase.auth.getClaims();

  return { response, isAuthenticated: Boolean(data?.claims?.sub) };
}

/** Headers Supabase sets with auth cookies so CDNs never cache a session. */
const NO_CACHE_HEADERS = ["cache-control", "expires", "pragma"] as const;

/** Redirects to a same-origin `pathname` while keeping refreshed auth cookies and cache headers. */
export function redirectWithSession(
  request: NextRequest,
  sessionResponse: NextResponse,
  pathname: string,
): NextResponse {
  const redirect = NextResponse.redirect(new URL(pathname, request.url));
  sessionResponse.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  NO_CACHE_HEADERS.forEach((name) => {
    const value = sessionResponse.headers.get(name);
    if (value) {
      redirect.headers.set(name, value);
    }
  });
  return redirect;
}
