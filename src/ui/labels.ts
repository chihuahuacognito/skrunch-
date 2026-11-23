import type { CheckIn, Chip, Feedback, SessionDose, SessionKind } from '../builder';

export const FOCUS_LABEL: Record<SessionKind, string> = {
  'chest-back': 'Chest / Back',
  lower: 'Lower',
  'shoulders-arms': 'Shoulders / Arms',
  'full-body': 'Full Body',
  conditioning: 'Conditioning',
  mobility: 'Mobility + Zone 2',
  rest: 'Rest',
  'desk-reset': 'Desk reset',
};

export const CHECKIN_LABEL: Record<CheckIn, string> = { good: 'Good', ok: 'OK', wrecked: 'Wrecked' };

export const CHECKIN_HINT: Record<CheckIn, string> = {
  good: 'Full session',
  ok: 'Fewer sets, hold weights',
  wrecked: 'Rest, mobility or a minimum dose',
};

export const DOSE_LABEL: Record<SessionDose, string> = { full: 'Full', reduced: 'Reduced', minimum: 'Minimum dose' };

export const CHIP_LABEL: Record<Chip, string> = { easy: 'Easy', right: 'Right', hard: 'Hard' };

/** The summary's static out-of-app note. Not tracked in v1. */
export const GUIDANCE = [
  'Steps: 8,000-10,000 a day.',
  'Zone 2: 90-150 min a week.',
  'Protein: 1.6-2.2 g per kg a day - dal, paneer, curd, soya chunks, eggs, chicken.',
];

export const FEEDBACK_LABEL: Record<Feedback, string> = { more: 'More of this', less: 'Less of this', never: 'Never again' };

export const DESK_RESET_HINT = '5-10 min stretch, no check-in';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** '2026-11-22' -> 'Sun 22 Nov'. */
export function dayLabel(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const day = new Date(y, m - 1, d);
  return `${WEEKDAYS[day.getDay()]} ${d} ${MONTHS[m - 1]}`;
}
