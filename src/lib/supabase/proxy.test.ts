import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HOME_PATH, LOGIN_PATH } from "@/features/auth/domain/route-access";
import { redirectWithSession, updateSession } from "./proxy";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));

type Cookie = { name: string; value: string };
type Claims = { sub: string } | null;

function mockSupabase(
  onRefresh: (cookies: CookieMethodsServer) => void | Promise<void>,
  claims: Claims = null,
) {
  vi.mocked(createServerClient).mockImplementation((_url, _key, options) => {
    const getClaims = vi.fn(async () => {
      await onRefresh(options.cookies as CookieMethodsServer);
      return { data: claims ? { claims } : null, error: null };
    });
    return { auth: { getClaims } } as unknown as ReturnType<typeof createServerClient>;
  });
}

function requestWithCookie(cookie: Cookie) {
  return new NextRequest("http://localhost:3000/dashboard", {
    headers: { cookie: `${cookie.name}=${cookie.value}` },
  });
}

const refreshCookies = (cookies: CookieMethodsServer) =>
  cookies.setAll?.(
    [{ name: "sb-token", value: "refreshed", options: { path: "/", httpOnly: true } }],
    { "Cache-Control": "private, no-store", Expires: "0", Pragma: "no-cache" },
  );

describe("updateSession", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-anon-key");
  });

  it("creates the Supabase client with the public env", async () => {
    mockSupabase(() => undefined);

    await updateSession(new NextRequest("http://localhost:3000/"));

    expect(createServerClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "public-anon-key",
      expect.any(Object),
    );
  });

  it("exposes the incoming request cookies to Supabase", async () => {
    let seen: Cookie[] | null = null;
    mockSupabase(async (cookies) => {
      seen = await cookies.getAll();
    });

    await updateSession(requestWithCookie({ name: "sb-token", value: "abc" }));

    expect(seen).toEqual([{ name: "sb-token", value: "abc" }]);
  });

  it("reports an unauthenticated request and lets it continue without redirecting", async () => {
    mockSupabase(() => undefined);

    const { response, isAuthenticated } = await updateSession(
      new NextRequest("http://localhost:3000/private"),
    );

    expect(isAuthenticated).toBe(false);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("reports an authenticated request when the claims have a subject", async () => {
    mockSupabase(() => undefined, { sub: "user-1" });

    const { isAuthenticated } = await updateSession(new NextRequest("http://localhost:3000/"));

    expect(isAuthenticated).toBe(true);
  });

  it("writes refreshed session cookies and no-cache headers to the response", async () => {
    mockSupabase(refreshCookies, { sub: "user-1" });

    const { response } = await updateSession(requestWithCookie({ name: "sb-token", value: "old" }));

    expect(response.cookies.get("sb-token")?.value).toBe("refreshed");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("location")).toBeNull();
  });

  it("throws a clear error when the Supabase env is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", undefined);

    await expect(updateSession(new NextRequest("http://localhost:3000/"))).rejects.toThrow(
      /NEXT_PUBLIC_SUPABASE_URL/,
    );
  });
});

describe("redirectWithSession", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-anon-key");
  });

  it("redirects to the same-origin path", async () => {
    mockSupabase(() => undefined);
    const request = new NextRequest("http://localhost:3000/private");
    const { response } = await updateSession(request);

    const redirect = redirectWithSession(request, response, LOGIN_PATH);

    expect(redirect.status).toBe(307);
    expect(redirect.headers.get("location")).toBe(`http://localhost:3000${LOGIN_PATH}`);
  });

  it("keeps refreshed cookies and no-cache headers on the redirect", async () => {
    mockSupabase(refreshCookies, { sub: "user-1" });
    const request = requestWithCookie({ name: "sb-token", value: "old" });
    const { response } = await updateSession(request);

    const redirect = redirectWithSession(request, response, HOME_PATH);

    expect(redirect.cookies.get("sb-token")).toMatchObject({
      value: "refreshed",
      path: "/",
      httpOnly: true,
    });
    expect(redirect.headers.get("cache-control")).toBe("private, no-store");
    expect(redirect.headers.get("expires")).toBe("0");
    expect(redirect.headers.get("pragma")).toBe("no-cache");
  });
});
