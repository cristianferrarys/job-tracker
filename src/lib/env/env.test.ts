import { describe, expect, it, vi } from "vitest";
import { getPublicEnv } from "./public";
import { getGeminiEnv, getServerEnv } from "./server";

vi.mock("server-only", () => ({}));

function stubPublicEnv() {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "public-anon-key");
}

describe("getPublicEnv", () => {
  it("reads only the public Supabase variables from process.env", () => {
    stubPublicEnv();
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");

    expect(getPublicEnv()).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
    });
  });

  it("throws a clear error when a public variable is missing", () => {
    stubPublicEnv();
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", undefined);

    expect(() => getPublicEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });
});

describe("getServerEnv", () => {
  it("reads public and server-only variables from process.env", () => {
    stubPublicEnv();
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");

    expect(getServerEnv()).toEqual({
      NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
      GEMINI_API_KEY: "gemini-key",
    });
  });

  it("reads the optional GEMINI_MODEL override", () => {
    stubPublicEnv();
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    vi.stubEnv("GEMINI_MODEL", "gemini-custom");

    expect(getServerEnv().GEMINI_MODEL).toBe("gemini-custom");
  });

  it("throws a clear error when GEMINI_API_KEY is missing", () => {
    stubPublicEnv();
    vi.stubEnv("GEMINI_API_KEY", undefined);

    expect(() => getServerEnv()).toThrow(/GEMINI_API_KEY/);
  });
});

describe("getGeminiEnv", () => {
  it("returns the Gemini key and model override from the server env", () => {
    stubPublicEnv();
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    vi.stubEnv("GEMINI_MODEL", "gemini-custom");

    expect(getGeminiEnv()).toEqual({ apiKey: "gemini-key", model: "gemini-custom" });
  });

  it("leaves the model unset when there is no override", () => {
    stubPublicEnv();
    vi.stubEnv("GEMINI_API_KEY", "gemini-key");
    vi.stubEnv("GEMINI_MODEL", "");

    expect(getGeminiEnv()).toEqual({ apiKey: "gemini-key", model: undefined });
  });

  it("throws when GEMINI_API_KEY is missing", () => {
    stubPublicEnv();
    vi.stubEnv("GEMINI_API_KEY", undefined);

    expect(() => getGeminiEnv()).toThrow(/GEMINI_API_KEY/);
  });
});
