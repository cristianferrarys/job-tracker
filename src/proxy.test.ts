import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HOME_PATH, LOGIN_PATH, SIGNUP_PATH } from "./features/auth/domain/route-access";
import { proxy } from "./proxy";

vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));

function mockSession(options: { userId?: string; refresh?: boolean }) {
  vi.mocked(createServerClient).mockImplementation((_url, _key, clientOptions) => {
    const cookies = clientOptions.cookies as CookieMethodsServer;
    const getClaims = vi.fn(async () => {
      if (options.refresh) {
        await cookies.setAll?.(
          [{ name: "sb-token", value: "refreshed", options: { path: "/" } }],
          { "Cache-Control": "private, no-store" },
        );
      }
      return {
        data: options.userId ? { claims: { sub: options.userId } } : null,
        error: null,
      };
    });
    return { auth: { getClaims } } as unknown as ReturnType<typeof createServerClient>;
  });
}

const ORIGIN = "http://localhost:3000";

function request(path: string) {
  return new NextRequest(`${ORIGIN}${path}`);
}

describe("proxy route protection", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-anon-key");
  });

  it.each([HOME_PATH, "/applications", "/profile/edit"])(
    "redirects an unauthenticated request for %s to /login",
    async (path) => {
      mockSession({});

      const response = await proxy(request(path));

      expect(response.status).toBe(307);
      expect(response.headers.get("location")).toBe(`${ORIGIN}${LOGIN_PATH}`);
    },
  );

  it.each([LOGIN_PATH, SIGNUP_PATH, "/auth/confirm?token_hash=abc&type=signup"])(
    "lets an unauthenticated request for %s through",
    async (path) => {
      mockSession({});

      const response = await proxy(request(path));

      expect(response.headers.get("location")).toBeNull();
      expect(response.headers.get("x-middleware-next")).toBe("1");
    },
  );

  it.each([LOGIN_PATH, SIGNUP_PATH])("redirects an authenticated user on %s to /", async (path) => {
    mockSession({ userId: "user-1" });

    const response = await proxy(request(path));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(`${ORIGIN}${HOME_PATH}`);
  });

  it("lets an authenticated user reach protected pages", async () => {
    mockSession({ userId: "user-1" });

    const response = await proxy(request("/applications"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("preserves refreshed session cookies on a redirect", async () => {
    mockSession({ userId: "user-1", refresh: true });

    const response = await proxy(request(LOGIN_PATH));

    expect(response.headers.get("location")).toBe(`${ORIGIN}${HOME_PATH}`);
    expect(response.cookies.get("sb-token")?.value).toBe("refreshed");
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
