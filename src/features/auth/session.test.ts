import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { createFakeAuth, throwRedirect, type FakeAuth } from "@/test/auth-mocks";
import { requireUser } from "./session";

vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ redirect: vi.fn(throwRedirect) }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

function useAuth(auth: FakeAuth) {
  vi.mocked(createClient).mockResolvedValue({ auth } as unknown as Awaited<ReturnType<typeof createClient>>);
}

describe("requireUser", () => {
  beforeEach(() => {
    useAuth(createFakeAuth());
  });

  it("returns the user from verified claims", async () => {
    useAuth(createFakeAuth({ user: { id: "user-1", email: "ana@example.com" } }));

    await expect(requireUser()).resolves.toEqual({ id: "user-1", email: "ana@example.com" });
  });

  it("redirects to /login when there is no user", async () => {
    await expect(requireUser()).rejects.toMatchObject({ url: "/login" });
  });
});
