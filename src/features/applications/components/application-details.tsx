import type { ReactNode } from "react";
import type { Application } from "../domain/application";
import { formatIsoDate } from "../domain/dates";
import { STATUS_LABELS } from "../domain/status";

function Detail({ term, children }: { term: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm font-medium text-zinc-600 dark:text-zinc-400">{term}</dt>
      <dd className="break-words text-zinc-900 dark:text-zinc-100">{children}</dd>
    </div>
  );
}

function Missing({ children }: { children: ReactNode }) {
  return <span className="text-zinc-500 dark:text-zinc-400">{children}</span>;
}

/** Read-only view of every field of an application. */
export function ApplicationDetails({ application }: { application: Application }) {
  return (
    <dl className="grid gap-5 sm:grid-cols-2">
      <Detail term="Role">{application.role}</Detail>
      <Detail term="Status">{STATUS_LABELS[application.status]}</Detail>
      <Detail term="Applied date">
        {application.appliedDate ? (
          <time dateTime={application.appliedDate}>{formatIsoDate(application.appliedDate)}</time>
        ) : (
          <Missing>Not set</Missing>
        )}
      </Detail>
      <Detail term="Job URL">
        {application.jobUrl ? (
          <a
            href={application.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-blue-700 underline underline-offset-2 hover:text-blue-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-blue-400"
          >
            {application.jobUrl}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        ) : (
          <Missing>Not set</Missing>
        )}
      </Detail>
      <div className="sm:col-span-2">
        <Detail term="Job description">
          {application.jobDescription ? (
            <span className="whitespace-pre-wrap">{application.jobDescription}</span>
          ) : (
            <Missing>No description yet.</Missing>
          )}
        </Detail>
      </div>
      <div className="sm:col-span-2">
        <Detail term="Notes">
          {application.notes ? (
            <span className="whitespace-pre-wrap">{application.notes}</span>
          ) : (
            <Missing>No notes.</Missing>
          )}
        </Detail>
      </div>
    </dl>
  );
}
