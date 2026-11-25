import "server-only";
import { applicationIdSchema } from "@/features/applications/domain/application";
import { requireUser } from "@/features/auth/session";
import type { RepositoryResult } from "@/lib/repository-result";
import { findAnalysisByApplicationId } from "./data/analysis-repository";
import type { Analysis } from "./domain/analysis";

/**
 * The analysis of one of the signed-in user's applications. `null` when there is none, or the id
 * is malformed or belongs to someone else. Redirects to /login without a user.
 */
export async function getMyAnalysis(applicationId: string): Promise<RepositoryResult<Analysis | null>> {
  const user = await requireUser();
  const parsed = applicationIdSchema.safeParse(applicationId);
  if (!parsed.success) {
    return { ok: true, data: null };
  }
  return findAnalysisByApplicationId(user.id, parsed.data);
}
