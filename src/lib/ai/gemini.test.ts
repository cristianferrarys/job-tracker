import { ApiError, GoogleGenAI } from "@google/genai";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_GEMINI_MODEL, GEMINI_TIMEOUT_MS, generateJson } from "./gemini";

const { generateContent } = vi.hoisted(() => ({ generateContent: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@google/genai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@google/genai")>();
  return {
    ...actual,
    GoogleGenAI: vi.fn(function FakeGoogleGenAI() {
      return { models: { generateContent } };
    }),
  };
});

const REQUEST = {
  systemInstruction: "Return JSON only.",
  contents: "<job_description>\nReact\n</job_description>",
  responseJsonSchema: { type: "object", properties: { score: { type: "integer" } } },
};

function stubEnv(geminiKey: string | undefined) {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-anon-key");
  vi.stubEnv("GEMINI_API_KEY", geminiKey);
  vi.stubEnv("GEMINI_MODEL", undefined);
}

beforeEach(() => {
  stubEnv("test-gemini-key");
  generateContent.mockResolvedValue({ text: ' {"score": 1} \n' });
});

describe("generateJson", () => {
  it("creates the client with the key from the server env and a request timeout", async () => {
    await generateJson(REQUEST);

    expect(GoogleGenAI).toHaveBeenCalledWith({ apiKey: "test-gemini-key", httpOptions: { timeout: GEMINI_TIMEOUT_MS } });
  });

  it("asks the default model for JSON matching the schema and returns the trimmed text", async () => {
    const result = await generateJson(REQUEST);

    expect(result).toEqual({ ok: true, text: '{"score": 1}' });
    expect(generateContent).toHaveBeenCalledWith({
      model: DEFAULT_GEMINI_MODEL,
      contents: REQUEST.contents,
      config: expect.objectContaining({
        systemInstruction: REQUEST.systemInstruction,
        responseMimeType: "application/json",
        responseJsonSchema: REQUEST.responseJsonSchema,
      }),
    });
  });

  it("uses the model set in GEMINI_MODEL", async () => {
    vi.stubEnv("GEMINI_MODEL", "gemini-custom-model");

    await generateJson(REQUEST);

    expect(generateContent).toHaveBeenCalledWith(expect.objectContaining({ model: "gemini-custom-model" }));
  });

  it("reports the service as unavailable and never builds a client when the key is missing", async () => {
    stubEnv(undefined);

    await expect(generateJson(REQUEST)).resolves.toEqual({ ok: false, reason: "unavailable" });
    expect(GoogleGenAI).not.toHaveBeenCalled();
    expect(generateContent).not.toHaveBeenCalled();
  });

  it.each([undefined, "", "   "])("reports an empty answer when the text is %j", async (text) => {
    generateContent.mockResolvedValue({ text });

    await expect(generateJson(REQUEST)).resolves.toEqual({ ok: false, reason: "empty" });
  });

  it("reports a rate limit without provider details when Gemini answers 429", async () => {
    generateContent.mockRejectedValue(new ApiError({ status: 429, message: '{"status":"RESOURCE_EXHAUSTED"}' }));

    await expect(generateJson(REQUEST)).resolves.toEqual({ ok: false, reason: "rate_limited" });
  });

  it("reports a rejected key as unavailable", async () => {
    generateContent.mockRejectedValue(new ApiError({ status: 400, message: "API key not valid." }));

    await expect(generateJson(REQUEST)).resolves.toEqual({ ok: false, reason: "unavailable" });
  });

  it("reports a network error as a generic failure instead of throwing", async () => {
    generateContent.mockRejectedValue(new TypeError("fetch failed"));

    await expect(generateJson(REQUEST)).resolves.toEqual({ ok: false, reason: "failed" });
  });
});

describe("gemini module", () => {
  it("cannot be imported outside the server", async () => {
    vi.doUnmock("server-only");
    vi.resetModules();

    await expect(import("./gemini")).rejects.toThrow(/cannot be imported from a Client Component/);
  });
});
