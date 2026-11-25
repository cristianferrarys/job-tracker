# 003 — Auth

Previous task: 002 — Database, committed as `e0f3533` (migration applied in Supabase by the human).

## Task

Email + password auth with Supabase Auth (signup, login, logout, email confirmation) and route
protection.

## Acceptance criteria

1. Feature in `src/features/auth/` per develop.md (`domain/` with Zod credential schemas,
   `actions.ts`, `components/`); routes in `src/app` thin.
2. `/login` and `/signup`: accessible forms, field-level and generic errors, pending state,
   links between each other, responsive.
3. Server Actions `signUp`, `signIn`, `signOut` validate with Zod before Supabase; typed results
   or redirect; friendly errors; login does not reveal whether an email exists.
4. Signup handles email confirmation; `/auth/confirm` verifies `token_hash` + `type` via
   `verifyOtp`; no open redirect.
5. Proxy route protection: unauthenticated → `/login` except `/login`, `/signup`, `/auth/*`;
   authenticated on auth pages → `/`; `getClaims()` only; cookies preserved on redirects.
6. `/` is a protected placeholder ("Signed in as <email>" + sign-out); server-side user check.
7. Unit tests for schemas, actions, proxy and confirm route (happy, invalid, error,
   unauthenticated, open redirect).
8. E2E without real accounts: redirect, login form, validation errors, signup page.
9. lint/typecheck/test/build pass; no any/ts-ignore/console.log/dead code/secrets.

## Develop pass

Implemented the auth feature (domain, data repository, actions, session helper, confirm logic,
components), generic UI atoms (`TextField`, `SubmitButton`, `Alert`), routes, proxy protection
and tests (139 unit, 9 E2E). Removed five unreferenced create-next-app SVGs.

## Testing rounds

| Round | Verdict | Failed guidelines | Summary |
|---|---|---|---|
| 1 | FAIL | G7 | E2E `auth.spec.ts:23` failed every run: unfiltered `getByRole("alert")` also matched Next's route announcer (strict-mode violation). App behavior correct. |
| 2 | PASS | — | Locator filtered by text. All gates re-verified; E2E 9/9 passed in two consecutive runs. |

## Notes

- `components/current-user-panel.tsx` uses the server-only `session.ts` helper, which calls
  `data/` directly rather than via `actions`. Accepted by Testing (same feature, server-only);
  worth documenting in develop.md.
- `session.ts`, `confirm-email.ts` and `src/test/auth-mocks.ts` sit outside the develop.md
  folder layout without breaking a stated rule.
- `/auth/confirm` rejects `type=recovery`; there is no password reset (out of MVP scope).
- Supabase dashboard setup required by the human: Site URL, Redirect URLs, and email templates
  pointing at `/auth/confirm?token_hash={{ .TokenHash }}&type=email`.

## Final verdict

PASS (round 2). Commit: `feat: add email and password auth with route protection`
(hash recorded in git history; a file cannot contain its own commit hash).
