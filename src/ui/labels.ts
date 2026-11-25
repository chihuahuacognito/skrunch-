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
