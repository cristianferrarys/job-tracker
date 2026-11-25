import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { connection } from "next/server";
import { getPublicEnv } from "@/lib/env/public";
import type { Database } from "./database.types";

/**
 * Supabase client for Server Components, Server Actions and Route Handlers. Create one per request.
 *
 * Supabase auth reads the current time (session and JWT expiry checks). With Cache Components and
 * Partial Prefetching, `cookies()` resolves during the runtime prerender stage, where `Date.now()`
 * is rejected, so `connection()` defers every Supabase call to request time.
 */
export async function createClient() {
  await connection();
  const env = getPublicEnv();
  const cookieStore = await cookies();

  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Server Components cannot set cookies; the proxy refreshes the session instead.
        }
      },
    },
  });
}
