import { describe, expect, it } from "vitest";
import { parsePublicEnv, parseServerEnv } from "./schema";

const validPublic = {
  NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-anon-key",
};

describe("parsePublicEnv", () => {
  it("returns the typed public env when every variable is valid", () => {
    expect(parsePublicEnv(validPublic)).toEqual(validPublic);
  });

  it("drops variables that are not part of the public env", () => {
    const env = parsePublicEnv({ ...validPublic, GEMINI_API_KEY: "secret" });

    expect(env).not.toHaveProperty("GEMINI_API_KEY");
  });

  it("throws naming every missing variable", () => {
    expect(() => parsePublicEnv({})).toThrow(
      /NEXT_PUBLIC_SUPABASE_URL.*NEXT_PUBLIC_SUPABASE_ANON_KEY/,
    );
  });

  it("throws when the Supabase URL is not a valid URL", () => {
    expect(() =>
      parsePublicEnv({ ...validPublic, NEXT_PUBLIC_SUPABASE_URL: "not-a-url" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it("throws when the anon key is an empty string", () => {
    expect(() =>
      parsePublicEnv({ ...validPublic, NEXT_PUBLIC_SUPABASE_ANON_KEY: "" }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  });

  it("never echoes variable values in the error message", () => {
    expect(() =>
      parsePublicEnv({ ...validPublic, NEXT_PUBLIC_SUPABASE_URL: "leaked-value" }),
    ).toThrow(expect.objectContaining({ message: expect.not.stringContaining("leaked-value") }));
  });
});

describe("parseServerEnv", () => {
  const validServer = { ...validPublic, GEMINI_API_KEY: "gemini-key" };

  it("returns public and server variables when every variable is valid", () => {
    expect(parseServerEnv(validServer)).toEqual(validServer);
  });

  it("throws when GEMINI_API_KEY is missing", () => {
    expect(() => parseServerEnv(validPublic)).toThrow(/GEMINI_API_KEY/);
  });

  it("throws when GEMINI_API_KEY is empty", () => {
    expect(() => parseServerEnv({ ...validServer, GEMINI_API_KEY: "" })).toThrow(
      /GEMINI_API_KEY/,
    );
  });

  it("throws when a public variable is invalid", () => {
    expect(() =>
      parseServerEnv({ ...validServer, NEXT_PUBLIC_SUPABASE_URL: undefined }),
    ).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});
