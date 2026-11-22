import type { BudgetMuscle, Exercise } from '../library/types';
import { LEGS } from './budget';
import { daysBetween } from './dates';
import type { SessionLog } from './types';

/**
 * Muscles still recovering today: any primary set within 48 hours (today or yesterday),
 * or within 72 hours for leg muscles trained in a Lower session. Secondary work does not block.
 */
export function unrecovered(lib: Exercise[], sessions: SessionLog[], today: string): Set<BudgetMuscle> {
  const byId = new Map(lib.map(e => [e.id, e]));
  const out = new Set<BudgetMuscle>();
  for (const s of sessions) {
    const age = daysBetween(s.date, today);
    if (age < 0 || age > 2) continue;
    for (const x of s.exercises) {
      const e = byId.get(x.exerciseId);
      if (!e || e.type !== 'strength' || x.sets.length === 0) continue;
      for (const m of e.primary) {
        const window = s.focus === 'lower' && LEGS.includes(m) ? 2 : 1;
        if (age <= window) out.add(m);
      }
    }
  }
  return out;
}
