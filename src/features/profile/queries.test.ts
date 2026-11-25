import { describe, expect, it, vi } from "vitest";
import { requireUser } from "@/features/auth/session";
import { throwRedirect } from "@/test/auth-mocks";
import { findProfileByUserId } from "./data/profile-repository";
import { getCurrentProfile } from "./queries";

vi.mock("server-only", () => ({}));
vi.mock("@/features/auth/session", () => ({ requireUser: vi.fn() }));
vi.mock("./data/profile-repository", () => ({ findProfileByUserId: vi.fn() }));

describe("getCurrentProfile", () => {
  it("loads the profile of the signed-in user", async () => {
    const profile = { summary: "Dev", skills: ["Go"], updatedAt: "2026-11-24T10:00:00Z" };
    vi.mocked(requireUser).mockResolvedValue({ id: "user-1", email: "ana@example.com" });
    vi.mocked(findProfileByUserId).mockResolvedValue({ ok: true, data: profile });

    await expect(getCurrentProfile()).resolves.toEqual({ ok: true, data: profile });
    expect(findProfileByUserId).toHaveBeenCalledWith("user-1");
  });

  it("redirects to /login and reads nothing when there is no user", async () => {
    vi.mocked(requireUser).mockImplementation(async () => throwRedirect("/login"));

    await expect(getCurrentProfile()).rejects.toMatchObject({ url: "/login" });
    expect(findProfileByUserId).not.toHaveBeenCalled();
  });
});
