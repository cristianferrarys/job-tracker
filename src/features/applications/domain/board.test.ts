import { describe, expect, it } from "vitest";
import { buildApplication } from "@/test/applications";
import { groupByStatus } from "./board";
import { APPLICATION_STATUSES, STATUS_LABELS } from "./status";

describe("groupByStatus", () => {
  it("returns one labeled column per status in board order, even with no applications", () => {
    const columns = groupByStatus([]);

    expect(columns.map((column) => column.status)).toEqual([...APPLICATION_STATUSES]);
    expect(columns.map((column) => column.label)).toEqual(APPLICATION_STATUSES.map((status) => STATUS_LABELS[status]));
    expect(columns.every((column) => column.applications.length === 0)).toBe(true);
  });

  it("puts every application in the column of its status and leaves the others empty", () => {
    const first = buildApplication({ id: "a", status: "interview" });
    const second = buildApplication({ id: "b", status: "applied" });
    const third = buildApplication({ id: "c", status: "interview" });

    const columns = groupByStatus([first, second, third]);

    expect(Object.fromEntries(columns.map((column) => [column.status, column.applications.map(({ id }) => id)]))).toEqual({
      applied: ["b"],
      interview: ["a", "c"],
      offer: [],
      rejected: [],
    });
  });

  it("keeps the input order inside a column", () => {
    const applications = ["z", "m", "a"].map((id) => buildApplication({ id, status: "offer" }));

    const offer = groupByStatus(applications).find((column) => column.status === "offer");

    expect(offer?.applications.map(({ id }) => id)).toEqual(["z", "m", "a"]);
  });

  it("counts each column", () => {
    const applications = [
      buildApplication({ id: "1", status: "rejected" }),
      buildApplication({ id: "2", status: "rejected" }),
      buildApplication({ id: "3", status: "offer" }),
    ];

    expect(groupByStatus(applications).map((column) => column.applications.length)).toEqual([0, 0, 1, 2]);
  });
});
