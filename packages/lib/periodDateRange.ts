/**
 * Period range limits are stored as UTC midnight date-only values
 * (e.g. "Aug 9" → 2026-08-09T00:00:00.000Z). Date pickers and date-fns
 * format() use the browser's local timezone, so west-of-UTC zones would
 * otherwise render/select the previous calendar day.
 */

function isUtcMidnightDateOnly(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

/** Local calendar day the user picked → UTC midnight for storage. */
export function localCalendarDateToUtcDateOnly(date: Date): Date {
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
}

/**
 * Stored UTC date-only (or legacy non-UTC-midnight value) → local midnight
 * Date suitable for DateRangePicker / date-fns local formatting.
 */
export function utcDateOnlyToLocalCalendarDate(date: Date): Date {
  if (isUtcMidnightDateOnly(date)) {
    return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
  }

  // Legacy browser-local midnight stored as UTC: keep local calendar components
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
