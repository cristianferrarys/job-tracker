import { Alert } from "@/components/ui/alert";
import { getMyAnalysis } from "../queries";
import { AnalysisResult } from "./analysis-result";
import { AnalyzeForm } from "./analyze-form";

/** Loads the saved analysis and shows it, or the empty state, with the control to (re)run it. */
export async function AnalysisContent({ applicationId }: { applicationId: string }) {
  const result = await getMyAnalysis(applicationId);
  if (!result.ok) {
    return <Alert tone="error">We could not load the analysis. Please refresh the page to try again.</Alert>;
  }
  const analysis = result.data;

  return (
    <div className="flex flex-col gap-5">
      {analysis ? (
        <AnalysisResult analysis={analysis} />
      ) : (
        <div className="flex flex-col gap-1">
          <p className="font-medium text-zinc-900 dark:text-zinc-50">No analysis yet</p>
          <p className="text-zinc-700 dark:text-zinc-300">
            Compare this job description with your profile to get a match score, the skills you have and
            miss, and interview-prep tips.
          </p>
        </div>
      )}
      <AnalyzeForm applicationId={applicationId} hasAnalysis={analysis !== null} />
    </div>
  );
}
