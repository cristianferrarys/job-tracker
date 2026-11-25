import { beforeEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { findProfileByUserId, upsertProfile } from "./profile-repository";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

type QueryResult = { data: unknown; error: { message: string } | null };

const ROW = { summary: "Frontend developer", skills: ["TypeScript"], updated_at: "2026-11-24T10:00:00Z" };
const PROFILE = { summary: "Frontend developer", skills: ["TypeScript"], updatedAt: "2026-11-24T10:00:00Z" };

function fakeSupabase(result: QueryResult) {
  const query = {
    select: vi.fn(() => query),
    eq: vi.fn(() => query),
    upsert: vi.fn(() => query),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
  };
  const from = vi.fn(() => query);
  vi.mocked(createClient).mockResolvedValue({ from } as unknown as Awaited<ReturnType<typeof createClient>>);
  return { from, query };
}

describe("findProfileByUserId", () => {
  beforeEach(() => {
    fakeSupabase({ data: null, error: null });
  });

  it("reads the user's row from profiles and maps it to a Profile", async () => {
    const { from, query } = fakeSupabase({ data: ROW, error: null });

    await expect(findProfileByUserId("user-1")).resolves.toEqual({ ok: true, data: PROFILE });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("returns null when the user has no profile yet", async () => {
    await expect(findProfileByUserId("user-1")).resolves.toEqual({ ok: true, data: null });
  });

  it("returns a failure without database details on error", async () => {
    fakeSupabase({ data: null, error: { message: "relation does not exist" } });

    await expect(findProfileByUserId("user-1")).resolves.toEqual({ ok: false });
  });
});

describe("upsertProfile", () => {
  it("upserts by user_id and returns the saved profile", async () => {
    const { from, query } = fakeSupabase({ data: ROW, error: null });

    const result = await upsertProfile("user-1", { summary: "Frontend developer", skills: ["TypeScript"] });

    expect(result).toEqual({ ok: true, data: PROFILE });
    expect(from).toHaveBeenCalledWith("profiles");
    expect(query.upsert).toHaveBeenCalledWith(
      { user_id: "user-1", summary: "Frontend developer", skills: ["TypeScript"] },
      { onConflict: "user_id" },
    );
  });

  it("returns a failure without database details on error", async () => {
    fakeSupabase({ data: null, error: { message: "new row violates check constraint" } });

    await expect(upsertProfile("user-1", { summary: "", skills: [] })).resolves.toEqual({ ok: false });
  });
});
