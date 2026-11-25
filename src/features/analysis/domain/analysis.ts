import { z } from "zod";

/** Mirrors `application_analyses_tips_count` in the database. */
export const TIPS_COUNT = 3;
/** Mirrors `application_analyses_match_score_range` in the database. */
export const MATCH_SCORE_MIN = 0;
export const MATCH_SCORE_MAX = 100;

/** Application limits on what the model may return; the database does not bound them. */
export const REQUIREMENTS_MAX_COUNT = 12;
export const SKILLS_MAX_COUNT = 30;
export const ITEM_MAX_LENGTH = 200;
export const TIP_MAX_LENGTH = 500;

function boundedText(maxLength: number) {
  return z.string().trim().min(1).max(maxLength);
}

function boundedList(maxCount: number) {
  return z.array(boundedText(ITEM_MAX_LENGTH)).max(maxCount);
}

/** The analysis the model must return. Its output is untrusted until it passes this schema. */
export const analysisResultSchema = z.object({
  requirements: boundedList(REQUIREMENTS_MAX_COUNT),
  matchScore: z.number().int().min(MATCH_SCORE_MIN).max(MATCH_SCORE_MAX),
  matchedSkills: boundedList(SKILLS_MAX_COUNT),
  missingSkills: boundedList(SKILLS_MAX_COUNT),
  tips: z.array(boundedText(TIP_MAX_LENGTH)).length(TIPS_COUNT),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

/** A saved analysis. `createdAt` is the ISO timestamp of the latest run. */
export type Analysis = AnalysisResult & { applicationId: string; createdAt: string };

function stringList(maxItems: number, minItems = 0) {
  return { type: "array", items: { type: "string" }, minItems, maxItems };
}

/**
 * The same shape as `analysisResultSchema`, as the JSON Schema subset Gemini structured output
 * accepts (`responseJsonSchema`). Text lengths are not supported there, so Zod still enforces them.
 */
export const ANALYSIS_RESPONSE_JSON_SCHEMA = {
  type: "object",
  properties: {
    requirements: stringList(REQUIREMENTS_MAX_COUNT),
    matchScore: { type: "integer", minimum: MATCH_SCORE_MIN, maximum: MATCH_SCORE_MAX },
    matchedSkills: stringList(SKILLS_MAX_COUNT),
    missingSkills: stringList(SKILLS_MAX_COUNT),
    tips: stringList(TIPS_COUNT, TIPS_COUNT),
  },
  required: ["requirements", "matchScore", "matchedSkills", "missingSkills", "tips"],
  propertyOrdering: ["requirements", "matchScore", "matchedSkills", "missingSkills", "tips"],
  additionalProperties: false,
} as const;

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/** Parses the model's JSON text. `null` for malformed JSON or anything that breaks the schema. */
export function parseAnalysisResult(text: string): AnalysisResult | null {
  const result = analysisResultSchema.safeParse(parseJson(text));
  return result.success ? result.data : null;
}

/** The calendar day (`YYYY-MM-DD`, UTC) of an analysis timestamp. */
export function analysisDay(createdAt: string): string {
  return new Date(createdAt).toISOString().slice(0, 10);
}
