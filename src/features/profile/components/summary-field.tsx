"use client";

import { useState } from "react";
import { TextAreaField } from "@/components/ui/text-area-field";
import { PROFILE_SUMMARY_MAX_LENGTH } from "../domain/profile";

type SummaryFieldProps = { defaultValue: string; errors?: string[] };

/** Free-text summary with a live character count against the limit. */
export function SummaryField({ defaultValue, errors }: SummaryFieldProps) {
  const [summary, setSummary] = useState(defaultValue);

  return (
    <TextAreaField
      name="summary"
      label="Summary"
      placeholder="e.g. Frontend developer with 4 years of React and TypeScript, interested in product teams."
      value={summary}
      onChange={(event) => setSummary(event.target.value)}
      maxLength={PROFILE_SUMMARY_MAX_LENGTH}
      hint={`${summary.length} / ${PROFILE_SUMMARY_MAX_LENGTH} characters. Describe your experience and the stack you work with.`}
      errors={errors}
    />
  );
}
