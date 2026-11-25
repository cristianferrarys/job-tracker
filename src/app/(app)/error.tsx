"use client";

import { buttonClassName } from "@/components/ui/button-styles";

/** Fallback for unexpected errors on signed-in pages; details are never shown to the user. */
export default function AppError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-start gap-4 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Something went wrong</h1>
      <p role="alert" className="text-zinc-700 dark:text-zinc-300">
        This page could not be loaded. Please try again.
      </p>
      <button type="button" onClick={() => retry()} className={buttonClassName("primary")}>
        Try again
      </button>
    </main>
  );
}
