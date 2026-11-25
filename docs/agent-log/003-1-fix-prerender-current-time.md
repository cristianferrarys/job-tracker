# 003-1 — Fix: blocking-prerender-current-time on `/`

Follow-up to 003 — Auth (`9a4db57`). Reported by the human while running the dev server
signed in:

```
Learn more: https://nextjs.org/docs/messages/blocking-prerender-current-time
    at HomePage (src/app/page.tsx:13:11)
> 13 |           <CurrentUserPanel />
```

## Acceptance criteria

1. Root cause identified with evidence (docs + code path).
2. Fix follows the Next 16 documented pattern and covers every server path calling Supabase
   auth, fixed once at the shared layer.
3. Reproduction before and after.
4. Behavior-focused regression unit test.
5. lint/typecheck/test/build/e2e pass; no any/ts-ignore/console.log/dead code.

## Root cause

`next.config.ts` enables `cacheComponents` and `partialPrefetching`. With partial prefetching,
`cookies()` resolves in a runtime render stage where synchronous IO such as `Date.now()` raises
`blocking-prerender-current-time`. `createClient()` awaited `cookies()`, then
`supabase.auth.getClaims()` read `Date.now()` to check the session expiry. It only fails when a
session cookie exists, and `next build` never runs that path, so the build and the
signed-out E2E tests did not catch it.

## Develop pass

`createClient()` in `src/lib/supabase/server.ts` now awaits `connection()` before `cookies()`
or any Supabase call (documented pattern in "Random values and timestamps"). Every server-side
Supabase call goes through it. Two regression tests in `server.test.ts`. Reproduced before and
after in a scratch copy with a mock Supabase server and a fake session cookie.

## Testing rounds

| Round | Verdict | Failed guidelines | Summary |
|---|---|---|---|
| 1 | PASS | — | Root cause verified independently in Next and auth-js sources. All callers covered. 141 unit tests, build, E2E 9/9 passed. |

## Notes

- No E2E test covers a signed-in user; the bug path was verified only by Develop's scratch
  reproduction. A signed-in E2E (mock Supabase wired into Playwright) is a candidate follow-up.

## Final verdict

PASS (round 1). Commit: `fix: defer supabase server client to request time`
(hash recorded in git history; a file cannot contain its own commit hash).
