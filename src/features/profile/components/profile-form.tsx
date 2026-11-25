"use client";

import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { saveProfile } from "../actions";
import type { Profile } from "../domain/profile";
import { SkillsInput } from "./skills-input";
import { SummaryField } from "./summary-field";

const EMPTY_VERSION = "empty";

/** Edits the profile. After a successful save the fields restart from the saved, normalized values. */
export function ProfileForm({ profile }: { profile: Profile | null }) {
  const [state, formAction] = useActionState(saveProfile, null);
  const current = state?.ok ? state.data : profile;
  const fieldErrors = state && !state.ok ? state.fieldErrors : undefined;
  const version = current?.updatedAt ?? EMPTY_VERSION;

  return (
    <form action={formAction} noValidate aria-label="Profile" className="flex flex-col gap-6">
      {state && !state.ok ? <Alert tone="error">{state.error}</Alert> : null}
      <SummaryField key={`summary-${version}`} defaultValue={current?.summary ?? ""} errors={fieldErrors?.summary} />
      <SkillsInput key={`skills-${version}`} defaultSkills={current?.skills ?? []} errors={fieldErrors?.skills} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SubmitButton pendingLabel="Saving…">Save profile</SubmitButton>
        <p role="status" className="text-sm font-medium text-green-800 dark:text-green-300">
          {state?.ok ? "Profile saved." : ""}
        </p>
      </div>
    </form>
  );
}
