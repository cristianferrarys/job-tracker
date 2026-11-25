import { z } from "zod";

/** Email OTP types this app confirms through `/auth/confirm`. */
export const CONFIRMABLE_OTP_TYPES = ["signup", "email", "email_change"] as const;

export const emailConfirmationSchema = z.object({
  tokenHash: z.string().trim().min(1),
  type: z.enum(CONFIRMABLE_OTP_TYPES),
});

export type EmailConfirmation = z.infer<typeof emailConfirmationSchema>;
