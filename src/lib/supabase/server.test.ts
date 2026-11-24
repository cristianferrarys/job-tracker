import { createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { cookies } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "./server";

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@supabase/ssr", () => ({ createServerClient: vi.fn() }));

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function mockCookieStore(store: Partial<CookieStore>) {
  vi.mocked(cookies).mockResolvedValue(store as CookieStore);
}

function capturedCookieMethods(): CookieMethodsServer {
  const options = vi.mocked(createServerClient).mock.calls[0][2];
  return options.cookies as CookieMethodsServer;
}

describe("createClient (server)", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-anon-key");
  });

  it("creates the Supabase client with the public env", async () => {
    mockCookieStore({ getAll: () => [] });

    await createClient();

    expect(createServerClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "public-anon-key",
      expect.any(Object),
    );
  });

  it("reads auth cookies from the Next.js request cookie store", async () => {
    mockCookieStore({ getAll: () => [{ name: "sb-token", value: "abc" }] });

    await createClient();

    expect(await capturedCookieMethods().getAll()).toEqual([{ name: "sb-token", value: "abc" }]);
  });

  it("writes refreshed cookies to the cookie store when allowed", async () => {
    const set = vi.fn();
    mockCookieStore({ getAll: () => [], set });

    await createClient();
    await capturedCookieMethods().setAll?.(
      [{ name: "sb-token", value: "new", options: { path: "/" } }],
      {},
    );

    expect(set).toHaveBeenCalledWith("sb-token", "new", { path: "/" });
  });

  it("ignores cookie writes rejected during Server Component rendering", async () => {
    const set = vi.fn(() => {
      throw new Error("Cookies can only be modified in a Server Action or Route Handler.");
    });
    mockCookieStore({ getAll: () => [], set });

    await createClient();

    expect(() =>
      capturedCookieMethods().setAll?.([{ name: "sb-token", value: "new", options: {} }], {}),
    ).not.toThrow();
  });

  it("throws a clear error when the Supabase env is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);
    mockCookieStore({ getAll: () => [] });

    await expect(createClient()).rejects.toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });
});
