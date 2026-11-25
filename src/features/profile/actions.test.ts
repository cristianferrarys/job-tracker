import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { requireUser } from "@/features/auth/session";
import { LOGIN_PATH } from "@/features/auth/domain/route-access";
import { throwRedirect } from "@/test/auth-mocks";
import { saveProfile } from "./actions";
import { upsertProfile } from "./data/profile-repository";
import { PROFILE_SKILL_MAX_LENGTH, PROFILE_SUMMARY_MAX_LENGTH } from "./domain/profile";
import { PROFILE_PATH } from "./domain/routes";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/auth/session", () => ({ requireUser: vi.fn() }));
vi.mock("./data/profile-repository", () => ({ upsertProfile: vi.fn() }));

const UPDATED_AT = "2026-11-24T10:00:00Z";

function form(summary: string, skills: string[], extra: Record<string, string> = {}) {
  const data = new FormData();
  data.set("summary", summary);
  skills.forEach((skill) => data.append("skills", skill));
  Object.entries(extra).forEach(([key, value]) => data.set(key, value));
  return data;
}

beforeEach(() => {
  vi.mocked(requireUser).mockResolvedValue({ id: "user-1", email: "ana@example.com" });
  vi.mocked(upsertProfile).mockImplementation(async (_userId, input) => ({
    ok: true,
    data: { ...input, updatedAt: UPDATED_AT },
  }));
});

describe("saveProfile", () => {
  it("upserts the normalized profile for the signed-in user and revalidates /profile", async () => {
    const result = await saveProfile(null, form("  Frontend dev  ", [" TypeScript", "typescript", "React"]));

    expect(upsertProfile).toHaveBeenCalledWith("user-1", {
      summary: "Frontend dev",
      skills: ["TypeScript", "React"],
    });
    expect(result).toEqual({
      ok: true,
      data: { summary: "Frontend dev", skills: ["TypeScript", "React"], updatedAt: UPDATED_AT },
    });
    expect(revalidatePath).toHaveBeenCalledWith(PROFILE_PATH);
  });

  it("adds skills still typed in the tag input", async () => {
    await saveProfile(null, form("", ["Go"], { skillDraft: "Docker, go" }));

    expect(upsertProfile).toHaveBeenCalledWith("user-1", { summary: "", skills: ["Go", "Docker"] });
  });

  it("ignores a user_id sent by the client", async () => {
    await saveProfile(null, form("Dev", [], { user_id: "attacker", userId: "attacker" }));

    expect(upsertProfile).toHaveBeenCalledWith("user-1", { summary: "Dev", skills: [] });
  });

  it("returns field errors and does not touch the database for invalid input", async () => {
    const result = await saveProfile(null, form("a".repeat(PROFILE_SUMMARY_MAX_LENGTH + 1), ["x".repeat(PROFILE_SKILL_MAX_LENGTH + 1)]));

    expect(result).toEqual({
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: {
        summary: [`Summary must be at most ${PROFILE_SUMMARY_MAX_LENGTH} characters.`],
        skills: [`Each skill must be at most ${PROFILE_SKILL_MAX_LENGTH} characters.`],
      },
    });
    expect(upsertProfile).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects a submission without a summary field", async () => {
    const result = await saveProfile(null, new FormData());

    expect(result).toMatchObject({ ok: false, fieldErrors: { summary: ["Summary must be text."] } });
    expect(upsertProfile).not.toHaveBeenCalled();
  });

  it("redirects to /login and does not touch the database when unauthenticated", async () => {
    vi.mocked(requireUser).mockImplementation(async () => throwRedirect(LOGIN_PATH));

    await expect(saveProfile(null, form("Dev", ["Go"]))).rejects.toMatchObject({ url: LOGIN_PATH });
    expect(upsertProfile).not.toHaveBeenCalled();
  });

  it("returns a friendly error without database details when saving fails", async () => {
    vi.mocked(upsertProfile).mockResolvedValue({ ok: false });

    const result = await saveProfile(null, form("Dev", ["Go"]));

    expect(result).toEqual({ ok: false, error: "We could not save your profile. Please try again." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
