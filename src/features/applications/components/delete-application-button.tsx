"use client";

import { useActionState, useId, useRef } from "react";
import { Alert } from "@/components/ui/alert";
import { buttonClassName } from "@/components/ui/button-styles";
import { SubmitButton } from "@/components/ui/submit-button";
import { deleteApplication } from "../actions";

type DeleteApplicationButtonProps = { id: string; company: string };

/**
 * Deletes after an explicit confirmation in a modal dialog (focus moves into it, Escape cancels,
 * focus returns to the opener). On success the action redirects to the board.
 */
export function DeleteApplicationButton({ id, company }: DeleteApplicationButtonProps) {
  const [state, formAction] = useActionState(deleteApplication, null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  function openDialog() {
    dialogRef.current?.showModal();
    cancelRef.current?.focus();
  }

  return (
    <>
      <button type="button" onClick={openDialog} className={buttonClassName("danger")}>
        Delete application
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-zinc-200 bg-white p-6 text-zinc-900 shadow-xl backdrop:bg-zinc-950/60 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
      >
        <div className="flex flex-col gap-4">
          <h2 id={titleId} className="text-lg font-semibold">
            Delete this application?
          </h2>
          <p id={descriptionId} className="break-words text-zinc-700 dark:text-zinc-300">
            The application to {company} will be removed permanently. This cannot be undone.
          </p>
          {state && !state.ok ? <Alert tone="error">{state.error}</Alert> : null}
          <form action={formAction} className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <input type="hidden" name="id" value={id} />
            <button
              ref={cancelRef}
              type="button"
              onClick={() => dialogRef.current?.close()}
              className={buttonClassName("secondary")}
            >
              Cancel
            </button>
            <SubmitButton variant="danger" pendingLabel="Deleting…">
              Delete
            </SubmitButton>
          </form>
        </div>
      </dialog>
    </>
  );
}
