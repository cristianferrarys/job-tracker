import type { BoardColumn as Column } from "../domain/board";
import { ApplicationCard } from "./application-card";

/** One status column with its count; an empty column says so. */
export function BoardColumn({ column }: { column: Column }) {
  const headingId = `column-${column.status}`;
  const count = column.applications.length;

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-center justify-between gap-2">
        <h2 id={headingId} className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {column.label}
        </h2>
        <p className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-sm font-medium text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
          {count}
          <span className="sr-only"> {count === 1 ? "application" : "applications"}</span>
        </p>
      </div>
      {count === 0 ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-400">No applications in this stage.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {column.applications.map((application) => (
            <li key={application.id}>
              <ApplicationCard application={application} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
