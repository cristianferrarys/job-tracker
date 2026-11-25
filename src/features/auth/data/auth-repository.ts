import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Credentials } from "../domain/credentials";
import type { EmailConfirmation } from "../domain/confirmation";
import type { AuthUser } from "../domain/types";

type AuthFailure = { ok: false; code: string };

const UNKNOWN_ERROR_CODE = "unknown";

function failure(error: { code?: string }): AuthFailure {
  return { ok: false, code: error.code ?? UNKNOWN_ERROR_CODE };
}

/** Reads the user from verified JWT claims. Never trusts `getSession()` on the server. */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) {
    return null;
  }
  return { id: claims.sub, email: claims.email ?? "" };
}

export async function signInWithPassword(
  credentials: Credentials,
): Promise<{ ok: true } | AuthFailure> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(credentials);
  return error ? failure(error) : { ok: true };
}

export async function signUpWithPassword(
  credentials: Credentials,
): Promise<{ ok: true; hasSession: boolean } | AuthFailure> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp(credentials);
  return error ? failure(error) : { ok: true, hasSession: data.session !== null };
}

export async function signOutCurrentUser(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
}

export async function verifyEmailToken(
  confirmation: EmailConfirmation,
): Promise<{ ok: true } | AuthFailure> {
  const supabase = await createClient();
  const { error } = await supabase.auth.verifyOtp({
    token_hash: confirmation.tokenHash,
    type: confirmation.type,
  });
  return error ? failure(error) : { ok: true };
}
