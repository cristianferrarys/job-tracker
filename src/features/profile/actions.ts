"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireUser } from "@/features/auth/session";
import type { ActionResult } from "@/lib/action-result";
import { upsertProfile } from "./data/profile-repository";
import { profileInputSchema, type Profile, type ProfileField } from "./domain/profile";
import { PROFILE_PATH } from "./domain/routes";
import { parseSkillInput } from "./domain/skills";

export type SaveProfileState = ActionResult<Profile, ProfileField> | null;

const INVALID_INPUT_MESSAGE = "Please fix the highlighted fields.";
const SAVE_FAILED_MESSAGE = "We could not save your profile. Please try again.";

/** Saved tags plus any text left in the tag input, so typed skills are not lost on submit. */
function readSkills(formData: FormData): unknown[] {
  const draft = formData.get("skillDraft");
  return [...formData.getAll("skills"), ...(typeof draft === "string" ? parseSkillInput(draft) : [])];
}

function readProfileForm(formData: FormData) {
  return { summary: formData.get("summary"), skills: readSkills(formData) };
}

export async function saveProfile(
  _previous: SaveProfileState,
  formData: FormData,
): Promise<SaveProfileState> {
  const user = await requireUser();
  const parsed = profileInputSchema.safeParse(readProfileForm(formData));
  if (!parsed.success) {
    return {
      ok: false,
      error: INVALID_INPUT_MESSAGE,
      fieldErrors: z.flattenError(parsed.error).fieldErrors,
    };
  }

  const result = await upsertProfile(user.id, parsed.data);
  if (!result.ok) {
    return { ok: false, error: SAVE_FAILED_MESSAGE };
  }
  revalidatePath(PROFILE_PATH);
  return { ok: true, data: result.data };
}
