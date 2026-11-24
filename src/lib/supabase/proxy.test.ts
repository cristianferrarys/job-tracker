import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { updateSession } from "./proxy";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));

type Cookie = { name: string; value: string };

function mockSupabase(onRefresh: (cookies: CookieMethodsServer) => void | Promise<void>) {
  vi.mocked(createServerClient).mockImplementation((_url, _key, options) => {
    const getClaims = vi.fn(async () => {
      await onRefresh(options.cookies as CookieMethodsServer);
      return { data: null, error: null };
    });
    return { auth: { getClaims } } as unknown as ReturnType<typeof createServerClient>;
  });
}

function requestWithCookie(cookie: Cookie) {
  return new NextRequest("http://localhost:3000/dashboard", {
    headers: { cookie: `${cookie.name}=${cookie.value}` },
  });
}

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

  it("lets the request continue without redirecting when there is no session", async () => {
    mockSupabase(() => undefined);

    const response = await updateSession(new NextRequest("http://localhost:3000/private"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("writes refreshed session cookies and no-cache headers to the response", async () => {
    mockSupabase((cookies) => {
      cookies.setAll?.(
        [{ name: "sb-token", value: "refreshed", options: { path: "/", httpOnly: true } }],
        { "Cache-Control": "private, no-store" },
      );
    });

    const response = await updateSession(requestWithCookie({ name: "sb-token", value: "old" }));

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
