"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { ButtonLink } from "@/components/ui/button-link";
import { SubmitButton } from "@/components/ui/submit-button";
import { HOME_PATH } from "@/features/auth/domain/route-access";
import { createApplication, updateApplication, type ApplicationFormState } from "../actions";
import type { Application } from "../domain/application";
import { submittedFormValues, toFormValues, type ApplicationFormValues } from "../domain/form-values";
import { ApplicationFormFields } from "./application-form-fields";

type FormState = { result: ApplicationFormState; values: ApplicationFormValues; version: number };
type SaveAction = (previous: ApplicationFormState, formData: FormData) => Promise<ApplicationFormState>;

/**
 * Keeps what the user typed after a failed save (React resets the form after every action) and
 * the saved values after a successful one. `version` remounts the fields with those values.
 */
function keepingFormValues(save: SaveAction) {
  return async (previous: FormState, formData: FormData): Promise<FormState> => {
    const result = await save(previous.result, formData);
    const values = result?.ok ? toFormValues(result.data) : submittedFormValues(formData);
    return { result, values, version: previous.version + 1 };
  };
}

const submitNew = keepingFormValues(createApplication);
const submitChanges = keepingFormValues(updateApplication);

/** Creates an application (`application` is `null`) or edits an existing one. */
export function ApplicationForm({ application }: { application: Application | null }) {
  const [state, formAction] = useActionState(application ? submitChanges : submitNew, {
    result: null,
    values: toFormValues(application),
    version: 0,
  });
  const failure = state.result && !state.result.ok ? state.result : null;

  return (
    <form
      action={formAction}
      noValidate
      aria-label={application ? "Edit application" : "New application"}
      className="flex flex-col gap-6"
    >
      {failure ? <Alert tone="error">{failure.error}</Alert> : null}
      {application ? <input type="hidden" name="id" value={application.id} /> : null}
      <ApplicationFormFields key={state.version} values={state.values} errors={failure?.fieldErrors} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton pendingLabel={application ? "Saving…" : "Adding…"}>
          {application ? "Save changes" : "Add application"}
        </SubmitButton>
        <ButtonLink href={HOME_PATH} variant="secondary">
          Cancel
        </ButtonLink>
        <p role="status" className="text-sm font-medium text-green-800 dark:text-green-300">
          {state.result?.ok ? "Changes saved." : ""}
        </p>
      </div>
    </form>
  );
}
