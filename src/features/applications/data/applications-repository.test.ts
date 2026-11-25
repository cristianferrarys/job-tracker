import { describe, expect, it, vi } from "vitest";
import { createClient } from "@/lib/supabase/server";
import { APPLICATION_ID, buildApplication } from "@/test/applications";
import type { ApplicationInput } from "../domain/application";
import {
  deleteApplicationById,
  findApplicationById,
  insertApplication,
  listApplicationsByUser,
  updateApplicationById,
  updateApplicationStatusById,
} from "./applications-repository";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));

type QueryResult = { data: unknown; error: { message: string } | null };

const USER_ID = "user-1";
const DB_ERROR = { message: "permission denied for table applications" };

const ROW = {
  id: APPLICATION_ID,
  company: "Acme",
  role: "Frontend Developer",
  job_url: "https://jobs.example.com/acme/frontend",
  job_description: "Build UIs with React and TypeScript.",
  status: "applied",
  notes: "Referred by Ana.",
  applied_date: "2026-11-20",
  created_at: "2026-11-20T09:00:00Z",
  updated_at: "2026-11-20T09:00:00Z",
};

const APPLICATION = buildApplication();

const SUMMARY_ROW = { id: APPLICATION_ID, company: "Acme", role: "Frontend Developer", status: "interview", applied_date: null };

const INPUT: ApplicationInput = {
  company: "Acme",
  role: "Frontend Developer",
  jobUrl: null,
  jobDescription: "",
  status: "offer",
  appliedDate: null,
  notes: null,
};

const INPUT_VALUES = {
  company: "Acme",
  role: "Frontend Developer",
  job_url: null,
  job_description: "",
  status: "offer",
  applied_date: null,
  notes: null,
};

/** Chainable stand-in for the Supabase query builder; awaiting it (or a terminal call) yields `result`. */
function fakeSupabase(result: QueryResult) {
  const query = {
    select: vi.fn(() => query),
    insert: vi.fn(() => query),
    update: vi.fn(() => query),
    delete: vi.fn(() => query),
    eq: vi.fn(() => query),
    order: vi.fn(() => query),
    single: vi.fn(async () => result),
    maybeSingle: vi.fn(async () => result),
    then: (resolve: (value: QueryResult) => unknown) => Promise.resolve(result).then(resolve),
  };
  const from = vi.fn(() => query);
  vi.mocked(createClient).mockResolvedValue({ from } as unknown as Awaited<ReturnType<typeof createClient>>);
  return { from, query };
}

describe("listApplicationsByUser", () => {
  it("reads the board fields of the user's applications, newest applied date first, and maps them", async () => {
    const { from, query } = fakeSupabase({ data: [SUMMARY_ROW], error: null });

    await expect(listApplicationsByUser(USER_ID)).resolves.toEqual({
      ok: true,
      data: [{ id: APPLICATION_ID, company: "Acme", role: "Frontend Developer", status: "interview", appliedDate: null }],
    });
    expect(from).toHaveBeenCalledWith("applications");
    expect(query.select).toHaveBeenCalledWith("id, company, role, status, applied_date");
    expect(query.eq).toHaveBeenCalledWith("user_id", USER_ID);
    expect(query.order.mock.calls).toEqual([
      ["applied_date", { ascending: false, nullsFirst: false }],
      ["created_at", { ascending: false }],
    ]);
  });

  it("returns a failure without database details on error", async () => {
    fakeSupabase({ data: null, error: DB_ERROR });

    await expect(listApplicationsByUser(USER_ID)).resolves.toEqual({ ok: false });
  });
});

describe("findApplicationById", () => {
  it("scopes the lookup to the id and the user, and maps the row", async () => {
    const { query } = fakeSupabase({ data: ROW, error: null });

    await expect(findApplicationById(USER_ID, APPLICATION_ID)).resolves.toEqual({ ok: true, data: APPLICATION });
    expect(query.eq.mock.calls).toEqual([
      ["id", APPLICATION_ID],
      ["user_id", USER_ID],
    ]);
  });

  it("returns null when no row of the user matches", async () => {
    fakeSupabase({ data: null, error: null });

    await expect(findApplicationById(USER_ID, APPLICATION_ID)).resolves.toEqual({ ok: true, data: null });
  });

  it("returns a failure without database details on error", async () => {
    fakeSupabase({ data: null, error: DB_ERROR });

    await expect(findApplicationById(USER_ID, APPLICATION_ID)).resolves.toEqual({ ok: false });
  });
});

