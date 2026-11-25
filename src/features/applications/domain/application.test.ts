import { z } from "zod";
import { describe, expect, it } from "vitest";
import { APPLICATION_ID } from "@/test/applications";
import {
  applicationIdSchema,
  applicationInputSchema,
  COMPANY_MAX_LENGTH,
  JOB_DESCRIPTION_MAX_LENGTH,
  JOB_URL_MAX_LENGTH,
  NOTES_MAX_LENGTH,
  ROLE_MAX_LENGTH,
  statusChangeSchema,
} from "./application";

const VALID_INPUT = {
  company: "Acme",
  role: "Frontend Developer",
  jobUrl: "https://jobs.example.com/acme",
  jobDescription: "Build UIs.",
  status: "interview",
  appliedDate: "2026-11-20",
  notes: "Referred by Ana.",
};

function fieldErrors(overrides: Record<string, unknown>) {
  const result = applicationInputSchema.safeParse({ ...VALID_INPUT, ...overrides });
  return result.success ? {} : z.flattenError(result.error).fieldErrors;
}

function urlOfLength(length: number): string {
  const prefix = "https://example.com/";
  return `${prefix}${"a".repeat(length - prefix.length)}`;
}

describe("applicationInputSchema", () => {
  it("accepts a complete application", () => {
    expect(applicationInputSchema.parse(VALID_INPUT)).toEqual(VALID_INPUT);
  });

  it("trims every text field", () => {
    const parsed = applicationInputSchema.parse({
      company: "  Acme ",
      role: "\tDev \n",
      jobUrl: " https://acme.dev/jobs ",
      jobDescription: "  Build UIs.  ",
      status: "offer",
      appliedDate: " 2026-01-31 ",
      notes: "  Call back  ",
    });

    expect(parsed).toEqual({
      company: "Acme",
      role: "Dev",
      jobUrl: "https://acme.dev/jobs",
      jobDescription: "Build UIs.",
      status: "offer",
      appliedDate: "2026-01-31",
      notes: "Call back",
    });
  });

  it("stores empty optional fields as null and keeps an empty description", () => {
    const parsed = applicationInputSchema.parse({
      ...VALID_INPUT,
      jobUrl: "  ",
      jobDescription: " ",
      appliedDate: "",
      notes: "   ",
    });

    expect(parsed).toMatchObject({ jobUrl: null, jobDescription: "", appliedDate: null, notes: null });
  });

  it("requires company and role, also when they are only whitespace", () => {
    expect(fieldErrors({ company: "", role: "   " })).toEqual({
      company: ["Company is required."],
      role: ["Role is required."],
    });
  });

  it.each([
    ["company", COMPANY_MAX_LENGTH, "Company"],
    ["role", ROLE_MAX_LENGTH, "Role"],
    ["jobDescription", JOB_DESCRIPTION_MAX_LENGTH, "Job description"],
    ["notes", NOTES_MAX_LENGTH, "Notes"],
  ])("accepts %s at its limit (after trimming) and rejects one character more", (field, limit, label) => {
    expect(fieldErrors({ [field]: ` ${"a".repeat(limit)} ` })).toEqual({});
    expect(fieldErrors({ [field]: "a".repeat(limit + 1) })).toEqual({
      [field]: [`${label} must be at most ${limit} characters.`],
    });
  });

  it("accepts a job URL at its limit and rejects one character more", () => {
    expect(fieldErrors({ jobUrl: urlOfLength(JOB_URL_MAX_LENGTH) })).toEqual({});
    expect(fieldErrors({ jobUrl: urlOfLength(JOB_URL_MAX_LENGTH + 1) })).toEqual({
      jobUrl: [`Job URL must be at most ${JOB_URL_MAX_LENGTH} characters.`],
    });
  });

  it("accepts http and https URLs in any letter case", () => {
    expect(fieldErrors({ jobUrl: "http://acme.dev" })).toEqual({});
    expect(applicationInputSchema.parse({ ...VALID_INPUT, jobUrl: "HTTPS://Acme.dev/Jobs" }).jobUrl).toBe(
      "HTTPS://Acme.dev/Jobs",
    );
  });

  it.each(["javascript:alert(1)", "JavaScript://%0aalert(1)", "ftp://acme.dev", "acme.dev/jobs", "http:acme.dev", "https://", "data:text/html,hi"])(
    "rejects %s as a job URL",
    (jobUrl) => {
      expect(fieldErrors({ jobUrl })).toEqual({
        jobUrl: ["Enter a full URL starting with http:// or https://."],
      });
    },
  );

  it.each(["2026-02-30", "2026-13-01", "2026-00-10", "26-01-01", "2026/01/01", "yesterday"])(
    "rejects %s as an applied date",
    (appliedDate) => {
      expect(fieldErrors({ appliedDate })).toEqual({ appliedDate: ["Enter a valid date (YYYY-MM-DD)."] });
    },
  );

  it("rejects an unknown status", () => {
    expect(fieldErrors({ status: "ghosted" })).toEqual({ status: ["Choose a valid status."] });
  });

  it("rejects missing or non-text fields with a message per field", () => {
    const result = applicationInputSchema.safeParse({ status: 3 });

    expect(result.success ? {} : z.flattenError(result.error).fieldErrors).toEqual({
      company: ["Company must be text."],
      role: ["Role must be text."],
      jobUrl: ["Job URL must be text."],
      jobDescription: ["Job description must be text."],
      status: ["Choose a valid status."],
      appliedDate: ["Applied date must be text."],
      notes: ["Notes must be text."],
    });
  });

  it("drops fields that are not part of the input, such as user_id", () => {
    const parsed = applicationInputSchema.parse({ ...VALID_INPUT, user_id: "attacker", id: "x" });

    expect(parsed).not.toHaveProperty("user_id");
    expect(parsed).not.toHaveProperty("id");
  });
});

describe("applicationIdSchema", () => {
  it("accepts a UUID", () => {
    expect(applicationIdSchema.parse(APPLICATION_ID)).toBe(APPLICATION_ID);
  });

  it.each(["", "123", "not-a-uuid", `${APPLICATION_ID}x`, "../profile"])("rejects %j", (id) => {
    expect(applicationIdSchema.safeParse(id).success).toBe(false);
  });
});

describe("statusChangeSchema", () => {
  it("accepts an id and a status", () => {
    expect(statusChangeSchema.parse({ id: APPLICATION_ID, status: "rejected" })).toEqual({
      id: APPLICATION_ID,
      status: "rejected",
    });
  });

  it("rejects an invalid id and an unknown status", () => {
    const result = statusChangeSchema.safeParse({ id: "1", status: "hired" });

    expect(result.success ? {} : z.flattenError(result.error).fieldErrors).toEqual({
      id: ["Invalid application id."],
      status: ["Choose a valid status."],
    });
  });
});
