import type { Metadata } from "next";
import { Suspense } from "react";
import { ButtonLink } from "@/components/ui/button-link";
import { Board } from "@/features/applications/components/board";
import { NEW_APPLICATION_PATH } from "@/features/applications/domain/routes";

export const metadata: Metadata = { title: "Board · Job Tracker" };

export default function BoardPage() {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Board</h1>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">Your applications, grouped by stage.</p>
        </div>
        <ButtonLink href={NEW_APPLICATION_PATH}>Add application</ButtonLink>
      </div>
      <Suspense fallback={<p role="status">Loading your applications…</p>}>
        <Board />
      </Suspense>
    </main>
  );
}
