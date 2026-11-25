import { requireUser } from "../session";

/** Server-checked account summary. Redirects to /login without a user. */
export async function CurrentUserPanel() {
  const user = await requireUser();

  return (
    <p className="text-zinc-700 dark:text-zinc-300">
      Signed in as <strong className="break-all text-zinc-900 dark:text-zinc-50">{user.email}</strong>
    </p>
  );
}
