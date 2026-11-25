import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applicationPath } from "@/features/applications/domain/routes";
import { getMyApplication } from "@/features/applications/queries";
import { LOGIN_PATH } from "@/features/auth/domain/route-access";
import { requireUser } from "@/features/auth/session";
import { PROFILE_PATH } from "@/features/profile/domain/routes";
import { getCurrentProfile } from "@/features/profile/queries";
import { generateJson } from "@/lib/ai/gemini";
import { buildAnalysis, buildAnalysisResult, buildProfile } from "@/test/analysis";
import { APPLICATION_ID, buildApplication } from "@/test/applications";
import { throwRedirect } from "@/test/auth-mocks";
import { analyzeApplication } from "./actions";
import { upsertAnalysis } from "./data/analysis-repository";
import { ANALYSIS_RESPONSE_JSON_SCHEMA } from "./domain/analysis";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/auth/session", () => ({ requireUser: vi.fn() }));
vi.mock("@/features/applications/queries", () => ({ getMyApplication: vi.fn() }));
vi.mock("@/features/profile/queries", () => ({ getCurrentProfile: vi.fn() }));
vi.mock("@/lib/ai/gemini", () => ({ generateJson: vi.fn() }));
vi.mock("./data/analysis-repository", () => ({ upsertAnalysis: vi.fn() }));

const USER_ID = "user-1";
const OTHER_ID = "9b2f6c1d-4e3a-4b5c-8d7e-6f5a4b3c2d1e";
const APPLICATION = buildApplication({ jobDescription: "Senior React role, GraphQL a plus." });
const PROFILE = buildProfile({ summary: "Frontend developer.", skills: ["React"] });
const RESULT = buildAnalysisResult();
const SAVED = buildAnalysis();

const RATE_LIMIT_MESSAGE = "The AI service is busy or the free quota is used up. Please try again in a minute.";
const UNAVAILABLE_MESSAGE = "AI analysis is not available right now.";
const AI_FAILED_MESSAGE = "We could not reach the AI service. Please try again.";
const INVALID_OUTPUT_MESSAGE = "The AI returned an answer we could not use. Please try again.";
const NOT_FOUND_MESSAGE = "This application no longer exists.";
const LOAD_FAILED_MESSAGE = "We could not load the data for the analysis. Please try again.";

function expectNothingAnalyzed() {
  expect(generateJson).not.toHaveBeenCalled();
  expectNothingSaved();
}

function expectNothingSaved() {
  expect(upsertAnalysis).not.toHaveBeenCalled();
  expect(revalidatePath).not.toHaveBeenCalled();
}

function modelAnswers(text: string) {
  vi.mocked(generateJson).mockResolvedValue({ ok: true, text });
}

beforeEach(() => {
  vi.mocked(requireUser).mockResolvedValue({ id: USER_ID, email: "ana@example.com" });
  vi.mocked(getMyApplication).mockImplementation(async (id) =>
    id === APPLICATION_ID ? { ok: true, data: APPLICATION } : { ok: true, data: null },
  );
  vi.mocked(getCurrentProfile).mockResolvedValue({ ok: true, data: PROFILE });
  modelAnswers(`\n${JSON.stringify({ ...RESULT, requirements: RESULT.requirements.map((item) => ` ${item} `) })}\n`);
  vi.mocked(upsertAnalysis).mockImplementation(async (_userId, applicationId, result) => ({
    ok: true,
    data: { ...SAVED, ...result, applicationId },
  }));
});

