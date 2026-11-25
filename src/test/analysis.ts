import type { Analysis, AnalysisResult } from "@/features/analysis/domain/analysis";
import type { Profile } from "@/features/profile/domain/profile";
import { APPLICATION_ID } from "./applications";

/** A valid model answer; override what a test cares about. */
export function buildAnalysisResult(overrides: Partial<AnalysisResult> = {}): AnalysisResult {
  return {
    requirements: ["3+ years of React", "TypeScript"],
    matchScore: 72,
    matchedSkills: ["React", "TypeScript"],
    missingSkills: ["GraphQL"],
    tips: [
      "Prepare a story about a complex React component you built.",
      "Review GraphQL basics and how it compares to REST.",
      "Bring examples of accessible UI work.",
    ],
    ...overrides,
  };
}

/** A saved analysis of `APPLICATION_ID`. */
export function buildAnalysis(overrides: Partial<Analysis> = {}): Analysis {
  return {
    ...buildAnalysisResult(),
    applicationId: APPLICATION_ID,
    createdAt: "2026-11-24T10:00:00Z",
    ...overrides,
  };
}

/** A saved profile with enough content to be analyzed. */
export function buildProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    summary: "Frontend developer focused on React.",
    skills: ["React", "TypeScript"],
    updatedAt: "2026-11-24T09:00:00Z",
    ...overrides,
  };
}
