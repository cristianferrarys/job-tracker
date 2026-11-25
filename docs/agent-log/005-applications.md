# 005 — Applications CRUD + board

Previous: 004-1 log note, committed as `02571e0`.

## Task

Applications CRUD and a board grouping applications by status.

## Acceptance criteria

1. Feature `src/features/applications/` (domain with Zod schema using every DB limit once, status
   from `Constants.public.Enums.application_status`, ordered columns, pure grouping, timezone-safe
   `applied_date`; server-only repository scoped by user id; queries; actions; components).
2. Thin protected routes: `/` board, `/applications/new`, `/applications/[id]` (detail, safe
   external job URL, edit, delete); unknown or other-user id → identical `notFound()`; header nav
   via route constants with `usePathname()` inside `<Suspense>`.
3. Actions create/update/delete/updateStatus: auth check, Zod (UUID id) before DB, server user
   id, typed `ActionResult`, friendly errors, revalidation, redirects.
4. Board: ordered columns with counts, cards, accessible status change (any status allowed,
   documented), empty states, responsive, loading and error states.
5. Forms with labels, field errors, pending, cancel, description char count; accessible delete
   confirmation (not `window.confirm`).
6. Behavior-focused unit tests for schema, grouping, actions and repository.
7. E2E: signed-out redirects; signed-in full flow with cleanup, deterministic on a cold server.
8. lint/typecheck/test/build/e2e pass; no blocking-prerender; components under ~150 lines.

## Develop pass

Applications feature (domain, repository, queries, actions, 11 components), board at `/`,
create and detail routes with `not-found` and `(app)/error.tsx`, header with Board / New
application / Profile / Sign out and "Signed in as". Shared UI: `ButtonLink`, `SelectField`,
button styles, `danger` submit variant. `RepositoryResult` moved to `src/lib/` so features do
not import each other's `data/`. 290 unit tests, 28 E2E.

Decisions: any status may be chosen (no transition enforcement, to allow correcting mistakes);
board query selects only card fields; no applied-date default (reading "today" during prerender
is rejected by this setup); delete confirmation is a native modal `<dialog>`.

## Testing rounds

| Round | Verdict | Failed guidelines | Summary |
|---|---|---|---|
| 1 | PASS | — | All criteria met. 290 unit tests, build without blocking-prerender, E2E 28/28 twice (first on a cold server), 0 skipped. |

## Notes (non-failing, from Testing)

- Not-found page is a soft 404 (HTTP 200 + noindex), identical for unknown, other-user and
  malformed ids; not a security issue. Status code taken from Develop's report.
- "Changes saved." stays visible after further edits until the next submit.
- Other-user not-found is covered by unit tests only (E2E would need a second account).
- Job URL is not re-checked at render time; safety relies on Zod and the DB `^https?://` CHECK.
- `"Choose a valid status."` is duplicated as two non-exported literals.
- `domain/status.ts` imports `Constants` from the generated DB types (required by criterion 1).

## Final verdict

PASS (round 1). Commit: `feat: add applications crud and status board`
(hash recorded in git history; a file cannot contain its own commit hash).
