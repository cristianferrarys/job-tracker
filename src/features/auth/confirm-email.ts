import "server-only";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";
import { verifyEmailToken } from "./data/auth-repository";
import { CONFIRMATION_FAILED_CODE } from "./domain/auth-errors";
import { emailConfirmationSchema } from "./domain/confirmation";
import { safeRedirectPath } from "./domain/redirect";
import { LOGIN_PATH } from "./domain/route-access";

const FAILURE_PATH = `${LOGIN_PATH}?error=${CONFIRMATION_FAILED_CODE}`;

async function confirm(searchParams: URLSearchParams): Promise<boolean> {
  const parsed = emailConfirmationSchema.safeParse({
    tokenHash: searchParams.get("token_hash"),
    type: searchParams.get("type"),
  });
  if (!parsed.success) {
    return false;
  }
  const result = await verifyEmailToken(parsed.data);
  return result.ok;
}

/** Verifies the email link token, then redirects to a same-origin path or back to /login. */
export async function handleEmailConfirmation(request: NextRequest): Promise<never> {
  const { searchParams } = request.nextUrl;
  const confirmed = await confirm(searchParams);
  redirect(confirmed ? safeRedirectPath(searchParams.get("next")) : FAILURE_PATH);
}
