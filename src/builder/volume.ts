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

/** A muscle counts as trained on a day with at least this much credit: 2 direct sets, or 3 as a secondary mover. */
export const TRAINED_CREDIT = 1.5;

/** Budget credit per muscle for one logged session. Unknown exercise ids are ignored. */
export function sessionCredit(lib: Exercise[], s: SessionLog): Record<BudgetMuscle, number> {
  const byId = new Map(lib.map(e => [e.id, e]));
  const out = zeroVolume();
  for (const x of s.exercises) {
    const e = byId.get(x.exerciseId);
    if (!e) continue;
    for (const [m, c] of Object.entries(setCredit(e)) as [BudgetMuscle, number][]) out[m] += c * x.sets.length;
  }
  return out;
}

/** Distinct days in the rolling 7 days (today included) on which each muscle was trained (TRAINED_CREDIT or more). */
export function trainingDays(lib: Exercise[], sessions: SessionLog[], today: string): Record<BudgetMuscle, number> {
  const perDay = new Map<string, Record<BudgetMuscle, number>>();
  for (const s of sessions) {
    const age = daysBetween(s.date, today);
    if (age < 0 || age > 6) continue;
    const day = perDay.get(s.date) ?? zeroVolume();
    for (const [m, c] of Object.entries(sessionCredit(lib, s)) as [BudgetMuscle, number][]) day[m] += c;
    perDay.set(s.date, day);
  }
  const out = zeroVolume();
  for (const day of perDay.values()) for (const m of Object.keys(day) as BudgetMuscle[]) if (day[m] >= TRAINED_CREDIT) out[m] += 1;
  return out;
}
