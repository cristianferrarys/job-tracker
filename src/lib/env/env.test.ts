import { describe, expect, it, vi } from "vitest";
import { getPublicEnv } from "./public";
import { getServerEnv } from "./server";

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

  it("throws a clear error when GEMINI_API_KEY is missing", () => {
    stubPublicEnv();
    vi.stubEnv("GEMINI_API_KEY", undefined);

    expect(() => getServerEnv()).toThrow(/GEMINI_API_KEY/);
  });
});
