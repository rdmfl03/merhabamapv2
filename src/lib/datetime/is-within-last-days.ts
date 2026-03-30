/** True if `date` is within the last `days` (inclusive of boundary). */
export function isWithinLastDays(date: Date, days: number, nowMs = Date.now()): boolean {
  const ms = days * 24 * 60 * 60 * 1000;
  return date.getTime() >= nowMs - ms;
}
