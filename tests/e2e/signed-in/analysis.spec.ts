import { expect, test } from "@playwright/test";
import { createApplication, deleteApplicationsByCompanyPrefix, E2E_COMPANY_PREFIXES } from "../support/applications";
import { hasE2eCredentials, MISSING_CREDENTIALS_REASON } from "../support/credentials";
import { withSignedInPage } from "../support/signed-in-page";

test.skip(!hasE2eCredentials, MISSING_CREDENTIALS_REASON);

const runId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
const application = {
  company: `${E2E_COMPANY_PREFIXES.analysis}${runId}`,
  role: "E2E Analysis Candidate",
  jobUrl: `https://example.com/jobs/${runId}`,
  jobDescription: "React, TypeScript and accessibility.",
  appliedDate: "2026-11-21",
};

/** This spec never clicks "Analyze": that would call Gemini and spend the free-tier quota. */
test.describe("AI analysis on the application page", () => {
  test.afterAll(async ({ browser }, testInfo) => {
    await withSignedInPage(browser, testInfo, (page) =>
      deleteApplicationsByCompanyPrefix(page, E2E_COMPANY_PREFIXES.analysis),
    );
  });

  test("shows the empty state and the Analyze button for a new application", async ({ page }) => {
    await createApplication(page, application);

    const panel = page.getByRole("region", { name: "AI analysis" });
    await expect(panel.getByText("No analysis yet")).toBeVisible();
    await expect(panel.getByRole("button", { name: "Analyze", exact: true })).toBeEnabled();
    await expect(panel.getByText(/^Match score:/)).toHaveCount(0);
    await expect(panel.getByRole("alert")).toHaveCount(0);
  });
});
