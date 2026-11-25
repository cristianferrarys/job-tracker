import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AnalysisPanel } from "@/features/analysis/components/analysis-panel";
import { ApplicationDetailSection } from "@/features/applications/components/application-detail-section";
import { HOME_PATH } from "@/features/auth/domain/route-access";

export const metadata: Metadata = { title: "Application · Job Tracker" };

export default function ApplicationPage({ params }: PageProps<"/applications/[id]">) {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10 sm:px-6">
      <Link
        href={HOME_PATH}
        className="self-start rounded-sm text-sm font-medium text-blue-700 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 dark:text-blue-400"
      >
        ← Back to board
      </Link>
      <Suspense fallback={<p role="status">Loading the application…</p>}>
        {params.then(({ id }) => (
          <ApplicationDetailSection id={id} extra={<AnalysisPanel applicationId={id} />} />
        ))}
      </Suspense>
    </main>
  );
}
