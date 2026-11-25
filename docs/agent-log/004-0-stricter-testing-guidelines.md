# 004-0 — Stricter Testing guidelines

Previous: 004 — Profile, committed as `6630d99`.

## Change

Requested by the human after task 004, where Testing had reported a weak test and a hardcoded
route as notes instead of failures. Applied by the Orchestrator to `.claude/agents/testing.md`:

- **G6** now defines weak tests explicitly (cannot fail for a real bug: comparing a constant to a
  literal, asserting a mock returns what it was told, checking only that a function was called)
  and makes them a failure, not a note.
- **G17** (new): a hardcoded value that duplicates an existing exported constant (route paths,
  limits, statuses, messages) is a failure.
- "How to review" step 3 now lists G17.

## Testing rounds

None: this is a guideline change made at the human's request, not Develop work. It was applied
from Testing rounds of tasks 004-1 and 004-2 onward.

## Final verdict

Applied. Commit: `docs: make weak tests and duplicated constants testing failures`.
