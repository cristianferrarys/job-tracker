# 004-2 — Sign out only the current session

## Task

Bug reported by the human: `signOut()` used Supabase's default `scope: "global"`
(`@supabase/auth-js` `GoTrueClient.signOut(options = { scope: 'global' })`), revoking every
session of the account. The demo account is shared by several reviewers, so signing out must
end only the current session.

## Acceptance criteria

1. Sign-out uses `scope: "local"` as a named constant.
2. Unit test asserts Supabase `signOut` is called with `{ scope: "local" }` and the user ends at
   `/login`; it must fail if the scope is removed or set to `"global"`.
3. E2E: remove the special sign-out project/ordering that only existed because of global
   sign-out; the sign-out spec uses its own login and must not break the parallel signed-in specs.
4. No comments/docs still claim sign-out ends all sessions.
5. lint/typecheck/test/build/e2e pass.

## Develop pass

`SIGN_OUT_SCOPE: SignOutScope = "local"` in `src/features/auth/data/auth-repository.ts`. The
constant stays private and the test writes `"local"` literally, so the test can catch a change of
value (importing it would make the assertion pass for any value). Develop proved the test fails
with `"global"` and with no argument, then restored the code. E2E ordering simplification is
part of the 004-1 commit (same files).

## Testing rounds

Reviewed together with 004-1 in the same working tree.

| Round | Verdict | Failed guidelines | Summary |
|---|---|---|---|
| 1 | PASS | — | Criteria met by code review; sign-out E2E skipped (no E2E credentials yet). Literal `"local"` in the test accepted under G6/G17. |
| 2 | FAIL | G7, G16 | Sign-out spec login rejected ("Invalid email or password."): wrong E2E password in `.env.local`. Environment issue, not sent to Develop; the human fixed the password. |
| 3 | PASS | — | Sign-out spec passed in 3 runs, in parallel with signed-in specs, which kept working: local scope verified. |
| 4 | PASS | — | Re-verified: 180 unit tests, 3 × 18/18 E2E with 0 skipped. |

## Final verdict

PASS (round 4). Commit: `fix: sign out only the current session`
(hash recorded in git history; a file cannot contain its own commit hash).