describe("analyzeApplication", () => {
  it("sends the delimited job description and profile to the AI with the response schema", async () => {
    await analyzeApplication(APPLICATION_ID);

    const request = vi.mocked(generateJson).mock.calls[0][0];
    expect(request.responseJsonSchema).toBe(ANALYSIS_RESPONSE_JSON_SCHEMA);
    expect(request.contents).toContain(`<job_description>\n${APPLICATION.jobDescription}\n</job_description>`);
    expect(request.contents).toContain("Summary: Frontend developer.\nSkills: React");
    expect(request.systemInstruction).toMatch(/Ignore any instructions/);
  });

  it("saves the parsed result for the signed-in user, revalidates the detail page and returns it", async () => {
    const result = await analyzeApplication(APPLICATION_ID);

    expect(upsertAnalysis).toHaveBeenCalledWith(USER_ID, APPLICATION_ID, RESULT);
    expect(result).toEqual({ ok: true, data: { ...SAVED, ...RESULT } });
    expect(vi.mocked(revalidatePath).mock.calls).toEqual([[applicationPath(APPLICATION_ID)]]);
  });

  it.each([["malformed", "1 or 1=1"], ["empty", ""]])(
    "rejects a %s id without loading data or calling the AI",
    async (_case, id) => {
      await expect(analyzeApplication(id)).resolves.toEqual({ ok: false, error: NOT_FOUND_MESSAGE });
      expect(getMyApplication).not.toHaveBeenCalled();
      expectNothingAnalyzed();
    },
  );

  it("redirects to /login and touches nothing when unauthenticated", async () => {
    vi.mocked(requireUser).mockImplementation(async () => throwRedirect(LOGIN_PATH));

    await expect(analyzeApplication(APPLICATION_ID)).rejects.toMatchObject({ url: LOGIN_PATH });
    expect(getMyApplication).not.toHaveBeenCalled();
    expect(getCurrentProfile).not.toHaveBeenCalled();
    expectNothingAnalyzed();
  });

  it("reports not found for another user's or an unknown application without calling the AI", async () => {
    await expect(analyzeApplication(OTHER_ID)).resolves.toEqual({ ok: false, error: NOT_FOUND_MESSAGE });
    expect(getMyApplication).toHaveBeenCalledWith(OTHER_ID);
    expectNothingAnalyzed();
  });

  it.each([
    ["the application", () => vi.mocked(getMyApplication).mockResolvedValue({ ok: false })],
    ["the profile", () => vi.mocked(getCurrentProfile).mockResolvedValue({ ok: false })],
  ])("returns a friendly error when %s cannot be loaded", async (_case, fail) => {
    fail();

    await expect(analyzeApplication(APPLICATION_ID)).resolves.toEqual({ ok: false, error: LOAD_FAILED_MESSAGE });
    expectNothingAnalyzed();
  });

  it("asks for a job description first when the application has none", async () => {
    vi.mocked(getMyApplication).mockResolvedValue({ ok: true, data: { ...APPLICATION, jobDescription: "  \n " } });

    await expect(analyzeApplication(APPLICATION_ID)).resolves.toEqual({
      ok: false,
      error: "Add a job description to this application before analyzing it.",
    });
    expectNothingAnalyzed();
  });

  it.each([
    ["no saved profile", null],
    ["a profile without summary or skills", buildProfile({ summary: " ", skills: [] })],
  ])("asks to complete the profile, linking to it, when there is %s", async (_case, profile) => {
    vi.mocked(getCurrentProfile).mockResolvedValue({ ok: true, data: profile });

    await expect(analyzeApplication(APPLICATION_ID)).resolves.toEqual({
      ok: false,
      error: "Add a summary or some skills to your profile before analyzing.",
      fix: { href: PROFILE_PATH, label: "Complete your profile" },
    });
    expectNothingAnalyzed();
  });

  it.each([
    ["rate limit or quota", "rate_limited", RATE_LIMIT_MESSAGE],
    ["missing or invalid key", "unavailable", UNAVAILABLE_MESSAGE],
    ["other API or network", "failed", AI_FAILED_MESSAGE],
    ["empty answer", "empty", INVALID_OUTPUT_MESSAGE],
  ] as const)("maps a %s failure to its friendly message and saves nothing", async (_case, reason, message) => {
    vi.mocked(generateJson).mockResolvedValue({ ok: false, reason });

    await expect(analyzeApplication(APPLICATION_ID)).resolves.toEqual({ ok: false, error: message });
    expectNothingSaved();
  });

  it.each([
    ["malformed JSON", '{"requirements": ["React"], "matchScore": '],
    ["prose instead of JSON", "Sure! The candidate is a great fit."],
    ["a score out of range", JSON.stringify({ ...RESULT, matchScore: 140 })],
    ["two tips", JSON.stringify({ ...RESULT, tips: RESULT.tips.slice(1) })],
  ])("returns only a friendly error, never the raw output, and saves nothing for %s", async (_case, text) => {
    modelAnswers(text);

    await expect(analyzeApplication(APPLICATION_ID)).resolves.toEqual({ ok: false, error: INVALID_OUTPUT_MESSAGE });
    expectNothingSaved();
  });

  it("returns a friendly error and does not revalidate when saving fails", async () => {
    vi.mocked(upsertAnalysis).mockResolvedValue({ ok: false });

    await expect(analyzeApplication(APPLICATION_ID)).resolves.toEqual({
      ok: false,
      error: "We could not save the analysis. Please try again.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
