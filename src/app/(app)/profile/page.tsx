import type { Metadata } from "next";
import { Suspense } from "react";
import { ProfileSection } from "@/features/profile/components/profile-section";

export const metadata: Metadata = { title: "Profile · Job Tracker" };

export default function ProfilePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <div>
        <h1 className="text-3xl font-semibold text-zinc-900 dark:text-zinc-50">Your profile</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">
          Your summary and skills are compared with each job description you analyze.
        </p>
      </div>
      <section
        aria-label="Profile editor"
        className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
      >
        <Suspense fallback={<p role="status">Loading your profile…</p>}>
          <ProfileSection />
        </Suspense>
      </section>
    </main>
  );
}
