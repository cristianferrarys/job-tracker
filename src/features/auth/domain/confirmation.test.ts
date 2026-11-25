import { describe, expect, it } from "vitest";
import { emailConfirmationSchema } from "./confirmation";

describe("emailConfirmationSchema", () => {
  it.each(["signup", "email", "email_change"])("accepts a token hash with type %s", (type) => {
    const result = emailConfirmationSchema.safeParse({ tokenHash: "abc123", type });

    expect(result).toEqual({ success: true, data: { tokenHash: "abc123", type } });
  });

  it("rejects a missing or blank token hash", () => {
    expect(emailConfirmationSchema.safeParse({ tokenHash: null, type: "signup" }).success).toBe(false);
    expect(emailConfirmationSchema.safeParse({ tokenHash: "  ", type: "signup" }).success).toBe(false);
  });

  it("rejects unsupported or missing types", () => {
    expect(emailConfirmationSchema.safeParse({ tokenHash: "abc", type: "recovery" }).success).toBe(false);
    expect(emailConfirmationSchema.safeParse({ tokenHash: "abc", type: null }).success).toBe(false);
  });
});
