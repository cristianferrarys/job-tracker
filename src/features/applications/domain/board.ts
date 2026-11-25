import type { ApplicationSummary } from "./application";
import { APPLICATION_STATUSES, STATUS_LABELS, type ApplicationStatus } from "./status";

export type BoardColumn = {
  status: ApplicationStatus;
  label: string;
  applications: ApplicationSummary[];
};

/** Board columns in display order: applied, interview, offer, rejected. */
export const BOARD_COLUMNS: readonly { status: ApplicationStatus; label: string }[] = APPLICATION_STATUSES.map(
  (status) => ({ status, label: STATUS_LABELS[status] }),
);

/**
 * Groups applications into one column per status, always returning every column (empty ones
 * included). Applications keep their input order inside each column.
 */
export function groupByStatus(applications: readonly ApplicationSummary[]): BoardColumn[] {
  return BOARD_COLUMNS.map((column) => ({
    ...column,
    applications: applications.filter((application) => application.status === column.status),
  }));
}
