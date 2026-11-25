import { describe, expect, it, vi } from "vitest";
import { formatIsoDate, isIsoDate } from "./dates";

describe("isIsoDate", () => {
  it.each(["2026-11-24", "2024-02-29", "2026-12-31", "0001-01-01"])("accepts %s", (value) => {
    expect(isIsoDate(value)).toBe(true);
  });

  it.each([
    "2026-02-29",
    "2026-04-31",
    "2026-13-01",
    "2026-00-01",
    "2026-01-00",
    "0000-01-01",
    "2026-1-01",
    "2026-01-01T00:00:00Z",
    " 2026-01-01",
    "",
  ])("rejects %j", (value) => {
    expect(isIsoDate(value)).toBe(false);
  });
});

describe("formatIsoDate", () => {
  it("formats the date in English", () => {
    expect(formatIsoDate("2026-03-05")).toBe("Mar 5, 2026");
  });

  it.each(["Pacific/Kiritimati", "America/Anchorage", "UTC"])(
    "prints the same day in the %s time zone",
    (timeZone) => {
      vi.stubEnv("TZ", timeZone);

      expect(formatIsoDate("2026-01-01")).toBe("Jan 1, 2026");
      expect(formatIsoDate("2026-12-31")).toBe("Dec 31, 2026");
    },
  );
});
