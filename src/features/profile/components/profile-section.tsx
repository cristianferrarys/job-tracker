import { Alert } from "@/components/ui/alert";
import { getCurrentProfile } from "../queries";
import { ProfileForm } from "./profile-form";

/** Loads the signed-in user's profile and renders the editor, with empty and error states. */
export async function ProfileSection() {
  const result = await getCurrentProfile();

  if (!result.ok) {
    return (
      <Alert tone="error">We could not load your profile. Please refresh the page to try again.</Alert>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {result.data ? null : (
        <Alert tone="info">
          Your profile is empty. Add a short summary and your skills so job descriptions can be
          matched against them.
        </Alert>
      )}
      <ProfileForm profile={result.data} />
    </div>
  );
}
