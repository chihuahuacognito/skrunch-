import { addDays, daysBetween } from './dates';
import type { History } from './types';

const GAP_DAYS = 14;
const DELOAD_WEEK = 6;
const WRECKED_TRIGGER = 3;

export interface BlockState { week: number; deload: boolean; calibration: boolean }

/**
 * Where today sits in the training block. The block starts at the first session; a 14-day break restarts it in
 * calibration. Week 6 is the deload, or the week after any block week with 3 Wrecked check-ins. The week after a
 * deload starts a new block.
 */
export function blockState(history: History, today: string): BlockState {
  const dates = [...new Set(history.sessions.map(s => s.date))].filter(d => daysBetween(d, today) >= 0).sort();
  if (dates.length === 0) return { week: 1, deload: false, calibration: true };

  // The block's anchor: the first session, or the first session (or today) after a long break.
  let start = dates[0];
  for (let i = 1; i < dates.length; i++) if (daysBetween(dates[i - 1], dates[i]) >= GAP_DAYS) start = dates[i];
  if (daysBetween(dates[dates.length - 1], today) >= GAP_DAYS) start = today;

  const wrecked = history.checkIns.filter(c => c.value === 'wrecked').map(c => c.date);
  let blockStart = start;
  let isFirst = true;
  for (;;) {
    let deloadWeek = DELOAD_WEEK;
    for (let w = 1; w < DELOAD_WEEK - 1; w++) {
      const from = addDays(blockStart, (w - 1) * 7);
      const n = wrecked.filter(d => daysBetween(from, d) >= 0 && daysBetween(from, d) < 7).length;
      if (n >= WRECKED_TRIGGER) { deloadWeek = w + 1; break; }
    }
    const week = Math.floor(daysBetween(blockStart, today) / 7) + 1;
    if (week <= deloadWeek) {
      return { week, deload: week === deloadWeek, calibration: isFirst && week === 1 };
    }
    blockStart = addDays(blockStart, deloadWeek * 7);
    isFirst = false;
  }
}
