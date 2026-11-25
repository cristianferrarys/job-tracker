import type { Metadata } from "next";
import { Suspense } from "react";
import { NewApplicationSection } from "@/features/applications/components/new-application-section";

export const metadata: Metadata = { title: "New application · Job Tracker" };

export default function NewApplicationPage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">New application</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">Only company and role are required.</p>
      </div>
      <section
        aria-label="Application editor"
        className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <Suspense fallback={<p role="status">Loading the form…</p>}>
          <NewApplicationSection />
        </Suspense>
      </section>
    </main>
  );
}
