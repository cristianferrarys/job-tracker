import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "./credentials";

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
  it("accepts a valid email and a password of at least 8 characters", () => {
    const result = signUpSchema.safeParse({ email: " New@Example.com", password: "12345678" });

    expect(result).toEqual({ success: true, data: { email: "new@example.com", password: "12345678" } });
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = signUpSchema.safeParse({ email: "new@example.com", password: "1234567" });

    expect(fieldErrors(result)).toEqual([["password", "Password must be at least 8 characters."]]);
  });

  it("rejects a password longer than 72 characters", () => {
    const result = signUpSchema.safeParse({ email: "new@example.com", password: "a".repeat(73) });

    expect(fieldErrors(result)).toEqual([["password", "Password must be at most 72 characters."]]);
  });

  it("rejects an invalid email", () => {
    const result = signUpSchema.safeParse({ email: "new@", password: "12345678" });

    expect(fieldErrors(result)).toEqual([["email", "Enter a valid email address."]]);
  });
});
