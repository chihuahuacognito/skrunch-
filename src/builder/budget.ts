import type { BudgetMuscle } from '../library/types';
import { BUDGET_MUSCLES } from '../library/vocab';

/** Hard sets per muscle per week, [low, high] (design doc table). */
export const BUDGET: Record<BudgetMuscle, readonly [number, number]> = {
  chest: [12, 16], lats: [8, 10], midBack: [8, 10], quads: [8, 12], hamstrings: [6, 10], glutes: [6, 10],
  sideDelts: [8, 12], rearDelts: [6, 10], frontDelts: [0, 4], biceps: [6, 10], triceps: [6, 10], core: [6, 10],
  calves: [0, 8],
};

/** Muscles that need 72 hours after a Lower session. */
export const LEGS: readonly BudgetMuscle[] = ['quads', 'hamstrings', 'glutes', 'calves'];

/** Week 1 starts at the low end and adds a set a week up to the high end; a deload is about half the low end. */
export function weeklyTargets(week: number, deload: boolean): Record<BudgetMuscle, number> {
  const out = {} as Record<BudgetMuscle, number>;
  for (const m of BUDGET_MUSCLES) {
    const [low, high] = BUDGET[m];
    out[m] = deload ? Math.round(low / 2) : Math.min(low + week - 1, high);
  }
  return out;
}
