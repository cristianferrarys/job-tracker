import { describe, expect, it, vi } from "vitest";
import { LOGIN_PATH } from "@/features/auth/domain/route-access";
import { requireUser } from "@/features/auth/session";
import { buildAnalysis } from "@/test/analysis";
import { APPLICATION_ID } from "@/test/applications";
import { throwRedirect } from "@/test/auth-mocks";
import { findAnalysisByApplicationId } from "./data/analysis-repository";
import { getMyAnalysis } from "./queries";

vi.mock("server-only", () => ({}));
vi.mock("@/features/auth/session", () => ({ requireUser: vi.fn() }));
vi.mock("./data/analysis-repository", () => ({ findAnalysisByApplicationId: vi.fn() }));

const analysis = buildAnalysis();

function signInAs(id: string) {
  vi.mocked(requireUser).mockResolvedValue({ id, email: `${id}@example.com` });
}

describe("getMyAnalysis", () => {
  it("loads the analysis of the application for the signed-in user", async () => {
    signInAs("user-1");
    vi.mocked(findAnalysisByApplicationId).mockImplementation(async (userId, id) =>
      userId === "user-1" && id === APPLICATION_ID ? { ok: true, data: analysis } : { ok: true, data: null },
    );

    await expect(getMyAnalysis(APPLICATION_ID)).resolves.toEqual({ ok: true, data: analysis });
  });

  it("asks only for the signed-in user's row, so another user's analysis is not returned", async () => {
    signInAs("user-2");
    vi.mocked(findAnalysisByApplicationId).mockImplementation(async (userId) =>
      userId === "user-1" ? { ok: true, data: analysis } : { ok: true, data: null },
    );

    await expect(getMyAnalysis(APPLICATION_ID)).resolves.toEqual({ ok: true, data: null });
  });

  it("returns null for a malformed id without querying the database", async () => {
    signInAs("user-1");

    await expect(getMyAnalysis("not-a-uuid")).resolves.toEqual({ ok: true, data: null });
    expect(findAnalysisByApplicationId).not.toHaveBeenCalled();
  });

  it("passes a database failure through without details", async () => {
    signInAs("user-1");
    vi.mocked(findAnalysisByApplicationId).mockResolvedValue({ ok: false });

    await expect(getMyAnalysis(APPLICATION_ID)).resolves.toEqual({ ok: false });
  });

  it("redirects to /login and reads nothing when there is no user", async () => {
    vi.mocked(requireUser).mockImplementation(async () => throwRedirect(LOGIN_PATH));

    await expect(getMyAnalysis(APPLICATION_ID)).rejects.toMatchObject({ url: LOGIN_PATH });
    expect(findAnalysisByApplicationId).not.toHaveBeenCalled();
  });
});
