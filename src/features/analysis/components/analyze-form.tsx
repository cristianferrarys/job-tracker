"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Alert } from "@/components/ui/alert";
import { SubmitButton } from "@/components/ui/submit-button";
import { analyzeApplication, type AnalyzeState } from "../actions";

type AnalyzeFormProps = { applicationId: string; hasAnalysis: boolean };

/**
 * Runs the analysis. The button is disabled while it runs, so one click sends one request; the
 * saved result appears through the revalidated page, errors appear here.
 */
export function AnalyzeForm({ applicationId, hasAnalysis }: AnalyzeFormProps) {
  const [state, formAction] = useActionState(
    (): Promise<AnalyzeState> => analyzeApplication(applicationId),
    null,
  );

  return (
    <form action={formAction} aria-label="Analyze application" className="flex flex-col gap-3">
      {state && !state.ok ? (
        <Alert tone="error">
          {state.error}
          {"fix" in state && state.fix ? (
            <>
              {" "}
              <Link
                href={state.fix.href}
                className="font-medium underline underline-offset-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
              >
                {state.fix.label}
              </Link>
            </>
          ) : null}
        </Alert>
      ) : null}
      <div>
        <SubmitButton pendingLabel="Analyzing…">{hasAnalysis ? "Re-analyze" : "Analyze"}</SubmitButton>
      </div>
    </form>
  );
}
