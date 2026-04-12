/**
 * Parse a YYYY-MM-DD date string as local midnight (not UTC).
 * `new Date("2026-04-12")` parses as UTC midnight, which shifts
 * to the previous day in western timezones. This avoids that.
 */
export function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Format a YYYY-MM-DD date string for display using the user's locale.
 */
export function formatAirDate(dateStr: string | null): string {
  if (!dateStr) return "TBA";
  const date = parseLocalDate(dateStr);
  return new Intl.DateTimeFormat(undefined, {
    month: "numeric",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
