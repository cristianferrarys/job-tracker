"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import type { ActionFailure, ActionResult } from "@/lib/action-result";
import {
  getCurrentUser,
  signInWithPassword,
  signOutCurrentUser,
  signUpWithPassword,
} from "./data/auth-repository";
import { signInErrorMessage, signUpErrorMessage } from "./domain/auth-errors";
import { signInSchema, signUpSchema, type CredentialsField } from "./domain/credentials";
import { HOME_PATH, LOGIN_PATH } from "./domain/route-access";
import type { SignUpData } from "./domain/types";

/** A failed auth form submission. `email` lets the form keep what the user typed. */
export type AuthFailure = ActionFailure<CredentialsField> & { email: string };
export type SignInState = AuthFailure | null;
export type SignUpState = Extract<ActionResult<SignUpData>, { ok: true }> | AuthFailure | null;

const INVALID_INPUT_MESSAGE = "Please fix the highlighted fields.";

function readCredentials(formData: FormData) {
  return { email: formData.get("email"), password: formData.get("password") };
}

function submittedEmail(formData: FormData): string {
  const email = formData.get("email");
  return typeof email === "string" ? email : "";
}

function invalidInput(error: z.ZodError, email: string): AuthFailure {
  return {
    ok: false,
    error: INVALID_INPUT_MESSAGE,
    fieldErrors: z.flattenError(error).fieldErrors,
    email,
  };
}

async function redirectIfSignedIn(): Promise<void> {
  if (await getCurrentUser()) {
    redirect(HOME_PATH);
  }
}

function enterApp(): never {
  revalidatePath(HOME_PATH, "layout");
  redirect(HOME_PATH);
}

export async function signIn(_previous: SignInState, formData: FormData): Promise<SignInState> {
  await redirectIfSignedIn();
  const parsed = signInSchema.safeParse(readCredentials(formData));
  if (!parsed.success) {
    return invalidInput(parsed.error, submittedEmail(formData));
  }

  const result = await signInWithPassword(parsed.data);
  if (!result.ok) {
    return { ok: false, error: signInErrorMessage(result.code), email: parsed.data.email };
  }
  enterApp();
}

export async function signUp(_previous: SignUpState, formData: FormData): Promise<SignUpState> {
  await redirectIfSignedIn();
  const parsed = signUpSchema.safeParse(readCredentials(formData));
  if (!parsed.success) {
    return invalidInput(parsed.error, submittedEmail(formData));
  }

  const { email } = parsed.data;
  const result = await signUpWithPassword(parsed.data);
  if (!result.ok) {
    return { ok: false, error: signUpErrorMessage(result.code), email };
  }
  if (result.hasSession) {
    enterApp();
  }
  return { ok: true, data: { status: "confirmation_required", email } };
}

export async function signOut(): Promise<void> {
  if (await getCurrentUser()) {
    await signOutCurrentUser();
  }
  revalidatePath(HOME_PATH, "layout");
  redirect(LOGIN_PATH);
}
