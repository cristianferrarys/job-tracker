const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const DATE_FORMAT = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

function toUtcDate(year: number, month: number, day: number): Date {
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return date;
}

/** True for a real calendar date written as `YYYY-MM-DD` (year 1 or later). */
export function isIsoDate(value: string): boolean {
  const match = ISO_DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }
  const [year, month, day] = match.slice(1).map(Number);
  const date = toUtcDate(year, month, day);
  return (
    year >= 1 &&
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Formats a `YYYY-MM-DD` date (e.g. "Mar 5, 2026"). The date is read and printed in UTC, so the
 * day never shifts with the time zone of the server or the browser.
 */
export function formatIsoDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return DATE_FORMAT.format(toUtcDate(year, month, day));
}
