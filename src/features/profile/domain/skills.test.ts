import { describe, expect, it } from "vitest";
import { addSkills, normalizeSkill, normalizeSkills, parseSkillInput, removeSkill } from "./skills";

describe("normalizeSkill", () => {
  it("trims and collapses inner whitespace", () => {
    expect(normalizeSkill("  React \t  Native ")).toBe("React Native");
  });
});

describe("normalizeSkills", () => {
  it("trims tags and drops empty ones", () => {
    expect(normalizeSkills([" TypeScript ", "", "   ", "SQL"])).toEqual(["TypeScript", "SQL"]);
  });

  it("removes case-insensitive duplicates, keeping the first spelling", () => {
    expect(normalizeSkills(["React", "react", " REACT ", "Node.js"])).toEqual(["React", "Node.js"]);
  });

  it("returns an empty list for no tags", () => {
    expect(normalizeSkills([])).toEqual([]);
  });
});

describe("parseSkillInput", () => {
  it("splits a comma-separated input into normalized tags", () => {
    expect(parseSkillInput("TypeScript, React ,,  sql")).toEqual(["TypeScript", "React", "sql"]);
  });

  it("deduplicates within the input", () => {
    expect(parseSkillInput("Go, go, GO")).toEqual(["Go"]);
  });

  it("returns an empty list for blank input", () => {
    expect(parseSkillInput(" , ,  ")).toEqual([]);
  });
});

describe("addSkills", () => {
  it("appends the new tags after the current ones", () => {
    expect(addSkills(["TypeScript"], "React, Next.js")).toEqual(["TypeScript", "React", "Next.js"]);
  });

  it("ignores tags that already exist in another case", () => {
    expect(addSkills(["TypeScript"], "typescript, Docker")).toEqual(["TypeScript", "Docker"]);
  });

  it("keeps the current tags when the input is blank", () => {
    expect(addSkills(["SQL"], "  ")).toEqual(["SQL"]);
  });
});

describe("removeSkill", () => {
  it("removes the matching tag", () => {
    expect(removeSkill(["TypeScript", "React"], "TypeScript")).toEqual(["React"]);
  });

  it("returns the same tags when the skill is not present", () => {
    expect(removeSkill(["React"], "Vue")).toEqual(["React"]);
  });
});
