import Link from "next/link";
import type { ReactNode } from "react";
import { LOGIN_PATH, SIGNUP_PATH } from "../domain/route-access";

type AuthPagePath = typeof LOGIN_PATH | typeof SIGNUP_PATH;

/** Inline link between the auth pages with a visible focus ring. */
export function AuthLink({ href, children }: { href: AuthPagePath; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="font-medium text-blue-700 underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-blue-400"
    >
      {children}
    </Link>
  );
}
