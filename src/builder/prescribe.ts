import type { Dose, Equipment, Exercise } from '../library/types';
import type { History, LoggedExercise, SessionDose } from './types';
import type { SlotKind } from './types';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Main lifts 5-12 reps, superset items 10-20 (min 10-20, max 12-20). Holds and durations pass through. */
export function prescribeReps(dose: Dose, kind: SlotKind): Dose {
  if (dose.format !== 'reps') return dose;
  const [minLo, maxLo, hi] = kind === 'main' ? [5, 5, 12] : [10, 12, 20];
  const max = clamp(dose.max, maxLo, hi);
  const min = Math.min(clamp(dose.min, minLo, hi), max);
  return { format: 'reps', min, max };
}

export function rirFor(dose: SessionDose, calibration: boolean, deload: boolean): [number, number] {
  if (deload || dose === 'minimum') return [3, 4];
  if (calibration) return [3, 3];
  if (dose === 'reduced') return [2, 3];
  return [1, 3];
}

/** Smallest load step per equipment, in kg. */
export const INCREMENT_KG: Record<Equipment, number> = {
  barbell: 2.5, dumbbell: 2.5, cable: 2.5, machine: 5, kettlebell: 4,
  bands: 2.5, bodyweight: 2.5, bench: 2.5, 'pull-up bar': 2.5, 'cardio machine': 2.5, mat: 2.5, other: 2.5,
};

/** Logs of one exercise, most recent session first. */
function logsOf(id: string, history: History): LoggedExercise[] {
  return history.sessions
    .map((s, i) => ({ s, i }))
    .sort((a, b) => (a.s.date === b.s.date ? b.i - a.i : a.s.date < b.s.date ? 1 : -1))
    .flatMap(({ s }) => s.exercises.filter(x => x.exerciseId === id && x.sets.length > 0));
}

/** The most recent logged entry of an exercise with at least one set, or null. */
export function lastLog(exerciseId: string, history: History): LoggedExercise | null {
  return logsOf(exerciseId, history)[0] ?? null;
}

/**
 * Double progression. Every set at the top of the range (and the last-set chip not "hard") adds the smallest step;
 * "easy" on the last two sessions also progresses. Otherwise last time's working weight. Blank on first appearance;
 * 0 kg (bodyweight) never gains kilograms.
 */
export function nextLoad(e: Exercise, history: History, allowProgression: boolean): { weight: number | null; progressed: boolean } {
  const [last, prev] = logsOf(e.id, history);
  const weight = last?.sets[0].weight ?? null;
  if (!last || weight === null) return { weight: null, progressed: false };
  // Bodyweight work (logged at 0 kg) progresses by reps within the range, never by adding kilograms.
  if (weight === 0) return { weight: 0, progressed: false };

  const target = last.targetMax;
  const topOfRange = target !== null && last.sets.every(s => s.reps !== null && s.reps >= target) && last.chip !== 'hard';
  const easyTwice = last.chip === 'easy' && prev?.chip === 'easy';
  if (allowProgression && (topOfRange || easyTwice)) {
    return { weight: weight + INCREMENT_KG[e.equipment[0] ?? 'other'], progressed: true };
  }
  return { weight, progressed: false };
}
