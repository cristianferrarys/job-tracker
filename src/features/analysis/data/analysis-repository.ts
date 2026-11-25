import "server-only";
import type { RepositoryResult } from "@/lib/repository-result";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { Analysis, AnalysisResult } from "../domain/analysis";

const ANALYSIS_COLUMNS = "application_id, requirements, match_score, matched_skills, missing_skills, tips, created_at";

type AnalysisRow = Omit<Database["public"]["Tables"]["application_analyses"]["Row"], "id" | "user_id">;

function toAnalysis(row: AnalysisRow): Analysis {
  return {
    applicationId: row.application_id,
    requirements: row.requirements,
    matchScore: row.match_score,
    matchedSkills: row.matched_skills,
    missingSkills: row.missing_skills,
    tips: row.tips,
    createdAt: row.created_at,
  };
}

/** The analysis of one of the user's applications, or `null` when it has not been analyzed. */
export async function findAnalysisByApplicationId(
  userId: string,
  applicationId: string,
): Promise<RepositoryResult<Analysis | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("application_analyses")
    .select(ANALYSIS_COLUMNS)
    .eq("application_id", applicationId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    return { ok: false };
  }
  return { ok: true, data: data ? toAnalysis(data) : null };
}

/**
 * Saves the analysis of one of the user's applications, replacing the previous one. `created_at`
 * is reset so it always tells when the shown analysis was produced.
 */
export async function upsertAnalysis(
  userId: string,
  applicationId: string,
  result: AnalysisResult,
): Promise<RepositoryResult<Analysis>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("application_analyses")
    .upsert(
      {
        application_id: applicationId,
        user_id: userId,
        requirements: result.requirements,
        match_score: result.matchScore,
        matched_skills: result.matchedSkills,
        missing_skills: result.missingSkills,
        tips: result.tips,
        created_at: new Date().toISOString(),
      },
      { onConflict: "application_id" },
    )
    .select(ANALYSIS_COLUMNS)
    .single();
  if (error) {
    return { ok: false };
  }
  return { ok: true, data: toAnalysis(data) };
}
