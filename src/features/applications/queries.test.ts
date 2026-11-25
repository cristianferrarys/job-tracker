import { describe, expect, it, vi } from "vitest";
import { requireUser } from "@/features/auth/session";
import { LOGIN_PATH } from "@/features/auth/domain/route-access";
import { APPLICATION_ID, buildApplication } from "@/test/applications";
import { throwRedirect } from "@/test/auth-mocks";
import { findApplicationById, listApplicationsByUser } from "./data/applications-repository";
import { getMyApplication, getMyApplications } from "./queries";

vi.mock("server-only", () => ({}));
vi.mock("@/features/auth/session", () => ({ requireUser: vi.fn() }));
vi.mock("./data/applications-repository", () => ({
  findApplicationById: vi.fn(),
  listApplicationsByUser: vi.fn(),
}));

const application = buildApplication();

function signIn() {
  vi.mocked(requireUser).mockResolvedValue({ id: "user-1", email: "ana@example.com" });
}

function signOut() {
  vi.mocked(requireUser).mockImplementation(async () => throwRedirect(LOGIN_PATH));
}

describe("getMyApplications", () => {
  it("lists the applications of the signed-in user", async () => {
    signIn();
    vi.mocked(listApplicationsByUser).mockImplementation(async (userId) =>
      userId === "user-1" ? { ok: true, data: [application] } : { ok: true, data: [] },
    );

    await expect(getMyApplications()).resolves.toEqual({ ok: true, data: [application] });
  });

  it("redirects to /login and reads nothing when there is no user", async () => {
    signOut();

    await expect(getMyApplications()).rejects.toMatchObject({ url: LOGIN_PATH });
    expect(listApplicationsByUser).not.toHaveBeenCalled();
  });
});

describe("getMyApplication", () => {
  it("loads the application by id for the signed-in user", async () => {
    signIn();
    vi.mocked(findApplicationById).mockImplementation(async (userId, id) =>
      userId === "user-1" && id === APPLICATION_ID ? { ok: true, data: application } : { ok: true, data: null },
    );

    await expect(getMyApplication(APPLICATION_ID)).resolves.toEqual({ ok: true, data: application });
  });

  it("asks only for the signed-in user's row, so another user's application is not found", async () => {
    vi.mocked(requireUser).mockResolvedValue({ id: "user-2", email: "bo@example.com" });
    vi.mocked(findApplicationById).mockImplementation(async (userId) =>
      userId === "user-1" ? { ok: true, data: application } : { ok: true, data: null },
    );

    await expect(getMyApplication(APPLICATION_ID)).resolves.toEqual({ ok: true, data: null });
  });

  it("returns null for a malformed id without querying the database", async () => {
    signIn();

    await expect(getMyApplication("not-a-uuid")).resolves.toEqual({ ok: true, data: null });
    expect(findApplicationById).not.toHaveBeenCalled();
  });

  it("passes a database failure through without details", async () => {
    signIn();
    vi.mocked(findApplicationById).mockResolvedValue({ ok: false });

    await expect(getMyApplication(APPLICATION_ID)).resolves.toEqual({ ok: false });
  });

  it("redirects to /login and reads nothing when there is no user", async () => {
    signOut();

    await expect(getMyApplication(APPLICATION_ID)).rejects.toMatchObject({ url: LOGIN_PATH });
    expect(findApplicationById).not.toHaveBeenCalled();
  });
});
