import type { Chip, Feedback } from '../builder';

export const CHIP_LABEL: Record<Chip, string> = { easy: 'Easy', right: 'Right', hard: 'Hard' };

export const FEEDBACK_LABEL: Record<Feedback, string> = { more: 'More of this', less: 'Less of this', never: 'Never again' };

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-11-22' -> 'Sun 22 Nov'. */
export function dayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(y, m - 1, d);
  return `${WEEKDAYS[day.getDay()]} ${d} ${MONTHS[m - 1]}`;
}

/** The rolling 7 days ending today: 'Thu 19 - Wed 25 Nov', or 'Fri 27 Nov - Thu 3 Dec' across a month. */
export function weekRangeLabel(today: string): string {
  const [y, m, d] = today.split('-').map(Number);
  const start = new Date(y, m - 1, d - 6);
  const first = `${WEEKDAYS[start.getDay()]} ${start.getDate()}`;
  return `${start.getMonth() === m - 1 ? first : `${first} ${MONTHS[start.getMonth()]}`} - ${dayLabel(today)}`;
}

/** 'Today', '5d ago', or 'Never'. */
export function agoText(daysSince: number | null): string {
  if (daysSince === null) return 'Never';
  return daysSince === 0 ? 'Today' : `${daysSince}d ago`;
}

/** Sets can be half sets (a secondary mover counts 0.5). */
export function setsText(sets: number): string {
  return Number.isInteger(sets) ? String(sets) : sets.toFixed(1);
}
