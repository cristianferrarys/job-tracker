import "server-only";
import { parseServerEnv, type ServerEnv } from "./schema";

/** Reads every env var, including secrets. Importing this from client code fails the build. */
export function getServerEnv(): ServerEnv {
  return parseServerEnv({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  });
}
