import "server-only";
import type { RepositoryResult } from "@/lib/repository-result";
import { createClient } from "@/lib/supabase/server";
import type { Profile, ProfileInput } from "../domain/profile";

const PROFILE_COLUMNS = "summary, skills, updated_at";

type ProfileRow = { summary: string; skills: string[]; updated_at: string };

function toProfile(row: ProfileRow): Profile {
  return { summary: row.summary, skills: row.skills, updatedAt: row.updated_at };
}

/** The user's profile, or `null` when they have not saved one yet. */
export async function findProfileByUserId(userId: string): Promise<RepositoryResult<Profile | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(PROFILE_COLUMNS)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    return { ok: false };
  }
  return { ok: true, data: data ? toProfile(data) : null };
}

/** Creates the user's profile on first save and updates it afterwards. */
export async function upsertProfile(
  userId: string,
  input: ProfileInput,
): Promise<RepositoryResult<Profile>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .upsert({ user_id: userId, summary: input.summary, skills: input.skills }, { onConflict: "user_id" })
    .select(PROFILE_COLUMNS)
    .single();
  if (error) {
    return { ok: false };
  }
  return { ok: true, data: toProfile(data) };
}
