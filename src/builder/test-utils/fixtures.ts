import library from '../../library/library.json';
import type { Exercise } from '../../library/types';
import type { FocusId, History, SessionLog } from '../types';

export const lib = library as Exercise[];
export const BENCH = 'Barbell_Bench_Press_-_Medium_Grip';

export function byId(id: string): Exercise {
  const e = lib.find(x => x.id === id);
  if (!e) throw new Error(`fixture: no exercise ${id}`);
  return e;
}

export function emptyHistory(): History {
  return { sessions: [], checkIns: [], feedback: {} };
}

export function hist(sessions: SessionLog[], over: Partial<History> = {}): History {
  return { ...emptyHistory(), sessions, ...over };
}

export function logged(
  date: string,
  focus: FocusId,
  items: [exerciseId: string, sets: number][],
  opts: { intervals?: boolean; reps?: number; weight?: number | null } = {},
): SessionLog {
  const reps = opts.reps ?? 10;
  const weight = opts.weight === undefined ? 20 : opts.weight;
  return {
    date,
    focus,
    intervals: opts.intervals ?? false,
    exercises: items.map(([exerciseId, sets]) => ({
      exerciseId, targetMin: 8, targetMax: reps, chip: null,
      sets: Array.from({ length: sets }, () => ({ weight, reps })),
    })),
  };
}
