"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { HOME_PATH } from "@/features/auth/domain/route-access";
import { requireUser } from "@/features/auth/session";
import type { ActionFailure, ActionResult } from "@/lib/action-result";
import {
  deleteApplicationById,
  insertApplication,
  updateApplicationById,
  updateApplicationStatusById,
} from "./data/applications-repository";
import {
  applicationIdSchema,
  applicationInputSchema,
  statusChangeSchema,
  type Application,
  type ApplicationField,
} from "./domain/application";
import { readApplicationForm } from "./domain/form-values";
import { applicationPath } from "./domain/routes";

export type ApplicationFormState = ActionResult<Application, ApplicationField> | null;
export type StatusChangeState = ActionResult<Application, "id" | "status"> | null;
/** Deleting redirects to the board on success, so only failures come back. */
export type DeleteApplicationState = ActionFailure | null;

const INVALID_INPUT_MESSAGE = "Please fix the highlighted fields.";
const INVALID_STATUS_MESSAGE = "Choose a valid status.";
const NOT_FOUND_MESSAGE = "This application no longer exists.";
const SAVE_FAILED_MESSAGE = "We could not save the application. Please try again.";
const STATUS_FAILED_MESSAGE = "We could not change the status. Please try again.";
const DELETE_FAILED_MESSAGE = "We could not delete the application. Please try again.";

function parseInput(formData: FormData) {
  return applicationInputSchema.safeParse(readApplicationForm(formData));
}

function invalidInput(error: z.ZodError<z.output<typeof applicationInputSchema>>): ActionFailure<ApplicationField> {
  return { ok: false, error: INVALID_INPUT_MESSAGE, fieldErrors: z.flattenError(error).fieldErrors };
}

function revalidateApplication(id: string) {
  revalidatePath(HOME_PATH);
  revalidatePath(applicationPath(id));
}

export async function createApplication(
  _previous: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const user = await requireUser();
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const result = await insertApplication(user.id, parsed.data);
  if (!result.ok) {
    return { ok: false, error: SAVE_FAILED_MESSAGE };
  }
  revalidatePath(HOME_PATH);
  redirect(applicationPath(result.data.id));
}

export async function updateApplication(
  _previous: ApplicationFormState,
  formData: FormData,
): Promise<ApplicationFormState> {
  const user = await requireUser();
  const id = applicationIdSchema.safeParse(formData.get("id"));
  if (!id.success) {
    return { ok: false, error: NOT_FOUND_MESSAGE };
  }
  const parsed = parseInput(formData);
  if (!parsed.success) {
    return invalidInput(parsed.error);
  }

  const result = await updateApplicationById(user.id, id.data, parsed.data);
  if (!result.ok) {
    return { ok: false, error: SAVE_FAILED_MESSAGE };
  }
  if (!result.data) {
    return { ok: false, error: NOT_FOUND_MESSAGE };
  }
  revalidateApplication(id.data);
  return { ok: true, data: result.data };
}

/** Moves an application to any status: the board does not enforce a status order. */
export async function updateApplicationStatus(
  _previous: StatusChangeState,
  formData: FormData,
): Promise<StatusChangeState> {
  const user = await requireUser();
  const parsed = statusChangeSchema.safeParse({ id: formData.get("id"), status: formData.get("status") });
  if (!parsed.success) {
    return { ok: false, error: INVALID_STATUS_MESSAGE, fieldErrors: z.flattenError(parsed.error).fieldErrors };
  }

  const result = await updateApplicationStatusById(user.id, parsed.data.id, parsed.data.status);
  if (!result.ok) {
    return { ok: false, error: STATUS_FAILED_MESSAGE };
  }
  if (!result.data) {
    return { ok: false, error: NOT_FOUND_MESSAGE };
  }
  revalidateApplication(parsed.data.id);
  return { ok: true, data: result.data };
}

export async function deleteApplication(
  _previous: DeleteApplicationState,
  formData: FormData,
): Promise<DeleteApplicationState> {
  const user = await requireUser();
  const id = applicationIdSchema.safeParse(formData.get("id"));
  if (!id.success) {
    return { ok: false, error: NOT_FOUND_MESSAGE };
  }

  const result = await deleteApplicationById(user.id, id.data);
  if (!result.ok) {
    return { ok: false, error: DELETE_FAILED_MESSAGE };
  }
  if (!result.data) {
    return { ok: false, error: NOT_FOUND_MESSAGE };
  }
  revalidateApplication(id.data);
  redirect(HOME_PATH);
}
