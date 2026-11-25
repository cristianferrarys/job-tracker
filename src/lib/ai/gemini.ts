import "server-only";
import { GoogleGenAI } from "@google/genai";
import { getGeminiEnv } from "@/lib/env/server";
import { classifyAiError, type AiFailureReason } from "./errors";

/**
 * Default model: a Flash-Lite model, the Gemini family with the largest free-tier quota.
 * Override it with the server-only `GEMINI_MODEL` env var when Google retires this id.
 */
export const DEFAULT_GEMINI_MODEL = "gemini-3.5-flash-lite";
/** Upper bound for one Gemini request, so a stuck call cannot hang the Server Action. */
export const GEMINI_TIMEOUT_MS = 30_000;
/** Low temperature: the analysis should be repeatable rather than creative. */
const TEMPERATURE = 0.2;

export type JsonGenerationRequest = {
  systemInstruction: string;
  contents: string;
  /** JSON Schema subset accepted by Gemini structured output. */
  responseJsonSchema: object;
};

export type JsonGenerationResult = { ok: true; text: string } | { ok: false; reason: AiFailureReason };

function readConfig(): { apiKey: string; model: string } | null {
  try {
    const env = getGeminiEnv();
    return { apiKey: env.apiKey, model: env.model ?? DEFAULT_GEMINI_MODEL };
  } catch {
    return null;
  }
}

/**
 * Asks Gemini for a JSON answer and returns its raw text, which the caller must validate.
 * Never throws: every failure comes back as a reason that carries no provider details.
 */
export async function generateJson(request: JsonGenerationRequest): Promise<JsonGenerationResult> {
  const config = readConfig();
  if (!config) {
    return { ok: false, reason: "unavailable" };
  }
  try {
    const ai = new GoogleGenAI({ apiKey: config.apiKey, httpOptions: { timeout: GEMINI_TIMEOUT_MS } });
    const response = await ai.models.generateContent({
      model: config.model,
      contents: request.contents,
      config: {
        systemInstruction: request.systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: request.responseJsonSchema,
        temperature: TEMPERATURE,
      },
    });
    const text = response.text?.trim();
    return text ? { ok: true, text } : { ok: false, reason: "empty" };
  } catch (error) {
    return { ok: false, reason: classifyAiError(error) };
  }
}
