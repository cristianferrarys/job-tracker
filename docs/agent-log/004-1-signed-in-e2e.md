# 004-1 — Signed-in E2E and guideline compliance

## Task

Add signed-in E2E specs using `E2E_EMAIL`/`E2E_PASSWORD` from `.env.local` (skipped when unset),
and fix existing violations of the tightened G6 (weak tests) and new G17 (hardcoded values that
duplicate exported constants).

## Acceptance criteria

1. Signed-in specs read the credentials from env; if unset they skip with a clear reason and the
   rest of the suite passes.
2. One real login through `/login`, reused via a git-ignored `storageState`; signed-out specs do
   not use it.
3. Coverage: home "Signed in as <email>" and nav; profile edit summary + add tag + save + persist;
   remove tag; `/login` while signed in → `/`; sign out → `/login` and `/` → `/login` without
   invalidating the shared session.
4. Idempotent against a real project (leaves the account as found); never creates users.
5. No credentials or session files in the repo; credentials read in one helper.
6. Fix the weak test in `profile.test.ts` and the hardcoded `"/profile"` in `app-header.tsx`, plus
   any other literal duplicating a constant in `src/` and `tests/`.
7. lint/typecheck/test/build/e2e pass.

## Develop passes

- **Initial:** Playwright `setup` project + `chromium-signed-in` project with storageState in
  `playwright/.auth/` (git-ignored); credentials helper; signed-in home/profile specs and a
  sign-out spec. Removed the weak profile-limits test; replaced route, message, OTP type and limit
  literals with exported constants across app code and tests.
- **After 004-2:** separate sign-out project/ordering removed (local sign-out no longer ends the
  shared session).
- **After round 3:** profile spec waits for hydration (Summary character count reacts only once
  React runs; `toPass()` retry, no sleep), asserts the value right after filling, and captures and
  restores the account's summary and skills in `beforeAll`/`afterAll`. Added
  `SUPABASE_ROUND_TRIP_TIMEOUT` (20 s) on the three assertions that wait for Supabase.

## Testing rounds

| Round | Verdict | Failed guidelines | Summary |
|---|---|---|---|
| 1 | PASS | — | Criteria met by code review; 10 passed / 8 skipped (no E2E credentials yet). Orchestrator held the commit until the signed-in specs could run. |
| 2 | FAIL | G7, G16 | Credentials picked up, but setup login rejected ("Invalid email or password."): wrong password in `.env.local`. Environment issue, not sent to Develop; the human fixed it. |
| 3 | FAIL | G7 | Real flake: on a cold server the profile spec filled Summary before hydration, merging and persisting text; the account's real summary was overwritten. Runs 2–3 passed 18/18. |
| 4 | PASS | — | Round-3 failure resolved. 180 unit tests; 3 cold-server E2E runs 18/18 with 0 skipped; profile hash identical before and after runs. |

## Notes

- **Origin of the G6/G17 fixes (criterion 6):** both violations were first reported by Testing
  as non-failing NOTES in task 004, round 1 (`profile.test.ts:16-20` only compared constants to
  literals; `app-header.tsx` hardcoded `"/profile"` instead of `PROFILE_PATH`). At that time G6
  did not define weak tests as failures and G17 did not exist, so task 004 passed. The human then
  tightened the guidelines (004-0), and Develop fixed both issues in this task before its first
  review. No 004-1 round failed on G6 or G17; the rounds below are recorded as they happened.
- The account's original summary was overwritten during round 3, before the restore existed; the
  human must reset it manually once.
- The removed weak test was the only link between `PROFILE_*` limits and the DB constraints; a
  migration-based test could restore that coverage.
- The spec cannot add its tag if the account ever holds 50 skills (the app limit).

## Final verdict

PASS (round 4). Commit: `test: add signed-in e2e specs and replace hardcoded constants`
(hash recorded in git history; a file cannot contain its own commit hash).
