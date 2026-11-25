import type { Application } from "@/features/applications/domain/application";

export const APPLICATION_ID = "3f1c2a7e-8b4d-4c5e-9f60-1a2b3c4d5e6f";

/** A saved application with realistic values; override what a test cares about. */
export function buildApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: APPLICATION_ID,
    company: "Acme",
    role: "Frontend Developer",
    jobUrl: "https://jobs.example.com/acme/frontend",
    jobDescription: "Build UIs with React and TypeScript.",
    status: "applied",
    appliedDate: "2026-11-20",
    notes: "Referred by Ana.",
    createdAt: "2026-11-20T09:00:00Z",
    updatedAt: "2026-11-20T09:00:00Z",
    ...overrides,
  };
}
