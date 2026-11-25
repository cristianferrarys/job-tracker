import type { Application, ApplicationField } from "./application";
import { DEFAULT_APPLICATION_STATUS } from "./status";

/** Form field names, which are also the keys of the create/update input. */
export const APPLICATION_FIELDS = [
  "company",
  "role",
  "jobUrl",
  "jobDescription",
  "status",
  "appliedDate",
  "notes",
] as const satisfies readonly ApplicationField[];

/** What the application form shows in its fields. */
export type ApplicationFormValues = Record<ApplicationField, string>;

/** Raw submitted values, still unvalidated (a missing field is `null`). */
export function readApplicationForm(formData: FormData): Record<ApplicationField, FormDataEntryValue | null> {
  return Object.fromEntries(APPLICATION_FIELDS.map((field) => [field, formData.get(field)])) as Record<
    ApplicationField,
    FormDataEntryValue | null
  >;
}

/** Text the user submitted, so the form can show it again after a failed save. */
export function submittedFormValues(formData: FormData): ApplicationFormValues {
  return Object.fromEntries(
    APPLICATION_FIELDS.map((field) => {
      const value = formData.get(field);
      return [field, typeof value === "string" ? value : ""];
    }),
  ) as ApplicationFormValues;
}

/** Field values for editing `application`, or for an empty new application. */
export function toFormValues(application: Application | null): ApplicationFormValues {
  return {
    company: application?.company ?? "",
    role: application?.role ?? "",
    jobUrl: application?.jobUrl ?? "",
    jobDescription: application?.jobDescription ?? "",
    status: application?.status ?? DEFAULT_APPLICATION_STATUS,
    appliedDate: application?.appliedDate ?? "",
    notes: application?.notes ?? "",
  };
}
