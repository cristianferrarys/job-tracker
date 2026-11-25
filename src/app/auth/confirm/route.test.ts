import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createFakeAuth, throwRedirect, type FakeAuth } from "@/test/auth-mocks";
import { GET } from "./route";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn(throwRedirect) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

let auth: FakeAuth;

function confirmRequest(query: string) {
  return new NextRequest(`http://localhost:3000/auth/confirm${query}`);
}

async function redirectTarget(query: string): Promise<unknown> {
  return GET(confirmRequest(query)).then(
    () => null,
    (reason: { url?: string }) => reason.url,
  );
}

beforeEach(() => {
  auth = createFakeAuth();
  vi.mocked(createClient).mockResolvedValue({ auth } as unknown as Awaited<ReturnType<typeof createClient>>);
});

describe("GET /auth/confirm", () => {
  it("verifies a valid token and redirects to /", async () => {
    const target = await redirectTarget("?token_hash=abc123&type=signup");

    expect(target).toBe("/");
    expect(auth.verifyOtp).toHaveBeenCalledWith({ token_hash: "abc123", type: "signup" });
  });

  it("redirects to a safe relative next path after confirming", async () => {
    expect(await redirectTarget("?token_hash=abc&type=email&next=/applications")).toBe("/applications");
  });

  it.each(["https://evil.com", "//evil.com", "/\\evil.com"])(
    "ignores an external next param (%s) and redirects to /",
    async (next) => {
      const target = await redirectTarget(`?token_hash=abc&type=email&next=${encodeURIComponent(next)}`);

      expect(target).toBe("/");
    },
  );

  it("redirects to /login with an error when Supabase rejects the token", async () => {
    auth.verifyOtp.mockResolvedValue({ error: { code: "otp_expired", message: "Token has expired" } });

    expect(await redirectTarget("?token_hash=expired&type=signup")).toBe(
      "/login?error=confirmation_failed",
    );
  });

  it.each(["", "?type=signup", "?token_hash=abc", "?token_hash=abc&type=recovery"])(
    "redirects to /login with an error and skips Supabase for missing or invalid params (%s)",
    async (query) => {
      expect(await redirectTarget(query)).toBe("/login?error=confirmation_failed");
      expect(auth.verifyOtp).not.toHaveBeenCalled();
    },
  );
});
