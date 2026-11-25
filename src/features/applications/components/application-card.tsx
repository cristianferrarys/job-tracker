import Link from "next/link";
import type { ApplicationSummary } from "../domain/application";
import { formatIsoDate } from "../domain/dates";
import { applicationPath } from "../domain/routes";
import { StatusChangeForm } from "./status-change-form";

/** Board card: company (links to the detail page), role, applied date and a status control. */
export function ApplicationCard({ application }: { application: ApplicationSummary }) {
  const titleId = `application-${application.id}-title`;

  return (
    <article
      aria-labelledby={titleId}
      className="flex flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex flex-col gap-1">
        <h3 id={titleId} className="text-base font-semibold break-words text-zinc-900 dark:text-zinc-50">
          <Link
            href={applicationPath(application.id)}
            className="rounded-sm underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            {application.company}
          </Link>
        </h3>
        <p className="text-sm break-words text-zinc-700 dark:text-zinc-300">{application.role}</p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {application.appliedDate ? (
            <>
              Applied on <time dateTime={application.appliedDate}>{formatIsoDate(application.appliedDate)}</time>
            </>
          ) : (
            "No applied date"
          )}
        </p>
      </div>
      <StatusChangeForm
        key={application.status}
        application={{ id: application.id, company: application.company, status: application.status }}
      />
    </article>
  );
}
