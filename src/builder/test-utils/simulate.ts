import type { Exercise } from '../../library/types';
import { addDays } from '../dates';
import { rankFocuses } from '../rank';
import { buildSession } from '../session';
import type { CheckIn, History, PlannedSession, SessionLog } from '../types';

/** Logs a planned session as done: every set at the top of its range, blank weights filled with 20 kg, no chip. */
export function logAsPlanned(s: PlannedSession): SessionLog {
  if (s.focus === 'desk-reset') throw new Error('desk resets are not training sessions');
  return {
    date: s.date,
    focus: s.focus,
    intervals: s.intervals,
    exercises: s.blocks.flatMap(b => b.items).map(i => {
      const reps = i.dose.format === 'reps' ? i.dose.max : 1;
      return {
        exerciseId: i.exerciseId,
        targetMin: i.dose.format === 'reps' ? i.dose.min : null,
        targetMax: i.dose.format === 'reps' ? i.dose.max : null,
        chip: null,
        sets: Array.from({ length: i.sets }, () => ({ weight: i.weight ?? 20, reps })),
      };
    }),
  };
}

/** Runs the owner's loop for `days` days: check in, take the first option, do it exactly. Rest logs nothing. */
export function simulate(lib: Exercise[], start: string, days: number, pattern: CheckIn[]): { sessions: PlannedSession[]; history: History } {
  const history: History = { sessions: [], checkIns: [], feedback: {} };
  const sessions: PlannedSession[] = [];
  for (let d = 0; d < days; d++) {
    const today = addDays(start, d);
    const checkIn = pattern[d % pattern.length];
    history.checkIns.push({ date: today, value: checkIn });
    const input = { library: lib, history, today, checkIn, place: 'gym' as const };
    const option = rankFocuses(input)[0];
    if (option.focus === 'rest') continue;
    const s = buildSession(input, option);
    sessions.push(s);
    history.sessions.push(logAsPlanned(s));
  }
  return { sessions, history };
}
