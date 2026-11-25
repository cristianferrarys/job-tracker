import { describe, expect, it } from "vitest";
import { PASSWORD_MAX_LENGTH, PASSWORD_MIN_LENGTH, signInSchema, signUpSchema } from "./credentials";

function fieldErrors(result: { success: boolean; error?: { issues: { path: PropertyKey[]; message: string }[] } }) {
  return (result.error?.issues ?? []).map((issue) => [issue.path.join("."), issue.message]);
}

describe("signInSchema", () => {
  it("accepts a valid email and password", () => {
    const result = signInSchema.safeParse({ email: "ana@example.com", password: "x" });

    expect(result).toEqual({ success: true, data: { email: "ana@example.com", password: "x" } });
  });

  it("trims and lowercases the email", () => {
    const result = signInSchema.safeParse({ email: "  Ana@Example.COM ", password: "secret" });

    expect(result.data?.email).toBe("ana@example.com");
  });

  it("does not trim the password", () => {
    const result = signInSchema.safeParse({ email: "ana@example.com", password: " secret " });

    expect(result.data?.password).toBe(" secret ");
  });

  it("rejects an invalid email", () => {
    const result = signInSchema.safeParse({ email: "not-an-email", password: "secret" });

    expect(fieldErrors(result)).toEqual([["email", "Enter a valid email address."]]);
  });

  it("rejects empty fields with required messages", () => {
    const result = signInSchema.safeParse({ email: "   ", password: "" });

    expect(fieldErrors(result)).toEqual([
      ["email", "Email is required."],
      ["password", "Password is required."],
    ]);
  });

  it("rejects missing fields with required messages", () => {
    const result = signInSchema.safeParse({ email: null, password: null });

    expect(fieldErrors(result)).toEqual([
      ["email", "Email is required."],
      ["password", "Password is required."],
    ]);
  });
});

describe("signUpSchema", () => {
  it("accepts a valid email and a password at the minimum length", () => {
    const password = "a".repeat(PASSWORD_MIN_LENGTH);
    const result = signUpSchema.safeParse({ email: " New@Example.com", password });

    expect(result).toEqual({ success: true, data: { email: "new@example.com", password } });
  });

  it("accepts a password at the maximum length", () => {
    const password = "a".repeat(PASSWORD_MAX_LENGTH);

    expect(signUpSchema.safeParse({ email: "new@example.com", password }).success).toBe(true);
  });

  it("rejects a password shorter than the minimum length", () => {
    const password = "a".repeat(PASSWORD_MIN_LENGTH - 1);
    const result = signUpSchema.safeParse({ email: "new@example.com", password });

    expect(fieldErrors(result)).toEqual([
      ["password", `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`],
    ]);
  });

  it("rejects a password longer than the maximum length", () => {
    const password = "a".repeat(PASSWORD_MAX_LENGTH + 1);
    const result = signUpSchema.safeParse({ email: "new@example.com", password });

    expect(fieldErrors(result)).toEqual([
      ["password", `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`],
    ]);
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({ email: "new@", password: "12345678" });

    expect(fieldErrors(result)).toEqual([["email", "Enter a valid email address."]]);
  });
});
