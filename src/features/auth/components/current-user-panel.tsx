import { SubmitButton } from "@/components/ui/submit-button";
import { signOut } from "../actions";
import { requireUser } from "../session";

/** Server-checked account summary with a sign-out button. Redirects to /login without a user. */
export async function CurrentUserPanel() {
  const user = await requireUser();

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-zinc-700 dark:text-zinc-300">
        Signed in as <strong className="break-all text-zinc-900 dark:text-zinc-50">{user.email}</strong>
      </p>
      <form action={signOut}>
        <SubmitButton variant="secondary" pendingLabel="Signing out…">
          Sign out
        </SubmitButton>
      </form>
    </div>
  );
}
