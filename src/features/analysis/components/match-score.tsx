import { MATCH_SCORE_MAX } from "../domain/analysis";

/** The score as text (read by screen readers) plus a purely visual bar. */
export function MatchScore({ score }: { score: number }) {
  const percent = (score / MATCH_SCORE_MAX) * 100;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
        Match score: {score} / {MATCH_SCORE_MAX}
      </p>
      <div aria-hidden="true" className="h-3 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div className="h-full rounded-full bg-blue-700 dark:bg-blue-500" style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
