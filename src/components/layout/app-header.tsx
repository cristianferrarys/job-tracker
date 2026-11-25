import type { ReactNode } from "react";
import { HOME_PATH } from "@/features/auth/domain/route-access";
import { PROFILE_PATH } from "@/features/profile/domain/routes";
import { NavLink } from "./nav-link";

const NAV_ITEMS = [
  { href: HOME_PATH, label: "Home" },
  { href: PROFILE_PATH, label: "Profile" },
];

/** Top bar for signed-in pages: app name, main navigation and an `actions` slot (e.g. sign out). */
export function AppHeader({ actions }: { actions: ReactNode }) {
  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <nav aria-label="Main" className="flex items-center gap-2">
          <span className="mr-2 font-semibold text-zinc-900 dark:text-zinc-50">Job Tracker</span>
          <ul className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <NavLink href={item.href}>{item.label}</NavLink>
              </li>
            ))}
          </ul>
        </nav>
        {actions}
      </div>
    </header>
  );
}
