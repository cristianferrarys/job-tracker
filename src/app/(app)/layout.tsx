import { Suspense } from "react";
import { AppHeader } from "@/components/layout/app-header";
import { CurrentUserPanel } from "@/features/auth/components/current-user-panel";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

/** Shell for signed-in pages. Each page still checks the user server-side. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AppHeader
        account={
          <Suspense fallback={<p role="status">Loading your account…</p>}>
            <CurrentUserPanel />
          </Suspense>
        }
        actions={<SignOutButton />}
      />
      {children}
    </>
  );
}
