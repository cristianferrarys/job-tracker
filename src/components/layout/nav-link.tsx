import Link from "next/link";
import type { ReactNode } from "react";

type NavLinkProps = { href: string; isCurrent: boolean; children: ReactNode };

/** Header navigation link; the current page is marked with `aria-current`. */
export function NavLink({ href, isCurrent, children }: NavLinkProps) {
  return (
    <Link
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      className={`rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
        isCurrent
          ? "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50"
          : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
      }`}
    >
      {children}
    </Link>
  );
}
