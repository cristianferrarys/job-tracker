import { requireUser } from "@/features/auth/session";
import { ApplicationForm } from "./application-form";

/** Create form, shown only to a signed-in user (redirects to /login otherwise). */
export async function NewApplicationSection() {
  await requireUser();
  return <ApplicationForm application={null} />;
}
