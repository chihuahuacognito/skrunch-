import type { Equipment, Exercise } from '../library/types';
import { blockState } from './block';
import { isZone2 } from './parts';
import { INCREMENT_KG, lastLog, prescribeReps } from './prescribe';
import type { History, LoggedExercise } from './types';

// Tunable (spec 8.5, 6.4).
const SETS = 3;
const DELOAD_SETS = 2;
const MAIN_REST = 120;
const ACCESSORY_REST = 90;
const ZONE2_MINUTES = 25;
const INTERVAL_ROUNDS = 4;
const INTERVAL_REST = 60;

export type Role = 'main' | 'accessory';

export interface Target {
  sets: number;
  /** Target reps per set; null for timed work. */
  reps: number | null;
  /** Timed work only. */
  minutes: number | null;
  /** kg; 0 for bodyweight; null when not known yet or not loaded. */
  weight: number | null;
  restSeconds: number;
  range: [number, number] | null;
  /** A loaded lift seen for the first time: the first dot or Completed asks for the weight. */
  needsWeight: boolean;
}

const BODYWEIGHT_KIT: readonly Equipment[] = ['bodyweight', 'pull-up bar', 'bench', 'mat'];

/** No load to enter: no equipment, or only things you lift yourself on. */
export function isBodyweight(e: Exercise): boolean {
  return e.equipment.every(x => BODYWEIGHT_KIT.includes(x));
}

/** The day's target was met: every planned set done, each at the target reps or more. Pre-v3 logs never count. */
export function isHit(log: LoggedExercise): boolean {
  if (log.plannedSets === null || log.targetMin === null || log.sets.length < log.plannedSets) return false;
  return log.sets.every(s => s.reps !== null && s.reps >= log.targetMin!);
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

function conditioningTarget(e: Exercise): Target {
  const timed = { sets: 1, reps: null, weight: null, restSeconds: 0, range: null, needsWeight: false };
  if (isZone2(e)) return { ...timed, minutes: ZONE2_MINUTES };
  if (e.dose.format === 'duration') return { ...timed, minutes: e.dose.minutes };
  const reps = e.dose.format === 'reps' ? e.dose.min : null;
  return { sets: INTERVAL_ROUNDS, reps, minutes: null, weight: null, restSeconds: INTERVAL_REST, range: null, needsWeight: false };
}

/**
 * Tonight's exact target (double progression). A hit adds a rep up to the top of the range; every set at the top
 * adds the equipment increment and restarts at the bottom. A miss repeats the target. Deload: 2 sets, no progression.
 */
export function targetFor(e: Exercise, role: Role, history: History, today: string): Target {
  if (e.type === 'conditioning') return conditioningTarget(e);
  const dose = prescribeReps(e.dose, role);
  const range: [number, number] = dose.format === 'reps' ? [dose.min, dose.max] : [0, 0];
  const [min, max] = range;
  const { deload } = blockState(history, today);
  const base = { sets: deload ? DELOAD_SETS : SETS, minutes: null, restSeconds: role === 'main' ? MAIN_REST : ACCESSORY_REST, range };

  const last = lastLog(e.id, history);
  const lastWeight = last?.sets[0]?.weight ?? null;
  if (!last || lastWeight === null) {
    const bodyweight = isBodyweight(e);
    return { ...base, reps: min, weight: bodyweight ? 0 : null, needsWeight: !bodyweight };
  }

  // The last target is judged inside tonight's range, so a log from a different range (or before v3) still makes sense.
  const lastTarget = clamp(last.targetMin ?? min, min, max);
  if (deload || !isHit({ ...last, targetMin: lastTarget })) return { ...base, reps: lastTarget, weight: lastWeight, needsWeight: false };

  const allAtTop = last.sets.every(s => s.reps !== null && s.reps >= max);
  if (allAtTop && lastWeight > 0) {
    return { ...base, reps: min, weight: lastWeight + INCREMENT_KG[e.equipment[0] ?? 'other'], needsWeight: false };
  }
  return { ...base, reps: Math.min(lastTarget + 1, max), weight: lastWeight, needsWeight: false };
}
