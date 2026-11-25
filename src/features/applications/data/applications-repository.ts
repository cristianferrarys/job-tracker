import "server-only";
import type { RepositoryResult } from "@/lib/repository-result";
import type { Database } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/server";
import type { Application, ApplicationInput, ApplicationSummary } from "../domain/application";
import type { ApplicationStatus } from "../domain/status";

const SUMMARY_COLUMNS = "id, company, role, status, applied_date";
const APPLICATION_COLUMNS =
  "id, company, role, job_url, job_description, status, notes, applied_date, created_at, updated_at";

type ApplicationRow = Omit<Database["public"]["Tables"]["applications"]["Row"], "user_id">;
type SummaryRow = Pick<ApplicationRow, "id" | "company" | "role" | "status" | "applied_date">;
type ApplicationValues = Omit<Database["public"]["Tables"]["applications"]["Insert"], "user_id">;
type ApplicationChanges = Database["public"]["Tables"]["applications"]["Update"];

function toApplication(row: ApplicationRow): Application {
  return {
    id: row.id,
    company: row.company,
    role: row.role,
    jobUrl: row.job_url,
    jobDescription: row.job_description,
    status: row.status,
    appliedDate: row.applied_date,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toSummary(row: SummaryRow): ApplicationSummary {
  return { id: row.id, company: row.company, role: row.role, status: row.status, appliedDate: row.applied_date };
}

function toValues(input: ApplicationInput): ApplicationValues {
  return {
    company: input.company,
    role: input.role,
    job_url: input.jobUrl,
    job_description: input.jobDescription,
    status: input.status,
    applied_date: input.appliedDate,
    notes: input.notes,
  };
}

/** The user's applications, most recently applied first (undated ones last), then newest first. */
export async function listApplicationsByUser(userId: string): Promise<RepositoryResult<ApplicationSummary[]>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select(SUMMARY_COLUMNS)
    .eq("user_id", userId)
    .order("applied_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) {
    return { ok: false };
  }
  return { ok: true, data: data.map(toSummary) };
}

/** One of the user's applications, or `null` when it does not exist or belongs to someone else. */
export async function findApplicationById(
  userId: string,
  id: string,
): Promise<RepositoryResult<Application | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select(APPLICATION_COLUMNS)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) {
    return { ok: false };
  }
  return { ok: true, data: data ? toApplication(data) : null };
}

export async function insertApplication(
  userId: string,
  input: ApplicationInput,
): Promise<RepositoryResult<Application>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .insert({ ...toValues(input), user_id: userId })
    .select(APPLICATION_COLUMNS)
    .single();
  if (error) {
    return { ok: false };
  }
  return { ok: true, data: toApplication(data) };
}

/** Updates one of the user's applications. `null` when it does not exist or belongs to someone else. */
async function updateOwnApplication(
  userId: string,
  id: string,
  changes: ApplicationChanges,
): Promise<RepositoryResult<Application | null>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .update(changes)
    .eq("id", id)
    .eq("user_id", userId)
    .select(APPLICATION_COLUMNS)
    .maybeSingle();
  if (error) {
    return { ok: false };
  }
  return { ok: true, data: data ? toApplication(data) : null };
}

export function updateApplicationById(userId: string, id: string, input: ApplicationInput) {
  return updateOwnApplication(userId, id, toValues(input));
}

export function updateApplicationStatusById(userId: string, id: string, status: ApplicationStatus) {
  return updateOwnApplication(userId, id, { status });
}

/** Deletes one of the user's applications. `false` when nothing matched (missing or not theirs). */
export async function deleteApplicationById(userId: string, id: string): Promise<RepositoryResult<boolean>> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .delete()
    .eq("id", id)
    .eq("user_id", userId)
    .select("id")
    .maybeSingle();
  if (error) {
    return { ok: false };
  }
  return { ok: true, data: data !== null };
}
