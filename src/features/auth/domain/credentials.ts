import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
/** Supabase hashes passwords with bcrypt, which ignores bytes beyond 72. */
export const PASSWORD_MAX_LENGTH = 72;

const emailSchema = z
  .string({ error: "Email is required." })
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .pipe(z.email({ error: "Enter a valid email address." }));

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string({ error: "Password is required." }).min(1, "Password is required."),
});

export const signUpSchema = z.object({
  email: emailSchema,
  password: z
    .string({ error: "Password is required." })
    .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`)
    .max(PASSWORD_MAX_LENGTH, `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`),
});

export type Credentials = z.infer<typeof signInSchema>;
export type CredentialsField = keyof Credentials;
