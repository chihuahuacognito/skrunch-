import { lastLog, type History, type PlannedExercise, type PlannedSession } from '../builder';
import type { Equipment, Exercise } from '../library/types';
import type { SetEntry, Step, WorkoutState } from './types';

const BODYWEIGHT_KIT: readonly Equipment[] = ['bodyweight', 'pull-up bar', 'bench', 'mat'];

/** No load to enter: no equipment, or only things you lift yourself on. */
export function isBodyweight(e: Exercise): boolean {
  return e.equipment.every(x => BODYWEIGHT_KIT.includes(x));
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Sets as they appear before the first tick. Weight is the planned weight (0 for a bodyweight lift, blank for a loaded
 * lift seen for the first time; items without a slot carry none). Reps repeat last time's per set, within the range,
 * and restart at the bottom of the range the first time or after the weight went up.
 */
export function prefillSets(item: PlannedExercise, e: Exercise, history: History): SetEntry[] {
  const weight = item.slot === null ? null : item.weight ?? (isBodyweight(e) ? 0 : null);
  const { dose } = item;
  const last = dose.format === 'reps' && !item.progressed ? lastLog(e.id, history) : null;
  return Array.from({ length: item.sets }, (_, i): SetEntry => {
    if (dose.format === 'hold') return { weight, reps: null, seconds: dose.seconds, done: false };
    if (dose.format === 'duration') return { weight, reps: null, seconds: dose.minutes * 60, done: false };
    const prior = last ? (last.sets[i] ?? last.sets[last.sets.length - 1]).reps : null;
    return { weight, reps: prior === null ? dose.min : clamp(prior, dose.min, dose.max), seconds: null, done: false };
  });
}

/** The workout's screens in order: one per superset block, one per item otherwise. */
export function stepsOf(session: PlannedSession): Step[] {
  return session.blocks.flatMap((b, block) =>
    b.kind === 'superset' ? [{ block, items: b.items.map((_, i) => i) }] : b.items.map((_, i) => ({ block, items: [i] })));
}

export function startWorkout(session: PlannedSession, library: Exercise[], history: History, now: number): WorkoutState {
  const byId = new Map(library.map(e => [e.id, e]));
  const logs = session.blocks.map(b => b.items.map(item => {
    const e = byId.get(item.exerciseId);
    if (!e) throw new Error(`unknown exercise ${item.exerciseId}`);
    return { sets: prefillSets(item, e, history), chip: null };
  }));
  return { version: 1, session, startedAt: now, logs, step: 0, rest: null };
}
