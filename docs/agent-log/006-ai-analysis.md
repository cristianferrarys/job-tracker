# 006 — AI analysis with Gemini

Previous: 005 — Applications CRUD + board, committed as `010860f`.

## Task

On an application, "Analyze" sends the job description and the user's profile to Gemini
(server-side only) and stores key requirements, match score (0–100), matched skills, missing
skills and 3 interview-prep tips. Human constraints: current `@google/genai` SDK and a free-tier
model (docs read first), key server-only, friendly rate-limit/quota errors, unit tests mock
Gemini and never call the real API.

## Acceptance criteria

1. `src/lib/ai/` Gemini client: server-only, key read only via the server env module.
2. Analysis feature: Zod result schema (each requirement non-empty and trimmed, list bounded;
   score int 0–100; skills bounded; exactly 3 tips), pure prompt builder, server-only repository
   (only place querying `application_analyses`, user-scoped, upsert by `application_id`),
   queries, actions, components.
3. Prompt safety: delimited untrusted data, ignore-instructions guard, JSON only, truncation at a
   documented constant, response schema matching Zod.
4. `analyzeApplication`: auth → UUID → own application → job description → profile → Gemini →
   Zod parse → persist → revalidate; distinct friendly errors for rate limit/quota, other API
   errors, missing/invalid key and invalid output; raw output never shown.
5. UI: Analyze/Re-analyze with pending state, accessible errors, stored analysis, empty state.
6. Unit tests mock Gemini, need no key, cover all error paths.
7. E2E never calls Gemini; checks empty state and Analyze button; deterministic cleanup.
8. All gates pass; key only in the server env module; no client import of AI/server env.

## Develop passes

- **Initial:** `@google/genai` 3.6.1; `src/lib/ai/{gemini,errors}.ts`; `analysis` feature
  (domain, repository, queries, action, 6 components); optional server-only `GEMINI_MODEL`
  override; `extra` slot on the detail section so applications does not import analysis;
  `serverExternalPackages: ["@google/genai"]` to fix cold-server navigation timeouts.
  Model: `gemini-3.5-flash-lite`, present in the SDK's model-id union type; free-tier status
  not confirmed by the bundled docs.
- **After round 1:** prompt limits built from `MATCH_SCORE_MIN`/`MATCH_SCORE_MAX`/`TIPS_COUNT`;
  per-spec E2E company prefixes (`e2e-company-crud-`, `e2e-company-analysis-`, neither a prefix
  of the other) and cleanup that skips already-deleted applications.

## Testing rounds

| Round | Verdict | Failed guidelines | Summary |
|---|---|---|---|
| 1 | FAIL | G17, G7, G16 | Prompt hardcoded 0/100/3 duplicating exported constants; applications spec cleanup (`e2e-company-*`) could delete the analysis spec's data under 4 parallel workers; G16 read "requirements non-empty" as a non-empty list. |
| 2 | PASS | — | G17 and G7 resolved. 401 unit tests with `GEMINI_API_KEY` unset; E2E 29/29 in 3 runs (first cold), 0 skipped. |

**Orchestrator decision (round 1, G16):** waived. The criterion given to Develop was
"requirements: non-empty trimmed strings, bounded count/length", i.e. each item non-empty,
which already held. Testing's report explicitly allowed this reading.

## Notes

- No live Gemini call was made by design. The model id, `responseJsonSchema` acceptance and the
  real 429/invalid-key error shapes are untested against the API; a manual "Analyze" with a real
  key is required before release.
- A Gemini 400 `INVALID_ARGUMENT` maps to the generic "could not reach the AI service" message.
- `application_analyses.created_at` now means "last analyzed at" (reset on upsert).
- Known `prefetch()` warning from `app-header.tsx:27` on `/applications/[id]`, outside this
  task; tracked for task 7.
- Old-prefix (`e2e-company-<runId>`) leftovers are no longer cleaned up by any spec.

## Final verdict

PASS (round 2). Commit: `feat: add ai job analysis with gemini`
(hash recorded in git history; a file cannot contain its own commit hash).
