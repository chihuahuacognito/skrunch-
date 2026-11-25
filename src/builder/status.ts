import type { Exercise } from '../library/types';
import { blockState } from './block';
import { daysBetween } from './dates';
import { GROUPS, groupCredit, groupTargets, type GroupId } from './groups';
import { isZone2 } from './parts';
import type { GroupInput } from './types';
import { TRAINED_CREDIT } from './volume';

// Tunable display rules (spec 8.2, 8.3).
const JUST_MAX_DAYS = 1;
const RECOVERING_MAX_DAYS = 4;
const BEHIND_MIN_TARGET = 6;
const BEHIND_FRACTION = 0.5;
const WINDOW_DAYS = 7;
export const ZONE2_TARGET_MIN = 150;
export const INTERVAL_CAP = 2;

export type Recency = 'just' | 'recovering' | 'rested' | 'never';
export interface GroupStatus { lastWorked: string | null; daysSince: number | null; recency: Recency; sets: number; target: number; behind: boolean }

export function recencyOf(days: number | null): Recency {
  if (days === null) return 'never';
  if (days <= JUST_MAX_DAYS) return 'just';
  if (days <= RECOVERING_MAX_DAYS) return 'recovering';
  return 'rested';
}

const inWindow = (date: string, today: string) => {
  const age = daysBetween(date, today);
  return age >= 0 && age < WINDOW_DAYS;
};

/** Credit per group per date, from every logged set up to today. */
function creditByDate(input: GroupInput): Map<string, Partial<Record<GroupId, number>>> {
  const byId = new Map<string, Exercise>(input.library.map(e => [e.id, e]));
  const out = new Map<string, Partial<Record<GroupId, number>>>();
  for (const s of input.history.sessions) {
    if (daysBetween(s.date, input.today) < 0) continue;
    const day = out.get(s.date) ?? {};
    for (const x of s.exercises) {
      const e = byId.get(x.exerciseId);
      if (!e) continue;
      for (const [g, c] of Object.entries(groupCredit(e)) as [GroupId, number][]) day[g] = (day[g] ?? 0) + c * x.sets.length;
    }
    out.set(s.date, day);
  }
  return out;
}

/** Recency, rolling-week sets against this week's target, and BEHIND, for every group. */
export function groupStatus(input: GroupInput): Record<GroupId, GroupStatus> {
  const { week, deload } = blockState(input.history, input.today);
  const targets = groupTargets(week, deload);
  const days = creditByDate(input);
  const out = {} as Record<GroupId, GroupStatus>;
  for (const g of GROUPS) {
    let lastWorked: string | null = null;
    let sets = 0;
    for (const [date, credit] of days) {
      const c = credit[g] ?? 0;
      if (c >= TRAINED_CREDIT && (lastWorked === null || date > lastWorked)) lastWorked = date;
      if (inWindow(date, input.today)) sets += c;
    }
    const daysSince = lastWorked === null ? null : daysBetween(lastWorked, input.today);
    const target = targets[g];
    const behind = g !== 'calves' && target >= BEHIND_MIN_TARGET && sets < target * BEHIND_FRACTION;
    out[g] = { lastWorked, daysSince, recency: recencyOf(daysSince), sets, target, behind };
  }
  return out;
}

/** Zone 2 minutes and interval days in the rolling week. */
export function cardioWeek(input: GroupInput): { zone2Minutes: number; zone2Target: number; intervalDays: number; intervalCap: number } {
  const byId = new Map<string, Exercise>(input.library.map(e => [e.id, e]));
  let seconds = 0;
  const intervalDates = new Set<string>();
  for (const s of input.history.sessions) {
    if (!inWindow(s.date, input.today)) continue;
    if (s.intervals) intervalDates.add(s.date);
    for (const x of s.exercises) {
      const e = byId.get(x.exerciseId);
      if (e && isZone2(e)) for (const set of x.sets) seconds += set.seconds ?? 0;
    }
  }
  return { zone2Minutes: Math.round(seconds / 60), zone2Target: ZONE2_TARGET_MIN, intervalDays: intervalDates.size, intervalCap: INTERVAL_CAP };
}

/** Tonight's logged sets and the groups they trained directly (primary credit), in grid order. */
export function tonightSummary(input: GroupInput): { groups: GroupId[]; sets: number } {
  const byId = new Map<string, Exercise>(input.library.map(e => [e.id, e]));
  const touched = new Set<GroupId>();
  let sets = 0;
  for (const s of input.history.sessions) {
    if (s.date !== input.today) continue;
    for (const x of s.exercises) {
      sets += x.sets.length;
      const e = byId.get(x.exerciseId);
      if (!e || x.sets.length === 0) continue;
      for (const [g, c] of Object.entries(groupCredit(e)) as [GroupId, number][]) if (c >= 1) touched.add(g);
    }
  }
  return { groups: GROUPS.filter(g => touched.has(g)), sets };
}
