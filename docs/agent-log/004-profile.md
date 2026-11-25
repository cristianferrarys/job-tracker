# 004 — Profile

Previous: 003-1 — Fix prerender current time, committed as `2c33189`.

## Task

The user can view and edit their skills/stack profile (free-text summary + skill tags).
No signup trigger: the profile row is created on first save (upsert by `user_id`).

## Acceptance criteria

1. Feature in `src/features/profile/` (`domain/` Zod schema and pure tag helpers,
   `data/profile-repository.ts` server-only, `actions.ts`, `components/`); no import of auth's
   `data/`; uses `requireUser`.
2. `/profile` protected by proxy and `requireUser`; empty state when no row exists.
3. `saveProfile`: auth check, Zod before DB, upsert by server `user_id`, revalidation, typed
   `ActionResult` with field errors, friendly DB error.
4. Accessible form: summary textarea with character count, keyboard-operable tag input with
   "Remove X" buttons, field errors, pending state, success status; components under ~150 lines.
5. Minimal accessible header on protected pages: Home, Profile, sign-out.
6. Unit tests for domain, `saveProfile` (happy, invalid, unauthenticated, DB error) and repository.
7. E2E: unauthenticated `/profile` → `/login`.
8. lint/typecheck/test/build/e2e pass; no `blocking-prerender-*`; no any/ts-ignore/console.log.

## Develop pass

Profile feature (domain, repository, queries, action, components), shared `TextAreaField`,
`AppHeader`/`NavLink`, `SignOutButton`, and an `(app)` route group whose layout holds the header
(home page moved into it). Limits: summary 5000 chars (DB), max 50 skills (DB allows 100),
50 chars per skill (app-level). On profile load failure the form is hidden to avoid overwriting
saved data. 180 unit tests, 10 E2E.

## Testing rounds

| Round | Verdict | Failed guidelines | Summary |
|---|---|---|---|
| 1 | PASS | — | All criteria met. Lint, typecheck, 180 unit tests, build (no blocking-prerender), E2E 10/10. |

## Notes (non-failing, from Testing)

- Signed-in render of `/profile` not verified in dev; no E2E covers a signed-in user.
- `queries.ts` is outside the develop.md layout but breaks no rule; consider documenting it.
- `app-header.tsx` hardcodes `"/profile"` instead of `PROFILE_PATH`.
- "Profile saved." stays visible after further edits; a repeated save may not be re-announced.
- Skill-length error does not name the offending tag; count limit enforced only on save.
- `profile.test.ts:16-20` only compares constants to literals (weak test).
- `usePathname()` in the header will need a `<Suspense>` boundary once dynamic routes exist.

## Final verdict

PASS (round 1). Commit: `feat: add profile page with skills editor`
(hash recorded in git history; a file cannot contain its own commit hash).
