"use client";

import { useState } from "react";
import { TextAreaField } from "@/components/ui/text-area-field";
import { JOB_DESCRIPTION_MAX_LENGTH } from "../domain/application";

type JobDescriptionFieldProps = { defaultValue: string; errors?: string[] };

/** Job description textarea with a live character count against the limit. */
export function JobDescriptionField({ defaultValue, errors }: JobDescriptionFieldProps) {
  const [description, setDescription] = useState(defaultValue);

  return (
    <TextAreaField
      name="jobDescription"
      label="Job description"
      placeholder="Paste the job posting here."
      value={description}
      onChange={(event) => setDescription(event.target.value)}
      maxLength={JOB_DESCRIPTION_MAX_LENGTH}
      hint={`${description.length} / ${JOB_DESCRIPTION_MAX_LENGTH} characters.`}
      errors={errors}
    />
  );
}
