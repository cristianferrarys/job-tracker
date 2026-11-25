import { useId } from "react";

type AnalysisListProps = { title: string; items: string[]; emptyText: string; ordered?: boolean };

/** A titled list from the analysis, with a message when the model found nothing for it. */
export function AnalysisList({ title, items, emptyText, ordered = false }: AnalysisListProps) {
  const headingId = useId();
  const List = ordered ? "ol" : "ul";

  return (
    <div className="flex flex-col gap-2">
      <h3 id={headingId} className="font-semibold text-zinc-900 dark:text-zinc-50">
        {title}
      </h3>
      {items.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">{emptyText}</p>
      ) : (
        <List
          aria-labelledby={headingId}
          className={`flex flex-col gap-1 pl-5 break-words text-zinc-800 dark:text-zinc-200 ${ordered ? "list-decimal" : "list-disc"}`}
        >
          {items.map((item, index) => (
            <li key={`${index}-${item}`}>{item}</li>
          ))}
        </List>
      )}
    </div>
  );
}
