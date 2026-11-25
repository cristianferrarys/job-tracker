import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button-link";
import { groupByStatus } from "../domain/board";
import { NEW_APPLICATION_PATH } from "../domain/routes";
import { getMyApplications } from "../queries";
import { BoardColumn } from "./board-column";

/** Loads the signed-in user's applications and shows them by status, with empty and error states. */
export async function Board() {
  const result = await getMyApplications();

  if (!result.ok) {
    return <Alert tone="error">We could not load your applications. Please refresh the page to try again.</Alert>;
  }

  if (result.data.length === 0) {
    return (
      <div className="flex flex-col items-start gap-4 rounded-xl border border-dashed border-zinc-300 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">No applications yet</h2>
        <p className="text-zinc-700 dark:text-zinc-300">
          Add the jobs you apply to and track each one from application to offer.
        </p>
        <ButtonLink href={NEW_APPLICATION_PATH}>Add your first application</ButtonLink>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {groupByStatus(result.data).map((column) => (
        <BoardColumn key={column.status} column={column} />
      ))}
    </div>
  );
}
