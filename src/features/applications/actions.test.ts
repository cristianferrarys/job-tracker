import { revalidatePath } from "next/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { HOME_PATH, LOGIN_PATH } from "@/features/auth/domain/route-access";
import { requireUser } from "@/features/auth/session";
import { APPLICATION_ID, buildApplication } from "@/test/applications";
import { RedirectSignal, throwRedirect } from "@/test/auth-mocks";
import { createApplication, deleteApplication, updateApplication, updateApplicationStatus } from "./actions";
import {
  deleteApplicationById,
  insertApplication,
  updateApplicationById,
  updateApplicationStatusById,
} from "./data/applications-repository";
import { COMPANY_MAX_LENGTH } from "./domain/application";
import { applicationPath } from "./domain/routes";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn(throwRedirect) }));
vi.mock("@/features/auth/session", () => ({ requireUser: vi.fn() }));
vi.mock("./data/applications-repository", () => ({
  insertApplication: vi.fn(),
  updateApplicationById: vi.fn(),
  updateApplicationStatusById: vi.fn(),
  deleteApplicationById: vi.fn(),
}));

const USER_ID = "user-1";
const OTHER_ID = "9b2f6c1d-4e3a-4b5c-8d7e-6f5a4b3c2d1e";
const SAVED = buildApplication();
const REPOSITORY = [insertApplication, updateApplicationById, updateApplicationStatusById, deleteApplicationById];

const FIELDS = {
  company: "  Acme ",
  role: "Frontend Developer",
  jobUrl: "https://jobs.example.com/acme",
  jobDescription: "Build UIs.",
  status: "applied",
  appliedDate: "2026-11-20",
  notes: "",
};

const INPUT = {
  company: "Acme",
  role: "Frontend Developer",
  jobUrl: "https://jobs.example.com/acme",
  jobDescription: "Build UIs.",
  status: "applied",
  appliedDate: "2026-11-20",
  notes: null,
};

function form(entries: Record<string, string>): FormData {
  const data = new FormData();
  Object.entries(entries).forEach(([key, value]) => data.set(key, value));
  return data;
}

async function redirectTarget(promise: Promise<unknown>): Promise<string> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof RedirectSignal) {
      return error.url;
    }
    throw error;
  }
  throw new Error("Expected a redirect");
}

function expectNoDatabaseCall() {
  REPOSITORY.forEach((call) => expect(call).not.toHaveBeenCalled());
  expect(revalidatePath).not.toHaveBeenCalled();
}

function signOut() {
  vi.mocked(requireUser).mockImplementation(async () => throwRedirect(LOGIN_PATH));
}

beforeEach(() => {
  vi.mocked(requireUser).mockResolvedValue({ id: USER_ID, email: "ana@example.com" });
});

