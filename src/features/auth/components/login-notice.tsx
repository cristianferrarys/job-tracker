import { Alert } from "@/components/ui/alert";
import { loginNoticeMessage } from "../domain/auth-errors";

export type SearchParams = Promise<Record<string, string | string[] | undefined>>;

/** Shows a known, friendly message for the `error` query param (e.g. after a failed email link). */
export async function LoginNotice({ searchParams }: { searchParams: SearchParams }) {
  const { error } = await searchParams;
  const message = loginNoticeMessage(Array.isArray(error) ? error[0] : error);
  return message ? <Alert tone="error">{message}</Alert> : null;
}
