import "server-only";
import { requireUser } from "@/features/auth/session";
import type { RepositoryResult } from "@/lib/repository-result";
import { findApplicationById, listApplicationsByUser } from "./data/applications-repository";
import { applicationIdSchema, type Application, type ApplicationSummary } from "./domain/application";

/** The signed-in user's applications. Redirects to /login without a user. */
export async function getMyApplications(): Promise<RepositoryResult<ApplicationSummary[]>> {
  const user = await requireUser();
  return listApplicationsByUser(user.id);
}

/**
 * One of the signed-in user's applications. `null` for an id that is malformed, unknown, or owned
 * by someone else, so callers cannot tell those cases apart. Redirects to /login without a user.
 */
export async function getMyApplication(id: string): Promise<RepositoryResult<Application | null>> {
  const user = await requireUser();
  const parsed = applicationIdSchema.safeParse(id);
  if (!parsed.success) {
    return { ok: true, data: null };
  }
  return findApplicationById(user.id, parsed.data);
}
