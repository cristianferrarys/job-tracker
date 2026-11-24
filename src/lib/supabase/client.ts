import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnv } from "@/lib/env/public";

/** Supabase client for Client Components. Uses only the public env. */
export function createClient() {
  const env = getPublicEnv();
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
