import type { BudgetMuscle } from '../library/types';
import { BUDGET_MUSCLES } from '../library/vocab';
import { blockState } from './block';
import { BUDGET, weeklyTargets } from './budget';
import type { BuilderInput } from './types';
import { trainingDays, weeklyVolume } from './volume';

// Tunable defaults for the twice-a-week rule.
const FREQ_NEED_NONE = 1;
const FREQ_NEED_ONCE = 0.35;
const FREQ_MIN_SETS = 3;

/** This week's target per muscle, from the block position. */
export function targetsFor(input: BuilderInput): Record<BudgetMuscle, number> {
  const { week, deload } = blockState(input.history, input.today);
  return weeklyTargets(week, deload);
}

/** How far under this week's target each muscle is, as a 0..1 fraction (0 when the target is 0). */
export function deficits(input: BuilderInput): Record<BudgetMuscle, number> {
  const targets = targetsFor(input);
  const done = weeklyVolume(input.library, input.history.sessions, input.today);
  const out = {} as Record<BudgetMuscle, number>;
  for (const m of BUDGET_MUSCLES) {
    const t = targets[m];
    out[m] = t > 0 ? Math.min(1, Math.max(0, (t - done[m]) / t)) : 0;
  }
  return out;
}

/**
 * What each muscle needs tonight, 0..1: its budget deficit, raised when it has been trained on fewer than
 * 2 days this week (the spec's twice-a-week rule), so frequency counts as well as volume.
 */
export function needs(input: BuilderInput): Record<BudgetMuscle, number> {
  const def = deficits(input);
  const days = trainingDays(input.library, input.history.sessions, input.today);
  const done = weeklyVolume(input.library, input.history.sessions, input.today);
  const targets = targetsFor(input);
  const out = {} as Record<BudgetMuscle, number>;
  for (const m of BUDGET_MUSCLES) {
    // Frequency only matters while the week still has room for a real exposure under the ceiling.
    const room = done[m] + FREQ_MIN_SETS <= BUDGET[m][1];
    const freq = targets[m] === 0 || !room ? 0 : days[m] === 0 ? FREQ_NEED_NONE : days[m] === 1 ? FREQ_NEED_ONCE : 0;
    out[m] = Math.max(def[m], freq);
  }
  return out;
}
