import { Constants, type Database } from "@/lib/supabase/database.types";

/** Every status, in board order. Comes from the `application_status` enum in the database. */
export const APPLICATION_STATUSES = Constants.public.Enums.application_status;

export type ApplicationStatus = Database["public"]["Enums"]["application_status"];

/** Status a new application starts with; mirrors the column default in the database. */
export const DEFAULT_APPLICATION_STATUS: ApplicationStatus = APPLICATION_STATUSES[0];

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  applied: "Applied",
  interview: "Interview",
  offer: "Offer",
  rejected: "Rejected",
};
