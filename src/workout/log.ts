import type { LoggedExercise, SessionLog } from '../builder';
import type { WorkoutState } from './types';

/** The done part of a workout as the builder's SessionLog; null when nothing was done. */
export function toSessionLog(state: WorkoutState): SessionLog | null {
  const { session } = state;
  if (session.focus === 'desk-reset' || session.focus === 'rest') return null;
  const exercises: LoggedExercise[] = [];
  let intervalDone = false;
  session.blocks.forEach((b, bi) => b.items.forEach((item, i) => {
    const log = state.logs[bi][i];
    const done = log.sets.filter(x => x.done);
    if (done.length === 0) return;
    if (b.kind === 'intervals' || b.kind === 'finisher') intervalDone = true;
    const range = item.dose.format === 'reps' ? item.dose : null;
    exercises.push({
      exerciseId: item.exerciseId,
      targetMin: range ? range.min : null,
      targetMax: range ? range.max : null,
      chip: log.chip,
      sets: done.map(({ weight, reps, seconds }) => ({ weight, reps, seconds })),
    });
  }));
  if (exercises.length === 0) return null;
  return { date: session.date, focus: session.focus, intervals: session.intervals && intervalDone, exercises };
}

export function summaryOf(state: WorkoutState, now: number): { minutes: number; sets: number; exercises: number } {
  const all = state.logs.flat();
  return {
    minutes: Math.round((now - state.startedAt) / 60_000),
    sets: all.reduce((n, l) => n + l.sets.filter(x => x.done).length, 0),
    exercises: all.filter(l => l.sets.some(x => x.done)).length,
  };
}
