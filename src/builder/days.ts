import type { Exercise } from '../library/types';
import { GROUPS, groupCredit, type GroupId } from './groups';
import type { GroupInput, LoggedSet } from './types';

export interface TrainingDay {
  date: string;
  /** Groups trained directly (primary credit), in grid order. */
  groups: GroupId[];
  sets: number;
  exercises: { exerciseId: string; sets: LoggedSet[] }[];
}

/** Every day with logged sets, newest first, with all of that day's session rows merged. */
export function trainingDaysList(input: GroupInput): TrainingDay[] {
  const byId = new Map<string, Exercise>(input.library.map(e => [e.id, e]));
  const days = new Map<string, TrainingDay>();
  for (const s of input.history.sessions) {
    for (const x of s.exercises) {
      if (x.sets.length === 0) continue;
      const day = days.get(s.date) ?? { date: s.date, groups: [], sets: 0, exercises: [] };
      day.sets += x.sets.length;
      day.exercises.push({ exerciseId: x.exerciseId, sets: x.sets });
      const e = byId.get(x.exerciseId);
      if (e) for (const [g, c] of Object.entries(groupCredit(e)) as [GroupId, number][]) if (c >= 1 && !day.groups.includes(g)) day.groups.push(g);
      days.set(s.date, day);
    }
  }
  return [...days.values()]
    .map(d => ({ ...d, groups: GROUPS.filter(g => d.groups.includes(g)) }))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
