import type { ReactNode } from "react";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

/** Centered, responsive card shared by the login and signup pages. */
export function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-zinc-950">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{title}</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{description}</p>
        <div className="mt-6 flex flex-col gap-4">{children}</div>
        <p className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-400">{footer}</p>
      </div>
    </main>
  );
}
