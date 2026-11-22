const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The training day as local YYYY-MM-DD. The day rolls over at `rolloverHour` (04:00), so reopening the app
 * just after midnight after an evening session is still the same day. Never use toISOString(): that is UTC.
 */
export function localToday(now: Date = new Date(), rolloverHour = 4): string {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - rolloverHour, now.getMinutes());
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
