import { Suspense } from "react";
import { AnalysisContent } from "./analysis-content";

/** "AI analysis" card of an application; its content streams in independently of the page. */
export function AnalysisPanel({ applicationId }: { applicationId: string }) {
  return (
    <section
      aria-labelledby="analysis-heading"
      className="flex flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <h2 id="analysis-heading" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
        AI analysis
      </h2>
      <Suspense fallback={<p role="status">Loading the analysis…</p>}>
        <AnalysisContent applicationId={applicationId} />
      </Suspense>
    </section>
  );
}
