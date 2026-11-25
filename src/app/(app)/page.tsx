import { Suspense } from "react";
import { CurrentUserPanel } from "@/features/auth/components/current-user-panel";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Job Tracker</h1>
      <section
        aria-label="Account"
        className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <Suspense fallback={<p role="status">Loading your account…</p>}>
          <CurrentUserPanel />
        </Suspense>
      </section>
    </main>
  );
}
