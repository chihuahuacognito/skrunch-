import type { Dose, Equipment } from '../library/types';
import type { History, LoggedExercise } from './types';

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/** Main lifts 5-12 reps, accessories 10-15 (spec 8.5), clamped to the exercise dose. Holds and durations pass through. */
export function prescribeReps(dose: Dose, kind: 'main' | 'accessory'): Dose {
  if (dose.format !== 'reps') return dose;
  const [lo, hi] = kind === 'main' ? [5, 12] : [10, 15];
  const max = clamp(dose.max, lo, hi);
  const min = Math.min(clamp(dose.min, lo, hi), max);
  return { format: 'reps', min, max };
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
