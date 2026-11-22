import type { BudgetMuscle, Exercise } from '../library/types';
import { BUDGET_MUSCLES } from '../library/vocab';
import { daysBetween } from './dates';
import type { SessionLog } from './types';

/**
 * Budget credit for one set: 1 per primary, 0.5 per secondary, strength only.
 * Front delts count only as direct work: chest presses would otherwise use up the 0-4 budget on their own.
 */
export function setCredit(e: Exercise): Partial<Record<BudgetMuscle, number>> {
  const out: Partial<Record<BudgetMuscle, number>> = {};
  if (e.type !== 'strength') return out;
  for (const m of e.secondary) if (m !== 'frontDelts') out[m] = 0.5;
  for (const m of e.primary) out[m] = 1;
  return out;
}

export function zeroVolume(): Record<BudgetMuscle, number> {
  return Object.fromEntries(BUDGET_MUSCLES.map(m => [m, 0])) as Record<BudgetMuscle, number>;
}

/** Hard sets per muscle over the rolling 7 days ending today (today included). Unknown exercise ids are ignored. */
export function weeklyVolume(lib: Exercise[], sessions: SessionLog[], today: string): Record<BudgetMuscle, number> {
  const byId = new Map(lib.map(e => [e.id, e]));
  const out = zeroVolume();
  for (const s of sessions) {
    const age = daysBetween(s.date, today);
    if (age < 0 || age > 6) continue;
    for (const x of s.exercises) {
      const e = byId.get(x.exerciseId);
      if (!e) continue;
      for (const [m, c] of Object.entries(setCredit(e)) as [BudgetMuscle, number][]) out[m] += c * x.sets.length;
    }
  }
  return out;
}
