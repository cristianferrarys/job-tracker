import { ButtonLink } from "@/components/ui/button-link";
import { HOME_PATH } from "@/features/auth/domain/route-access";

/** Same page for an unknown id and for another user's application, so nothing leaks. */
export default function ApplicationNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-4 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Application not found</h1>
      <p className="text-zinc-700 dark:text-zinc-300">It may have been deleted, or the link may be wrong.</p>
      <ButtonLink href={HOME_PATH}>Back to board</ButtonLink>
    </main>
  );
}
