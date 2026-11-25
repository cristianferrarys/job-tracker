import { describe, expect, it } from "vitest";
import {
  CONFIRMATION_FAILED_CODE,
  INVALID_CREDENTIALS_MESSAGE,
  loginNoticeMessage,
  signInErrorMessage,
  signUpErrorMessage,
} from "./auth-errors";

describe("signInErrorMessage", () => {
  it("uses the same generic message for wrong passwords and unknown users", () => {
    expect(signInErrorMessage("invalid_credentials")).toBe(INVALID_CREDENTIALS_MESSAGE);
    expect(signInErrorMessage("user_not_found")).toBe(INVALID_CREDENTIALS_MESSAGE);
    expect(signInErrorMessage("unexpected_failure")).toBe(INVALID_CREDENTIALS_MESSAGE);
  });

  it("asks the user to wait when rate limited", () => {
    expect(signInErrorMessage("over_request_rate_limit")).toMatch(/too many attempts/i);
  });

  it("asks the user to confirm the email when it is not confirmed", () => {
    expect(signInErrorMessage("email_not_confirmed")).toMatch(/confirm your email/i);
  });
});

describe("signUpErrorMessage", () => {
  it("explains a weak password", () => {
    expect(signUpErrorMessage("weak_password")).toMatch(/too weak/i);
  });

  it("suggests logging in when the account already exists", () => {
    expect(signUpErrorMessage("user_already_exists")).toMatch(/log in instead/i);
    expect(signUpErrorMessage("email_exists")).toMatch(/log in instead/i);
  });

  it("asks the user to wait when rate limited", () => {
    expect(signUpErrorMessage("over_email_send_rate_limit")).toMatch(/too many attempts/i);
  });

  it("falls back to a generic message for unknown errors", () => {
    expect(signUpErrorMessage("unexpected_failure")).toBe(
      "We could not create your account. Please try again.",
    );
  });
});

describe("loginNoticeMessage", () => {
  it("returns nothing when there is no error code", () => {
    expect(loginNoticeMessage(undefined)).toBeNull();
  });

  it("explains a failed email confirmation", () => {
    expect(loginNoticeMessage(CONFIRMATION_FAILED_CODE)).toMatch(/invalid or has expired/i);
  });

  it("never echoes an unknown code back to the page", () => {
    const message = loginNoticeMessage("<script>alert(1)</script>");

    expect(message).toBe("Something went wrong. Please try again.");
  });
});
