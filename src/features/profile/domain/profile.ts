import { z } from "zod";
import { normalizeSkills } from "./skills";

/** Mirrors `profiles_summary_length` in the database. */
export const PROFILE_SUMMARY_MAX_LENGTH = 5000;
/** Stricter than `profiles_skills_count` (100) in the database. */
export const PROFILE_SKILLS_MAX_COUNT = 50;
/** Application limit per tag; the database does not constrain tag length. */
export const PROFILE_SKILL_MAX_LENGTH = 50;

const summarySchema = z
  .string({ error: "Summary must be text." })
  .trim()
  .max(PROFILE_SUMMARY_MAX_LENGTH, `Summary must be at most ${PROFILE_SUMMARY_MAX_LENGTH} characters.`);

const skillsSchema = z
  .array(z.string({ error: "Skills must be text." }), { error: "Skills must be a list." })
  .transform(normalizeSkills)
  .pipe(
    z
      .array(z.string())
      .max(PROFILE_SKILLS_MAX_COUNT, `Add at most ${PROFILE_SKILLS_MAX_COUNT} skills.`)
      .refine((skills) => skills.every((skill) => skill.length <= PROFILE_SKILL_MAX_LENGTH), {
        error: `Each skill must be at most ${PROFILE_SKILL_MAX_LENGTH} characters.`,
      }),
  );

export const profileInputSchema = z.object({
  summary: summarySchema,
  skills: skillsSchema,
});

export type ProfileInput = z.infer<typeof profileInputSchema>;
export type ProfileField = keyof ProfileInput;

/** A saved profile. `updatedAt` is an ISO timestamp from the database. */
export type Profile = ProfileInput & { updatedAt: string };
