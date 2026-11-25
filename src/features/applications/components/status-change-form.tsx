"use client";

import { useActionState } from "react";
import { SubmitButton } from "@/components/ui/submit-button";
import { updateApplicationStatus } from "../actions";
import type { Application } from "../domain/application";
import { BOARD_COLUMNS } from "../domain/board";

type StatusChangeFormProps = { application: Pick<Application, "id" | "company" | "status"> };

/**
 * Moves a card to another column. Any status can be chosen from any other one: real hiring
 * processes skip and revisit stages, so the board does not enforce transitions.
 */
export function StatusChangeForm({ application }: StatusChangeFormProps) {
  const [state, formAction] = useActionState(updateApplicationStatus, null);
  const selectId = `status-${application.id}`;

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="id" value={application.id} />
      <label htmlFor={selectId} className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Status<span className="sr-only"> of {application.company}</span>
      </label>
      <div className="flex gap-2">
        <select
          id={selectId}
          name="status"
          defaultValue={application.status}
          className="h-11 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 text-base text-zinc-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:ring-offset-zinc-950"
        >
          {BOARD_COLUMNS.map((column) => (
            <option key={column.status} value={column.status}>
              {column.label}
            </option>
          ))}
        </select>
        <SubmitButton variant="secondary" pendingLabel="Moving…">
          Move<span className="sr-only"> {application.company}</span>
        </SubmitButton>
      </div>
      {state && !state.ok ? (
        <p role="alert" className="text-sm text-red-700 dark:text-red-400">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
