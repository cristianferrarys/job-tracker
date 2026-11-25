import "server-only";
import { requireUser } from "@/features/auth/session";
import type { RepositoryResult } from "@/lib/repository-result";
import { findProfileByUserId } from "./data/profile-repository";
import type { Profile } from "./domain/profile";

/** Loads the signed-in user's profile. Redirects to /login without a user. */
export async function getCurrentProfile(): Promise<RepositoryResult<Profile | null>> {
  const user = await requireUser();
  return findProfileByUserId(user.id);
}
