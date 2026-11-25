import { z } from "zod";
import { isIsoDate } from "./dates";
import { APPLICATION_STATUSES, type ApplicationStatus } from "./status";

/** Mirror the check constraints on `applications` in supabase/migrations/0001_initial_schema.sql. */
export const COMPANY_MAX_LENGTH = 200;
export const ROLE_MAX_LENGTH = 200;
export const JOB_URL_MAX_LENGTH = 2048;
export const JOB_DESCRIPTION_MAX_LENGTH = 50000;
export const NOTES_MAX_LENGTH = 10000;

const HTTP_URL_PATTERN = /^https?:\/\//i;

/** Absolute http(s) URL. The prefix check matches the database constraint exactly. */
function isHttpUrl(value: string): boolean {
  return HTTP_URL_PATTERN.test(value) && URL.canParse(value);
}

function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

function requiredText(label: string, maxLength: number) {
  return z
    .string({ error: `${label} must be text.` })
    .trim()
    .min(1, `${label} is required.`)
    .max(maxLength, `${label} must be at most ${maxLength} characters.`);
}

function optionalText(label: string, maxLength: number) {
  return z
    .string({ error: `${label} must be text.` })
    .trim()
    .max(maxLength, `${label} must be at most ${maxLength} characters.`);
}

export const applicationStatusSchema = z.enum(APPLICATION_STATUSES, { error: "Choose a valid status." });

export const applicationIdSchema = z.uuid({ error: "Invalid application id." });

export const applicationInputSchema = z.object({
  company: requiredText("Company", COMPANY_MAX_LENGTH),
  role: requiredText("Role", ROLE_MAX_LENGTH),
  jobUrl: optionalText("Job URL", JOB_URL_MAX_LENGTH)
    .refine((value) => value === "" || isHttpUrl(value), {
      error: "Enter a full URL starting with http:// or https://.",
    })
    .transform(emptyToNull),
  jobDescription: optionalText("Job description", JOB_DESCRIPTION_MAX_LENGTH),
  status: applicationStatusSchema,
  appliedDate: z
    .string({ error: "Applied date must be text." })
    .trim()
    .refine((value) => value === "" || isIsoDate(value), { error: "Enter a valid date (YYYY-MM-DD)." })
    .transform(emptyToNull),
  notes: optionalText("Notes", NOTES_MAX_LENGTH).transform(emptyToNull),
});

export const statusChangeSchema = z.object({
  id: applicationIdSchema,
  status: applicationStatusSchema,
});

export type ApplicationInput = z.infer<typeof applicationInputSchema>;
export type ApplicationField = keyof ApplicationInput;
export type StatusChange = z.infer<typeof statusChangeSchema>;

/** A saved application. Dates are `YYYY-MM-DD`; timestamps are ISO strings from the database. */
export type Application = {
  id: string;
  company: string;
  role: string;
  jobUrl: string | null;
  jobDescription: string;
  status: ApplicationStatus;
  appliedDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

/** What the board shows for each application. */
export type ApplicationSummary = Pick<Application, "id" | "company" | "role" | "status" | "appliedDate">;
