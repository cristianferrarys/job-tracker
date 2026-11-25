import { Suspense, type ReactNode } from "react";
import { NEW_APPLICATION_PATH } from "@/features/applications/domain/routes";
import { HOME_PATH } from "@/features/auth/domain/route-access";
import { PROFILE_PATH } from "@/features/profile/domain/routes";
import { CurrentNavLinks } from "./current-nav-links";
import { NavLinks, type NavItem } from "./nav-links";

const NAV_ITEMS: readonly NavItem[] = [
  { href: HOME_PATH, label: "Board" },
  { href: NEW_APPLICATION_PATH, label: "New application" },
  { href: PROFILE_PATH, label: "Profile" },
];

type AppHeaderProps = { account: ReactNode; actions: ReactNode };

/** Top bar for signed-in pages: app name, main navigation, the account and an `actions` slot. */
export function AppHeader({ account, actions }: AppHeaderProps) {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <nav aria-label="Main" className="flex flex-wrap items-center gap-2">
          <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-50">Job Tracker</span>
          <Suspense fallback={<NavLinks items={NAV_ITEMS} currentPath={null} />}>
            <CurrentNavLinks items={NAV_ITEMS} />
          </Suspense>
        </nav>
        <div className="flex flex-wrap items-center gap-3">
          <section aria-label="Account" className="text-sm">
            {account}
          </section>
          {actions}
        </div>
      </div>
    </header>
  );
}