describe("createApplication", () => {
  beforeEach(() => {
    vi.mocked(insertApplication).mockImplementation(async (_userId, input) => ({ ok: true, data: { ...SAVED, ...input } }));
  });

  it("saves the validated input for the signed-in user and redirects to its detail page", async () => {
    const target = await redirectTarget(createApplication(null, form(FIELDS)));

    expect(insertApplication).toHaveBeenCalledWith(USER_ID, INPUT);
    expect(target).toBe(applicationPath(SAVED.id));
    expect(revalidatePath).toHaveBeenCalledWith(HOME_PATH);
  });

  it("ignores a user_id or id sent by the client", async () => {
    await redirectTarget(createApplication(null, form({ ...FIELDS, user_id: "attacker", userId: "attacker", id: OTHER_ID })));

    expect(insertApplication).toHaveBeenCalledWith(USER_ID, INPUT);
  });

  it("returns field errors and touches nothing for invalid input", async () => {
    const result = await createApplication(
      null,
      form({ ...FIELDS, company: "a".repeat(COMPANY_MAX_LENGTH + 1), jobUrl: "javascript:alert(1)", status: "hired" }),
    );

    expect(result).toEqual({
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: {
        company: [`Company must be at most ${COMPANY_MAX_LENGTH} characters.`],
        jobUrl: ["Enter a full URL starting with http:// or https://."],
        status: ["Choose a valid status."],
      },
    });
    expectNoDatabaseCall();
  });

  it("redirects to /login and touches nothing when unauthenticated", async () => {
    signOut();

    await expect(createApplication(null, form(FIELDS))).rejects.toMatchObject({ url: LOGIN_PATH });
    expectNoDatabaseCall();
  });

  it("returns a friendly error without database details when saving fails", async () => {
    vi.mocked(insertApplication).mockResolvedValue({ ok: false });

    await expect(createApplication(null, form(FIELDS))).resolves.toEqual({
      ok: false,
      error: "We could not save the application. Please try again.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("updateApplication", () => {
  beforeEach(() => {
    vi.mocked(updateApplicationById).mockImplementation(async (userId, id, input) =>
      userId === USER_ID && id === APPLICATION_ID ? { ok: true, data: { ...SAVED, ...input } } : { ok: true, data: null },
    );
  });

  it("updates the user's application, returns it and revalidates the board and detail page", async () => {
    const result = await updateApplication(null, form({ ...FIELDS, id: APPLICATION_ID, role: " Staff Engineer " }));

    expect(result).toEqual({ ok: true, data: { ...SAVED, ...INPUT, role: "Staff Engineer" } });
    expect(updateApplicationById).toHaveBeenCalledWith(USER_ID, APPLICATION_ID, { ...INPUT, role: "Staff Engineer" });
    expect(vi.mocked(revalidatePath).mock.calls).toEqual([[HOME_PATH], [applicationPath(APPLICATION_ID)]]);
  });

  it("ignores a user_id sent by the client", async () => {
    await updateApplication(null, form({ ...FIELDS, id: APPLICATION_ID, user_id: "attacker" }));

    expect(updateApplicationById).toHaveBeenCalledWith(USER_ID, APPLICATION_ID, INPUT);
  });

  it("reports not found for another user's or an unknown application", async () => {
    const result = await updateApplication(null, form({ ...FIELDS, id: OTHER_ID }));

    expect(result).toEqual({ ok: false, error: "This application no longer exists." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it.each([["missing", {}], ["malformed", { id: "1 or 1=1" }]])(
    "rejects a %s id without touching the database",
    async (_case, id) => {
      const result = await updateApplication(null, form({ ...FIELDS, ...id }));

      expect(result).toEqual({ ok: false, error: "This application no longer exists." });
      expectNoDatabaseCall();
    },
  );

  it("returns field errors and touches nothing for invalid input", async () => {
    const result = await updateApplication(null, form({ ...FIELDS, id: APPLICATION_ID, role: " ", appliedDate: "2026-02-30" }));

    expect(result).toEqual({
      ok: false,
      error: "Please fix the highlighted fields.",
      fieldErrors: { role: ["Role is required."], appliedDate: ["Enter a valid date (YYYY-MM-DD)."] },
    });
    expectNoDatabaseCall();
  });

  it("redirects to /login and touches nothing when unauthenticated", async () => {
    signOut();

    await expect(updateApplication(null, form({ ...FIELDS, id: APPLICATION_ID }))).rejects.toMatchObject({ url: LOGIN_PATH });
    expectNoDatabaseCall();
  });

  it("returns a friendly error without database details when saving fails", async () => {
    vi.mocked(updateApplicationById).mockResolvedValue({ ok: false });

    await expect(updateApplication(null, form({ ...FIELDS, id: APPLICATION_ID }))).resolves.toEqual({
      ok: false,
      error: "We could not save the application. Please try again.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("updateApplicationStatus", () => {
  beforeEach(() => {
    vi.mocked(updateApplicationStatusById).mockImplementation(async (userId, id, status) =>
      userId === USER_ID && id === APPLICATION_ID ? { ok: true, data: { ...SAVED, status } } : { ok: true, data: null },
    );
  });

  it.each(["interview", "rejected", "applied"])("moves the user's application to %s", async (status) => {
    const result = await updateApplicationStatus(null, form({ id: APPLICATION_ID, status }));

    expect(result).toEqual({ ok: true, data: { ...SAVED, status } });
    expect(vi.mocked(revalidatePath).mock.calls).toEqual([[HOME_PATH], [applicationPath(APPLICATION_ID)]]);
  });

  it("ignores a user_id sent by the client", async () => {
    await updateApplicationStatus(null, form({ id: APPLICATION_ID, status: "offer", user_id: "attacker" }));

    expect(updateApplicationStatusById).toHaveBeenCalledWith(USER_ID, APPLICATION_ID, "offer");
  });

  it("reports not found for another user's or an unknown application", async () => {
    const result = await updateApplicationStatus(null, form({ id: OTHER_ID, status: "offer" }));

    expect(result).toEqual({ ok: false, error: "This application no longer exists." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects an unknown status or malformed id without touching the database", async () => {
    const result = await updateApplicationStatus(null, form({ id: "abc", status: "hired" }));

    expect(result).toEqual({
      ok: false,
      error: "Choose a valid status.",
      fieldErrors: { id: ["Invalid application id."], status: ["Choose a valid status."] },
    });
    expectNoDatabaseCall();
  });

  it("redirects to /login and touches nothing when unauthenticated", async () => {
    signOut();

    await expect(updateApplicationStatus(null, form({ id: APPLICATION_ID, status: "offer" }))).rejects.toMatchObject({
      url: LOGIN_PATH,
    });
    expectNoDatabaseCall();
  });

  it("returns a friendly error without database details when saving fails", async () => {
    vi.mocked(updateApplicationStatusById).mockResolvedValue({ ok: false });

    await expect(updateApplicationStatus(null, form({ id: APPLICATION_ID, status: "offer" }))).resolves.toEqual({
      ok: false,
      error: "We could not change the status. Please try again.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});

describe("deleteApplication", () => {
  beforeEach(() => {
    vi.mocked(deleteApplicationById).mockImplementation(async (userId, id) => ({
      ok: true,
      data: userId === USER_ID && id === APPLICATION_ID,
    }));
  });

  it("deletes the user's application, revalidates and redirects to the board", async () => {
    const target = await redirectTarget(deleteApplication(null, form({ id: APPLICATION_ID, user_id: "attacker" })));

    expect(target).toBe(HOME_PATH);
    expect(deleteApplicationById).toHaveBeenCalledWith(USER_ID, APPLICATION_ID);
    expect(vi.mocked(revalidatePath).mock.calls).toEqual([[HOME_PATH], [applicationPath(APPLICATION_ID)]]);
  });

  it("reports not found for another user's or an unknown application and stays on the page", async () => {
    const result = await deleteApplication(null, form({ id: OTHER_ID }));

    expect(result).toEqual({ ok: false, error: "This application no longer exists." });
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("rejects a malformed id without touching the database", async () => {
    await expect(deleteApplication(null, form({ id: "../profile" }))).resolves.toEqual({
      ok: false,
      error: "This application no longer exists.",
    });
    expectNoDatabaseCall();
  });

  it("redirects to /login and touches nothing when unauthenticated", async () => {
    signOut();

    await expect(deleteApplication(null, form({ id: APPLICATION_ID }))).rejects.toMatchObject({ url: LOGIN_PATH });
    expectNoDatabaseCall();
  });

  it("returns a friendly error without database details when deleting fails", async () => {
    vi.mocked(deleteApplicationById).mockResolvedValue({ ok: false });

    await expect(deleteApplication(null, form({ id: APPLICATION_ID }))).resolves.toEqual({
      ok: false,
      error: "We could not delete the application. Please try again.",
    });
    expect(revalidatePath).not.toHaveBeenCalled();
  });
});
