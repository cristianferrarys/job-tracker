/**
 * Upper bound for assertions that wait on a Supabase round trip (log in, sign out, save). The
 * default 5 s expect timeout is too tight when the network to Supabase is slow.
 */
export const SUPABASE_ROUND_TRIP_TIMEOUT = 20_000;
