import { SubmitButton } from "@/components/ui/submit-button";
import { signOut } from "../actions";

export function SignOutButton() {
  return (
    <form action={signOut}>
      <SubmitButton variant="secondary" pendingLabel="Signing out…">
        Sign out
      </SubmitButton>
    </form>
  );
}
