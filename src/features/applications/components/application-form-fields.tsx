import { SelectField } from "@/components/ui/select-field";
import { TextAreaField } from "@/components/ui/text-area-field";
import { TextField } from "@/components/ui/text-field";
import type { FieldErrors } from "@/lib/action-result";
import {
  COMPANY_MAX_LENGTH,
  JOB_URL_MAX_LENGTH,
  NOTES_MAX_LENGTH,
  ROLE_MAX_LENGTH,
  type ApplicationField,
} from "../domain/application";
import { BOARD_COLUMNS } from "../domain/board";
import type { ApplicationFormValues } from "../domain/form-values";
import { JobDescriptionField } from "./job-description-field";

const STATUS_OPTIONS = BOARD_COLUMNS.map((column) => ({ value: column.status, label: column.label }));

type ApplicationFormFieldsProps = {
  values: ApplicationFormValues;
  errors?: FieldErrors<ApplicationField>;
};

/** Every editable field of an application, prefilled with `values`. */
export function ApplicationFormFields({ values, errors }: ApplicationFormFieldsProps) {
  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          name="company"
          label="Company"
          defaultValue={values.company}
          maxLength={COMPANY_MAX_LENGTH}
          autoComplete="organization"
          required
          errors={errors?.company}
        />
        <TextField
          name="role"
          label="Role"
          defaultValue={values.role}
          maxLength={ROLE_MAX_LENGTH}
          autoComplete="organization-title"
          required
          errors={errors?.role}
        />
      </div>
      <TextField
        name="jobUrl"
        label="Job URL"
        type="url"
        inputMode="url"
        placeholder="https://…"
        defaultValue={values.jobUrl}
        maxLength={JOB_URL_MAX_LENGTH}
        hint="Optional. Must start with http:// or https://."
        errors={errors?.jobUrl}
      />
      <JobDescriptionField defaultValue={values.jobDescription} errors={errors?.jobDescription} />
      <div className="grid gap-5 sm:grid-cols-2">
        <SelectField
          name="status"
          label="Status"
          options={STATUS_OPTIONS}
          defaultValue={values.status}
          errors={errors?.status}
        />
        <TextField
          name="appliedDate"
          label="Applied date"
          type="date"
          defaultValue={values.appliedDate}
          hint="Optional."
          errors={errors?.appliedDate}
        />
      </div>
      <TextAreaField
        name="notes"
        label="Notes"
        defaultValue={values.notes}
        maxLength={NOTES_MAX_LENGTH}
        hint={`Optional. Up to ${NOTES_MAX_LENGTH} characters.`}
        errors={errors?.notes}
        className="min-h-24"
      />
    </div>
  );
}
