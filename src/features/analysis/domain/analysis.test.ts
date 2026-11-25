import { describe, expect, it } from "vitest";
import { buildAnalysisResult } from "@/test/analysis";
import {
  ANALYSIS_RESPONSE_JSON_SCHEMA,
  analysisDay,
  analysisResultSchema,
  ITEM_MAX_LENGTH,
  MATCH_SCORE_MAX,
  MATCH_SCORE_MIN,
  parseAnalysisResult,
  REQUIREMENTS_MAX_COUNT,
  SKILLS_MAX_COUNT,
  TIP_MAX_LENGTH,
  TIPS_COUNT,
} from "./analysis";

const VALID = buildAnalysisResult();

function items(count: number, prefix = "item"): string[] {
  return Array.from({ length: count }, (_, index) => `${prefix} ${index}`);
}

function accepts(value: unknown): boolean {
  return analysisResultSchema.safeParse(value).success;
}

describe("analysisResultSchema", () => {
  it("accepts a valid result and trims every text", () => {
    const parsed = analysisResultSchema.parse({ ...VALID, requirements: ["  React  "], tips: VALID.tips.map((tip) => ` ${tip} `) });

    expect(parsed).toEqual({ ...VALID, requirements: ["React"] });
  });

  it("accepts empty requirement and skill lists", () => {
    expect(accepts({ ...VALID, requirements: [], matchedSkills: [], missingSkills: [] })).toBe(true);
  });

  it.each([MATCH_SCORE_MIN, MATCH_SCORE_MAX])("accepts the boundary score %i", (matchScore) => {
    expect(accepts({ ...VALID, matchScore })).toBe(true);
  });

  it.each([
    ["below the range", MATCH_SCORE_MIN - 1],
    ["above the range", MATCH_SCORE_MAX + 1],
    ["not an integer", 72.5],
    ["a numeric string", "72"],
  ])("rejects a score %s", (_case, matchScore) => {
    expect(accepts({ ...VALID, matchScore })).toBe(false);
  });

  it.each([TIPS_COUNT - 1, TIPS_COUNT + 1])("rejects %i tips", (count) => {
    expect(accepts({ ...VALID, tips: items(count, "tip") })).toBe(false);
  });

  it.each(["requirements", "matchedSkills", "missingSkills", "tips"] as const)(
    "rejects a blank entry in %s",
    (field) => {
      const list = [...VALID[field]];
      list[0] = "   ";
      expect(accepts({ ...VALID, [field]: list })).toBe(false);
    },
  );

  it.each([
    ["requirements", REQUIREMENTS_MAX_COUNT],
    ["matchedSkills", SKILLS_MAX_COUNT],
    ["missingSkills", SKILLS_MAX_COUNT],
  ] as const)("bounds the number of %s to %i", (field, max) => {
    expect(accepts({ ...VALID, [field]: items(max) })).toBe(true);
    expect(accepts({ ...VALID, [field]: items(max + 1) })).toBe(false);
  });

  it("bounds the length of each list item and each tip", () => {
    expect(accepts({ ...VALID, matchedSkills: ["a".repeat(ITEM_MAX_LENGTH)] })).toBe(true);
    expect(accepts({ ...VALID, matchedSkills: ["a".repeat(ITEM_MAX_LENGTH + 1)] })).toBe(false);
    expect(accepts({ ...VALID, tips: [...VALID.tips.slice(1), "a".repeat(TIP_MAX_LENGTH)] })).toBe(true);
    expect(accepts({ ...VALID, tips: [...VALID.tips.slice(1), "a".repeat(TIP_MAX_LENGTH + 1)] })).toBe(false);
  });

  it("rejects a result with a missing field or a non-list field", () => {
    const withoutTips: Record<string, unknown> = { ...VALID };
    delete withoutTips.tips;

    expect(accepts(withoutTips)).toBe(false);
    expect(accepts({ ...VALID, requirements: "React" })).toBe(false);
  });
});

describe("ANALYSIS_RESPONSE_JSON_SCHEMA", () => {
  it("requires exactly the fields the Zod schema parses", () => {
    const fields = Object.keys(analysisResultSchema.shape).sort();

    expect(Object.keys(ANALYSIS_RESPONSE_JSON_SCHEMA.properties).sort()).toEqual(fields);
    expect([...ANALYSIS_RESPONSE_JSON_SCHEMA.required].sort()).toEqual(fields);
  });

  it("allows at most as many list items as the Zod schema accepts", () => {
    const { properties } = ANALYSIS_RESPONSE_JSON_SCHEMA;
    for (const field of ["requirements", "matchedSkills", "missingSkills"] as const) {
      expect(accepts({ ...VALID, [field]: items(properties[field].maxItems) })).toBe(true);
      expect(accepts({ ...VALID, [field]: items(properties[field].maxItems + 1) })).toBe(false);
    }
    expect(accepts({ ...VALID, tips: items(properties.tips.minItems, "tip") })).toBe(true);
  });

  it("bounds the score to the range the Zod schema accepts", () => {
    const { minimum, maximum } = ANALYSIS_RESPONSE_JSON_SCHEMA.properties.matchScore;

    expect(accepts({ ...VALID, matchScore: minimum })).toBe(true);
    expect(accepts({ ...VALID, matchScore: maximum })).toBe(true);
    expect(accepts({ ...VALID, matchScore: minimum - 1 })).toBe(false);
    expect(accepts({ ...VALID, matchScore: maximum + 1 })).toBe(false);
  });
});

describe("parseAnalysisResult", () => {
  it("parses valid JSON text into the result", () => {
    expect(parseAnalysisResult(JSON.stringify(VALID))).toEqual(VALID);
  });

  it.each([
    ["malformed JSON", '{"matchScore": 72,'],
    ["plain prose", "Here is your analysis: great match!"],
    ["an empty string", ""],
    ["a JSON array", "[]"],
    ["JSON null", "null"],
    ["schema-invalid JSON", JSON.stringify({ ...VALID, matchScore: 140 })],
  ])("returns null for %s", (_case, text) => {
    expect(parseAnalysisResult(text)).toBeNull();
  });
});

describe("analysisDay", () => {
  it.each([
    ["2026-11-24T10:00:00Z", "2026-11-24"],
    ["2026-11-24T23:30:00.123456+00:00", "2026-11-24"],
    ["2026-11-25T01:00:00+03:00", "2026-11-24"],
  ])("returns the UTC day of %s", (createdAt, day) => {
    expect(analysisDay(createdAt)).toBe(day);
  });
});
