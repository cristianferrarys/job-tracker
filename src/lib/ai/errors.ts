import "server-only";
import { ApiError } from "@google/genai";

/**
 * Why an AI call failed, without any detail from the provider:
 * - `rate_limited`: 429 / RESOURCE_EXHAUSTED (requests per minute or the free quota is used up).
 * - `unavailable`: missing or rejected API key, or a model that does not exist (configuration).
 * - `empty`: the call succeeded but returned no text.
 * - `failed`: any other API, network or timeout error.
 */
export type AiFailureReason = "rate_limited" | "unavailable" | "empty" | "failed";

const RATE_LIMIT_STATUS = 429;
const CONFIGURATION_STATUSES = new Set([401, 403, 404]);
const INVALID_KEY_PATTERN = /API_KEY_INVALID|API key not valid/i;

export function classifyAiError(error: unknown): AiFailureReason {
  if (!(error instanceof ApiError)) {
    return "failed";
  }
  if (error.status === RATE_LIMIT_STATUS || error.message.includes("RESOURCE_EXHAUSTED")) {
    return "rate_limited";
  }
  if (CONFIGURATION_STATUSES.has(error.status) || INVALID_KEY_PATTERN.test(error.message)) {
    return "unavailable";
  }
  return "failed";
}
