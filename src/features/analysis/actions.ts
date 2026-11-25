"use server";

import { revalidatePath } from "next/cache";
import { applicationIdSchema } from "@/features/applications/domain/application";
import { applicationPath } from "@/features/applications/domain/routes";
import { getMyApplication } from "@/features/applications/queries";
import { requireUser } from "@/features/auth/session";
import { PROFILE_PATH } from "@/features/profile/domain/routes";
import { getCurrentProfile } from "@/features/profile/queries";
import type { ActionFailure, ActionResult } from "@/lib/action-result";
import type { AiFailureReason } from "@/lib/ai/errors";
import { generateJson } from "@/lib/ai/gemini";
import { upsertAnalysis } from "./data/analysis-repository";
import { ANALYSIS_RESPONSE_JSON_SCHEMA, parseAnalysisResult, type Analysis } from "./domain/analysis";
import { buildAnalysisPrompt, hasJobDescription, hasProfileContent } from "./domain/prompt";

/** A failure may point to the page where the user can fix its cause. */
export type AnalyzeFailure = ActionFailure & { fix?: { href: string; label: string } };
export type AnalyzeState = ActionResult<Analysis> | AnalyzeFailure | null;

const NOT_FOUND_MESSAGE = "This application no longer exists.";
const LOAD_FAILED_MESSAGE = "We could not load the data for the analysis. Please try again.";
const NO_JOB_DESCRIPTION_MESSAGE = "Add a job description to this application before analyzing it.";
const NO_PROFILE_MESSAGE = "Add a summary or some skills to your profile before analyzing.";
const PROFILE_FIX = { href: PROFILE_PATH, label: "Complete your profile" };
const INVALID_OUTPUT_MESSAGE = "The AI returned an answer we could not use. Please try again.";
const SAVE_FAILED_MESSAGE = "We could not save the analysis. Please try again.";

const AI_FAILURE_MESSAGES: Record<AiFailureReason, string> = {
  rate_limited: "The AI service is busy or the free quota is used up. Please try again in a minute.",
  unavailable: "AI analysis is not available right now.",
  empty: INVALID_OUTPUT_MESSAGE,
  failed: "We could not reach the AI service. Please try again.",
};

function failure(error: string): AnalyzeFailure {
  return { ok: false, error };
}

/**
 * Analyzes one of the user's applications with Gemini and saves the result, replacing any previous
 * analysis. The model's answer is validated before anything is stored and never shown raw.
 */
export async function analyzeApplication(applicationId: string): Promise<AnalyzeState> {
  const user = await requireUser();
  const id = applicationIdSchema.safeParse(applicationId);
  if (!id.success) {
    return failure(NOT_FOUND_MESSAGE);
  }

  const [application, profile] = await Promise.all([getMyApplication(id.data), getCurrentProfile()]);
  if (!application.ok || !profile.ok) {
    return failure(LOAD_FAILED_MESSAGE);
  }
  if (!application.data) {
    return failure(NOT_FOUND_MESSAGE);
  }
  if (!hasJobDescription(application.data.jobDescription)) {
    return failure(NO_JOB_DESCRIPTION_MESSAGE);
  }
  if (!hasProfileContent(profile.data)) {
    return { ...failure(NO_PROFILE_MESSAGE), fix: PROFILE_FIX };
  }

  const prompt = buildAnalysisPrompt({ jobDescription: application.data.jobDescription, profile: profile.data });
  const generated = await generateJson({ ...prompt, responseJsonSchema: ANALYSIS_RESPONSE_JSON_SCHEMA });
  if (!generated.ok) {
    return failure(AI_FAILURE_MESSAGES[generated.reason]);
  }
  const result = parseAnalysisResult(generated.text);
  if (!result) {
    return failure(INVALID_OUTPUT_MESSAGE);
  }

  const saved = await upsertAnalysis(user.id, id.data, result);
  if (!saved.ok) {
    return failure(SAVE_FAILED_MESSAGE);
  }
  revalidatePath(applicationPath(id.data));
  return { ok: true, data: saved.data };
}