describe("insertApplication", () => {
  it("inserts the input as a row owned by the user and returns the saved application", async () => {
    const { query } = fakeSupabase({ data: ROW, error: null });

    await expect(insertApplication(USER_ID, INPUT)).resolves.toEqual({ ok: true, data: APPLICATION });
    expect(query.insert).toHaveBeenCalledWith({ ...INPUT_VALUES, user_id: USER_ID });
  });

  it("returns a failure without database details on error", async () => {
    fakeSupabase({ data: null, error: DB_ERROR });

    await expect(insertApplication(USER_ID, INPUT)).resolves.toEqual({ ok: false });
  });
});

describe("updateApplicationById", () => {
  it("updates every field of the user's application without changing its owner", async () => {
    const { query } = fakeSupabase({ data: { ...ROW, status: "offer" }, error: null });

    await expect(updateApplicationById(USER_ID, APPLICATION_ID, INPUT)).resolves.toEqual({
      ok: true,
      data: { ...APPLICATION, status: "offer" },
    });
    expect(query.update).toHaveBeenCalledWith(INPUT_VALUES);
    expect(query.eq.mock.calls).toEqual([
      ["id", APPLICATION_ID],
      ["user_id", USER_ID],
    ]);
  });

  it("returns null when the application is missing or belongs to someone else", async () => {
    fakeSupabase({ data: null, error: null });

    await expect(updateApplicationById(USER_ID, APPLICATION_ID, INPUT)).resolves.toEqual({ ok: true, data: null });
  });

  it("returns a failure without database details on error", async () => {
    fakeSupabase({ data: null, error: DB_ERROR });

    await expect(updateApplicationById(USER_ID, APPLICATION_ID, INPUT)).resolves.toEqual({ ok: false });
  });
});

describe("updateApplicationStatusById", () => {
  it("changes only the status of the user's application", async () => {
    const { query } = fakeSupabase({ data: { ...ROW, status: "interview" }, error: null });

    await expect(updateApplicationStatusById(USER_ID, APPLICATION_ID, "interview")).resolves.toEqual({
      ok: true,
      data: { ...APPLICATION, status: "interview" },
    });
    expect(query.update).toHaveBeenCalledWith({ status: "interview" });
    expect(query.eq.mock.calls).toEqual([
      ["id", APPLICATION_ID],
      ["user_id", USER_ID],
    ]);
  });

  it("returns null when no application of the user matches", async () => {
    fakeSupabase({ data: null, error: null });

    await expect(updateApplicationStatusById(USER_ID, APPLICATION_ID, "offer")).resolves.toEqual({
      ok: true,
      data: null,
    });
  });
});

describe("deleteApplicationById", () => {
  it("deletes the user's application and reports that it existed", async () => {
    const { query } = fakeSupabase({ data: { id: APPLICATION_ID }, error: null });

    await expect(deleteApplicationById(USER_ID, APPLICATION_ID)).resolves.toEqual({ ok: true, data: true });
    expect(query.delete).toHaveBeenCalled();
    expect(query.eq.mock.calls).toEqual([
      ["id", APPLICATION_ID],
      ["user_id", USER_ID],
    ]);
  });

  it("reports false when nothing of the user matched", async () => {
    fakeSupabase({ data: null, error: null });

    await expect(deleteApplicationById(USER_ID, APPLICATION_ID)).resolves.toEqual({ ok: true, data: false });
  });

  it("returns a failure without database details on error", async () => {
    fakeSupabase({ data: null, error: DB_ERROR });

    await expect(deleteApplicationById(USER_ID, APPLICATION_ID)).resolves.toEqual({ ok: false });
  });
});
