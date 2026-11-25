import { formatIsoDate } from "@/features/applications/domain/dates";
import { analysisDay, type Analysis } from "../domain/analysis";
import { AnalysisList } from "./analysis-list";
import { MatchScore } from "./match-score";

/** The saved analysis: score, requirements, skills and interview tips. */
export function AnalysisResult({ analysis }: { analysis: Analysis }) {
  const day = analysisDay(analysis.createdAt);

  return (
    <div className="flex flex-col gap-5">
      <MatchScore score={analysis.matchScore} />
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Analyzed on <time dateTime={analysis.createdAt}>{formatIsoDate(day)}</time>
      </p>
      <AnalysisList title="Key requirements" items={analysis.requirements} emptyText="None identified." />
      <div className="grid gap-5 sm:grid-cols-2">
        <AnalysisList title="Matched skills" items={analysis.matchedSkills} emptyText="No matching skills found." />
        <AnalysisList title="Missing skills" items={analysis.missingSkills} emptyText="No missing skills found." />
      </div>
      <AnalysisList title="Interview-prep tips" items={analysis.tips} emptyText="No tips." ordered />
    </div>
  );
}
