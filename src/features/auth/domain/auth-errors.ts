export const INVALID_CREDENTIALS_MESSAGE = "Invalid email or password.";
const RATE_LIMIT_MESSAGE = "Too many attempts. Please wait a moment and try again.";
const RATE_LIMIT_CODES = new Set([
  "over_request_rate_limit",
  "over_email_send_rate_limit",
  "over_sms_send_rate_limit",
]);

/** Maps a Supabase sign-in error code to a message that never reveals whether an email exists. */
export function signInErrorMessage(code: string): string {
  if (RATE_LIMIT_CODES.has(code)) {
    return RATE_LIMIT_MESSAGE;
  }
  if (code === "email_not_confirmed") {
    return "Please confirm your email address before logging in.";
  }
  return INVALID_CREDENTIALS_MESSAGE;
}

/** Maps a Supabase sign-up error code to a user-friendly message. */
export function signUpErrorMessage(code: string): string {
  if (RATE_LIMIT_CODES.has(code)) {
    return RATE_LIMIT_MESSAGE;
  }
  if (code === "weak_password") {
    return "This password is too weak. Choose a longer, less common password.";
  }
  if (code === "user_already_exists" || code === "email_exists") {
    return "We could not create the account. If you already have one, log in instead.";
  }
  return "We could not create your account. Please try again.";
}

export const CONFIRMATION_FAILED_CODE = "confirmation_failed";

/** Builds the login notice shown for an `error` query param; unknown codes are never echoed back. */
export function loginNoticeMessage(code: string | undefined): string | null {
  if (code === undefined) {
    return null;
  }
  if (code === CONFIRMATION_FAILED_CODE) {
    return "This confirmation link is invalid or has expired. Sign up again or log in.";
  }
  return "Something went wrong. Please try again.";
}
