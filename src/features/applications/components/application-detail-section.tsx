import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { Alert } from "@/components/ui/alert";
import { getMyApplication } from "../queries";
import { ApplicationDetails } from "./application-details";
import { ApplicationForm } from "./application-form";
import { DeleteApplicationButton } from "./delete-application-button";

const CARD = "flex flex-col gap-5 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900";

type ApplicationDetailSectionProps = {
  id: string;
  /** Rendered after the details once the application is known to exist (e.g. the AI analysis). */
  extra?: ReactNode;
};

/**
 * Detail, edit form and delete control of one application. An unknown id and another user's id
 * both render the same not-found page.
 */
export async function ApplicationDetailSection({ id, extra }: ApplicationDetailSectionProps) {
  const result = await getMyApplication(id);
  if (!result.ok) {
    return <Alert tone="error">We could not load this application. Please refresh the page to try again.</Alert>;
  }
  if (!result.data) {
    notFound();
  }
  const application = result.data;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold break-words text-zinc-900 dark:text-zinc-50">{application.company}</h1>
      <section aria-labelledby="details-heading" className={CARD}>
        <h2 id="details-heading" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Details
        </h2>
        <ApplicationDetails application={application} />
      </section>
      {extra}
      <section aria-labelledby="edit-heading" className={CARD}>
        <h2 id="edit-heading" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Edit application
        </h2>
        <ApplicationForm application={application} />
      </section>
      <section aria-labelledby="delete-heading" className={CARD}>
        <h2 id="delete-heading" className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
          Delete application
        </h2>
        <p className="text-zinc-700 dark:text-zinc-300">Remove this application and everything saved with it.</p>
        <div>
          <DeleteApplicationButton id={application.id} company={application.company} />
        </div>
      </section>
    </div>
  );
}
