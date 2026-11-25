import { Alert } from "@/components/ui/alert";

/** Shown after signup when Supabase requires the user to confirm their email first. */
export function SignupConfirmation({ email }: { email: string }) {
  return (
    <Alert tone="success">
      <p className="font-medium">Check your email to confirm your account.</p>
      <p className="mt-1">
        We sent a confirmation link to <strong>{email}</strong>. Open it to finish signing up, then
        log in.
      </p>
    </Alert>
  );
}
