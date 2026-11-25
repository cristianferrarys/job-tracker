import { afterEach, describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { buildAnalysis, buildAnalysisResult } from "@/test/analysis";
import { APPLICATION_ID } from "@/test/applications";
import { findAnalysisByApplicationId, upsertAnalysis } from "./analysis-repository";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

type QueryResult = { data: unknown; error: { message: string } | null };

const ANALYSIS = buildAnalysis();
const ROW = {
  application_id: APPLICATION_ID,
  requirements: ANALYSIS.requirements,
  match_score: ANALYSIS.matchScore,
  matched_skills: ANALYSIS.matchedSkills,
  missing_skills: ANALYSIS.missingSkills,
  tips: ANALYSIS.tips,
  created_at: ANALYSIS.createdAt,
};

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

afterEach(() => {
  vi.useRealTimers();
});

describe("findAnalysisByApplicationId", () => {
  it("reads the analysis of the application, scoped to the user, and maps it", async () => {
    const { from, query } = fakeSupabase({ data: ROW, error: null });

    await expect(findAnalysisByApplicationId("user-1", APPLICATION_ID)).resolves.toEqual({ ok: true, data: ANALYSIS });
    expect(from).toHaveBeenCalledWith("application_analyses");
    expect(query.eq).toHaveBeenCalledWith("application_id", APPLICATION_ID);
    expect(query.eq).toHaveBeenCalledWith("user_id", "user-1");
  });

  it("returns null when the application has no analysis", async () => {
    fakeSupabase({ data: null, error: null });

    await expect(findAnalysisByApplicationId("user-1", APPLICATION_ID)).resolves.toEqual({ ok: true, data: null });
  });

  it("returns a failure without database details on error", async () => {
    fakeSupabase({ data: null, error: { message: "permission denied for table application_analyses" } });

    await expect(findAnalysisByApplicationId("user-1", APPLICATION_ID)).resolves.toEqual({ ok: false });
  });
});

describe("upsertAnalysis", () => {
  it("upserts by application_id for the user with a fresh timestamp and returns the saved analysis", async () => {
    vi.useFakeTimers({ now: new Date("2026-11-24T10:00:00Z") });
    const { from, query } = fakeSupabase({ data: ROW, error: null });

    const result = await upsertAnalysis("user-1", APPLICATION_ID, buildAnalysisResult());

    expect(result).toEqual({ ok: true, data: ANALYSIS });
    expect(from).toHaveBeenCalledWith("application_analyses");
    expect(query.upsert).toHaveBeenCalledWith(
      {
        application_id: APPLICATION_ID,
        user_id: "user-1",
        requirements: ANALYSIS.requirements,
        match_score: ANALYSIS.matchScore,
        matched_skills: ANALYSIS.matchedSkills,
        missing_skills: ANALYSIS.missingSkills,
        tips: ANALYSIS.tips,
        created_at: "2026-11-24T10:00:00.000Z",
      },
      { onConflict: "application_id" },
    );
  });

  it("returns a failure without database details on error", async () => {
    fakeSupabase({ data: null, error: { message: "violates foreign key constraint" } });

    await expect(upsertAnalysis("user-1", APPLICATION_ID, buildAnalysisResult())).resolves.toEqual({ ok: false });
  });
});
