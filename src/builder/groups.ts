import type { BudgetMuscle, Exercise } from '../library/types';

export type GroupId = 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'glutes' | 'quads' | 'hamstrings' | 'calves';

/** Grid order: three rows of three, as in the Home design. */
export const GROUPS: readonly GroupId[] = ['chest', 'back', 'shoulders', 'arms', 'core', 'glutes', 'quads', 'hamstrings', 'calves'];

export const GROUP_LABEL: Record<GroupId, string> = {
  chest: 'Chest', back: 'Back', shoulders: 'Shoulders', arms: 'Arms', core: 'Core',
  glutes: 'Glutes', quads: 'Quads', hamstrings: 'Hamstrings', calves: 'Calves',
};

export const GROUP_MUSCLES: Record<GroupId, BudgetMuscle[]> = {
  chest: ['chest'], back: ['lats', 'midBack'], shoulders: ['sideDelts', 'rearDelts', 'frontDelts'], arms: ['biceps', 'triceps'],
  core: ['core'], glutes: ['glutes'], quads: ['quads'], hamstrings: ['hamstrings'], calves: ['calves'],
};

// Tunable: weekly hard sets per group [low, high]. One row set counts once for Back, so these are set per group,
// not the sum of the per-muscle budget.
const GROUP_BUDGET: Record<Exclude<GroupId, 'calves'>, readonly [number, number]> = {
  chest: [12, 16], back: [12, 16], shoulders: [10, 14], arms: [10, 14], core: [6, 10], glutes: [6, 10], quads: [8, 12], hamstrings: [6, 10],
};
// Tunable: calves are low priority; a fixed target keeps the grid from reading "0/0" in week 1.
const CALVES_TARGET = 6;
const CALVES_DELOAD_TARGET = 3;

const groupOf = (m: BudgetMuscle): GroupId => GROUPS.find(g => GROUP_MUSCLES[g].includes(m))!;

/**
 * Group credit for one set: 1 if any primary muscle is in the group, else 0.5 if any secondary is. Strength only.
 * Front delts count only as direct work, as in the per-muscle budget.
 */
export function groupCredit(e: Exercise): Partial<Record<GroupId, number>> {
  const out: Partial<Record<GroupId, number>> = {};
  if (e.type !== 'strength') return out;
  for (const m of e.secondary) if (m !== 'frontDelts') out[groupOf(m)] = 0.5;
  for (const m of e.primary) out[groupOf(m)] = 1;
  return out;
}

/** Week 1 starts at the low end and adds a set a week up to the high end; a deload is about half the low end. */
export function groupTargets(week: number, deload: boolean): Record<GroupId, number> {
  const out = {} as Record<GroupId, number>;
  for (const [g, [low, high]] of Object.entries(GROUP_BUDGET) as [Exclude<GroupId, 'calves'>, readonly [number, number]][]) {
    out[g] = deload ? Math.round(low / 2) : Math.min(low + week - 1, high);
  }
  out.calves = deload ? CALVES_DELOAD_TARGET : CALVES_TARGET;
  return out;
}
