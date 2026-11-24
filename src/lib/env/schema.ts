import { z } from "zod";

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export const serverEnvSchema = publicEnvSchema.extend({
  GEMINI_API_KEY: z.string().min(1),
});

export type PublicEnv = z.infer<typeof publicEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

type EnvSource = Record<string, string | undefined>;

function parseEnv<T extends z.ZodType>(schema: T, source: EnvSource): z.infer<T> {
  const result = schema.safeParse(source);
  if (result.success) {
    return result.data;
  }
  const problems = result.error.issues
    .map((issue) => `${issue.path.join(".")} (${issue.message})`)
    .join(", ");
  throw new Error(
    `Invalid or missing environment variables: ${problems}. Check your .env.local file (see .env.example).`,
  );
}

export function parsePublicEnv(source: EnvSource): PublicEnv {
  return parseEnv(publicEnvSchema, source);
}

export function parseServerEnv(source: EnvSource): ServerEnv {
  return parseEnv(serverEnvSchema, source);
}
