import { daysBetween } from './dates';
import type { History } from './types';

const GAP_DAYS = 14;
const DELOAD_WEEK = 6;

export interface BlockState { week: number; deload: boolean; calibration: boolean }

/**
 * Where today sits in the training block. The block starts at the first session; a 14-day break restarts it in
 * calibration. Week 6 is the deload. The week after a deload starts a new block.
 */
export function blockState(history: History, today: string): BlockState {
  const dates = [...new Set(history.sessions.map(s => s.date))].filter(d => daysBetween(d, today) >= 0).sort();
  if (dates.length === 0) return { week: 1, deload: false, calibration: true };

  // The block's anchor: the first session, or the first session (or today) after a long break.
  let start = dates[0];
  for (let i = 1; i < dates.length; i++) if (daysBetween(dates[i - 1], dates[i]) >= GAP_DAYS) start = dates[i];
  if (daysBetween(dates[dates.length - 1], today) >= GAP_DAYS) start = today;

  const elapsed = daysBetween(start, today);
  const blockIndex = Math.floor(elapsed / (DELOAD_WEEK * 7));
  const week = Math.floor((elapsed % (DELOAD_WEEK * 7)) / 7) + 1;
  return { week, deload: week === DELOAD_WEEK, calibration: blockIndex === 0 && week === 1 };
}
