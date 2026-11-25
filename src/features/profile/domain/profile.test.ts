import { z } from "zod";
import { describe, expect, it } from "vitest";
import {
  PROFILE_SKILL_MAX_LENGTH,
  PROFILE_SKILLS_MAX_COUNT,
  PROFILE_SUMMARY_MAX_LENGTH,
  profileInputSchema,
} from "./profile";

function fieldErrors(input: unknown) {
  const result = profileInputSchema.safeParse(input);
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

describe("profile limits", () => {
  it("match or are stricter than the database constraints", () => {
    expect(PROFILE_SUMMARY_MAX_LENGTH).toBeLessThanOrEqual(5000);
    expect(PROFILE_SKILLS_MAX_COUNT).toBeLessThanOrEqual(100);
    expect(PROFILE_SKILL_MAX_LENGTH).toBeGreaterThan(0);
  });
});

describe("profileInputSchema", () => {
  it("accepts a summary and skills", () => {
    const result = profileInputSchema.safeParse({
      summary: "Frontend developer",
      skills: ["TypeScript", "React"],
    });

    expect(result).toEqual({
      success: true,
      data: { summary: "Frontend developer", skills: ["TypeScript", "React"] },
    });
  });

  it("accepts an empty profile", () => {
    expect(profileInputSchema.parse({ summary: "", skills: [] })).toEqual({ summary: "", skills: [] });
  });

  it("trims the summary", () => {
    expect(profileInputSchema.parse({ summary: "  Backend dev \n", skills: [] }).summary).toBe(
      "Backend dev",
    );
  });

  it("normalizes and deduplicates skills case-insensitively", () => {
    const { skills } = profileInputSchema.parse({
      summary: "",
      skills: [" TypeScript ", "typescript", "", "React  Native"],
    });

    expect(skills).toEqual(["TypeScript", "React Native"]);
  });

  it("accepts a summary at the length limit, measured after trimming", () => {
    const summary = ` ${"a".repeat(PROFILE_SUMMARY_MAX_LENGTH)} `;

    expect(profileInputSchema.safeParse({ summary, skills: [] }).success).toBe(true);
  });

  it("rejects a summary over the length limit", () => {
    expect(fieldErrors({ summary: "a".repeat(PROFILE_SUMMARY_MAX_LENGTH + 1), skills: [] })).toEqual({
      summary: [`Summary must be at most ${PROFILE_SUMMARY_MAX_LENGTH} characters.`],
    });
  });

  it("rejects a skill longer than the per-tag limit with a single message", () => {
    const long = "a".repeat(PROFILE_SKILL_MAX_LENGTH + 1);

    expect(fieldErrors({ summary: "", skills: [long, `${long}b`] })).toEqual({
      skills: [`Each skill must be at most ${PROFILE_SKILL_MAX_LENGTH} characters.`],
    });
  });

  it("accepts a skill at the per-tag limit", () => {
    const skill = "a".repeat(PROFILE_SKILL_MAX_LENGTH);

    expect(profileInputSchema.parse({ summary: "", skills: [skill] }).skills).toEqual([skill]);
  });

  it("accepts the maximum number of skills", () => {
    const skills = Array.from({ length: PROFILE_SKILLS_MAX_COUNT }, (_, index) => `skill-${index}`);

    expect(profileInputSchema.parse({ summary: "", skills }).skills).toHaveLength(PROFILE_SKILLS_MAX_COUNT);
  });

  it("rejects more skills than the limit", () => {
    const skills = Array.from({ length: PROFILE_SKILLS_MAX_COUNT + 1 }, (_, index) => `skill-${index}`);

    expect(fieldErrors({ summary: "", skills })).toEqual({
      skills: [`Add at most ${PROFILE_SKILLS_MAX_COUNT} skills.`],
    });
  });

  it("counts skills after removing duplicates", () => {
    const skills = [
      ...Array.from({ length: PROFILE_SKILLS_MAX_COUNT }, (_, index) => `skill-${index}`),
      "SKILL-0",
    ];

    expect(profileInputSchema.safeParse({ summary: "", skills }).success).toBe(true);
  });

  it("rejects values of the wrong type", () => {
    expect(fieldErrors({ summary: null, skills: [42] })).toEqual({
      summary: ["Summary must be text."],
      skills: ["Skills must be text."],
    });
  });
});
