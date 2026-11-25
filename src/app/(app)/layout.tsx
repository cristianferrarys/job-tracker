import { AppHeader } from "@/components/layout/app-header";
import { SignOutButton } from "@/features/auth/components/sign-out-button";

/** Shell for signed-in pages. Each page still checks the user server-side. */
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <AppHeader actions={<SignOutButton />} />
      {children}
    </>
  );
}
