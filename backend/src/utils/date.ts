/** ISO 8601 date (YYYY-MM-DD) */
export function isoDate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** ISO 8601 datetime (UTC) */
export function isoDateTime(d: Date = new Date()): string {
  return d.toISOString();
}

/** Ethiopian fiscal year (approx: 8th Sept → 7th Sept, offset from Gregorian by 7 or 8) */
export function ethiopianFiscalYear(d: Date = new Date()): number {
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  const beforeNewYear = month < 9 || (month === 9 && day < 11);
  return beforeNewYear ? year - 8 : year - 7;
}

/** Difference in days between two dates (positive = b is later) */
export function daysBetween(a: Date, b: Date): number {
  const MS_PER_DAY = 86_400_000;
  return Math.round((b.getTime() - a.getTime()) / MS_PER_DAY);
}

/** True if the date is in the past */
export function isOverdue(due: Date | string): boolean {
  const d = typeof due === 'string' ? new Date(due) : due;
  return d.getTime() < Date.now();
}