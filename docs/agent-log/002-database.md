# 002 — Database

Previous task: 001 — Tooling, committed as `809ebef`.

## Task

One SQL migration that creates the MVP schema with RLS, plus TypeScript database types wired
into the Supabase clients. No feature code.

## Acceptance criteria

1. Exactly one migration `supabase/migrations/0001_initial_schema.sql`, safe to run once in the
   Supabase SQL Editor on an empty project.
2. Tables `profiles`, `applications`, `application_analyses`, each with
   `user_id uuid not null references auth.users(id) on delete cascade`; status limited to
   `applied`/`interview`/`offer`/`rejected`; `match_score` 0–100; exactly 3 tips; length CHECKs
   on short text; company/role non-empty after trim.
3. `updated_at` trigger function with a safe `search_path`.
4. RLS enabled on every table; four owner-only policies per table (select/insert/update/delete)
   using `(select auth.uid()) = user_id`, `to authenticated`; update has USING and WITH CHECK;
   no anon policy.
5. Indexes on `applications(user_id, status)` and `application_analyses(user_id)`;
   `application_id` unique.
6. Hand-written `Database` type in Supabase CLI shape matching the migration; browser/server
   clients typed with `<Database>`.
7. Vitest test statically asserting the security contract.
8. lint/typecheck/test/build pass; no any/ts-ignore/console.log/dead code/secrets.

## Develop pass

Created the migration, `src/lib/supabase/database.types.ts` and `schema.test.ts`; typed the
browser, server and proxy clients. Beyond the criteria: unique `(id, user_id)` on
`applications` plus a composite FK from `application_analyses` to block attaching an analysis
to another user's application, and all privileges revoked from `anon`. Develop verified the
contract test catches regressions by temporarily breaking the migration four ways.

## Testing rounds

| Round | Verdict | Failed guidelines | Summary |
|---|---|---|---|
| 1 | PASS | — | All criteria met. Lint, typecheck, 53 unit tests, build and E2E smoke passed. Extras verified as correct. |

## Notes

- The SQL was validated by reading only: no local Postgres or Supabase CLI. It has not yet been
  run against a real database.
- Array columns have no per-element length limit; Zod validation in later tasks must enforce it.
- No `domain/` status type exists yet; `Constants` in `database.types.ts` is the reference until
  task 5, which should reuse it.
- No trigger creates a profile on signup; task 4 should upsert on first save.

## Final verdict

PASS (round 1). Commit: `feat: add initial database schema with rls policies`
(hash recorded in git history; a file cannot contain its own commit hash).
