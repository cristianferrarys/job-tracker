import { parsePublicEnv, type PublicEnv } from "./schema";

/**
 * Reads the env vars that are safe to ship to the browser.
 * Each variable is referenced literally so Next.js can inline it at build time.
 */
export function getPublicEnv(): PublicEnv {
  return parsePublicEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });
}
