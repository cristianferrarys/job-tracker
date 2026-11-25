import { ApiError } from "@google/genai";
import { describe, expect, it, vi } from "vitest";
import { classifyAiError } from "./errors";

vi.mock("server-only", () => ({}));

function apiError(status: number, message: string): ApiError {
  return new ApiError({ status, message });
}

describe("classifyAiError", () => {
  it.each([
    ["a 429 response", apiError(429, '{"error":{"code":429,"status":"RESOURCE_EXHAUSTED"}}')],
    ["a RESOURCE_EXHAUSTED body with another status", apiError(400, "got status: RESOURCE_EXHAUSTED. quota")],
  ])("reports a rate limit for %s", (_case, error) => {
    expect(classifyAiError(error)).toBe("rate_limited");
  });

  it.each([
    ["an invalid API key", apiError(400, '{"error":{"message":"API key not valid. Please pass a valid API key."}}')],
    ["an API_KEY_INVALID reason", apiError(400, '{"error":{"details":[{"reason":"API_KEY_INVALID"}]}}')],
    ["a 401", apiError(401, "unauthenticated")],
    ["a permission error", apiError(403, '{"error":{"status":"PERMISSION_DENIED"}}')],
    ["an unknown model", apiError(404, '{"error":{"status":"NOT_FOUND"}}')],
  ])("reports the service as unavailable for %s", (_case, error) => {
    expect(classifyAiError(error)).toBe("unavailable");
  });

  it.each([
    ["a server error", apiError(500, '{"error":{"status":"INTERNAL"}}')],
    ["an overloaded model", apiError(503, '{"error":{"status":"UNAVAILABLE"}}')],
    ["a bad request", apiError(400, '{"error":{"status":"INVALID_ARGUMENT"}}')],
    ["a network failure", new TypeError("fetch failed")],
    ["a timeout", new DOMException("The operation was aborted.", "AbortError")],
    ["a thrown string", "boom"],
  ])("reports a generic failure for %s", (_case, error) => {
    expect(classifyAiError(error)).toBe("failed");
  });
});
