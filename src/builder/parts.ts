import type { BudgetMuscle, Exercise, TagMuscle } from '../library/types';
import { hash01 } from './select';
import type { Block, Place, PlannedExercise } from './types';

/** What the warm-up, finisher and cool-down pickers need. Purpose-tagged items are allowed in all three. */
export interface PartContext { lib: Exercise[]; today: string; place: Place; used: Set<string> }

export const BUDGET_TO_REGION: Record<BudgetMuscle, TagMuscle> = {
  chest: 'chest', lats: 'lats', midBack: 'middle back', quads: 'quadriceps', hamstrings: 'hamstrings', glutes: 'glutes',
  sideDelts: 'shoulders', rearDelts: 'shoulders', frontDelts: 'shoulders', biceps: 'biceps', triceps: 'triceps',
  core: 'abdominals', calves: 'calves',
};

const WARMUP_MACHINE_MINUTES = 3;
const FINISHER_MINUTES = 8;
const STRETCH_SECONDS_TOTAL = 60;
const SHORT_REST = 15;
const INTERVAL_REST = 45;

/** Zone 2 = steady conditioning done for 10+ minutes; everything else in conditioning is interval work. */
export const isZone2 = (e: Exercise) => e.type === 'conditioning' && e.dose.format === 'duration' && e.dose.minutes >= 10;
export const isInterval = (e: Exercise) => e.type === 'conditioning' && !isZone2(e);

/** Fits the place: at home, no-equipment items only. */
export function fitsPlace(e: Exercise, place: Place): boolean {
  return e.location.includes(place) && (place === 'gym' || e.equipment.length === 0);
}

export function plain(e: Exercise, sets: number, restSeconds: number, dose = e.dose): PlannedExercise {
  return { exerciseId: e.id, sets, dose, rir: null, restSeconds, weight: null, progressed: false };
}

/** Pool items ordered by hash for the day, unused and fitting the place. */
export function byDay(ctx: PartContext, key: string, pred: (e: Exercise) => boolean): Exercise[] {
  return ctx.lib
    .filter(e => pred(e) && fitsPlace(e, ctx.place) && !ctx.used.has(e.id))
    .map(e => ({ e, h: hash01(ctx.today + key + e.id) }))
    .sort((a, b) => a.h - b.h)
    .map(x => x.e);
}

/** Up to `n` items: regions not yet covered count double, any of tonight's regions count once, then the day's hash order. */
export function coverRegions(ctx: PartContext, key: string, pred: (e: Exercise) => boolean, regions: TagMuscle[], n: number): Exercise[] {
  const out: Exercise[] = [];
  const pool = byDay(ctx, key, pred);
  const left = new Set(regions);
  while (out.length < n && pool.length > 0) {
    let best = 0;
    let bestHits = -1;
    pool.forEach((e, i) => {
      const hits = 2 * e.muscles.filter(m => left.has(m)).length + e.muscles.filter(m => regions.includes(m)).length;
      if (hits > bestHits) { best = i; bestHits = hits; }
    });
    const [pick] = pool.splice(best, 1);
    pick.muscles.forEach(m => left.delete(m));
    out.push(pick);
    ctx.used.add(pick.id);
  }
  return out;
}

export function warmup(ctx: PartContext, regions: TagMuscle[], mobilityCount = 3): Block {
  const items: PlannedExercise[] = [];
  const machine = byDay(ctx, 'warmup-machine', e => isZone2(e) && e.impact === 'low')[0];
  if (machine) {
    ctx.used.add(machine.id);
    items.push(plain(machine, 1, 0, { format: 'duration', minutes: WARMUP_MACHINE_MINUTES }));
  }
  for (const e of coverRegions(ctx, 'warmup', x => x.type === 'mobility', regions, mobilityCount)) items.push(plain(e, 1, SHORT_REST));
  return { kind: 'warmup', items };
}

function stretchItem(e: Exercise): PlannedExercise {
  const sets = e.dose.format === 'hold' ? Math.ceil(STRETCH_SECONDS_TOTAL / e.dose.seconds) : 1;
  return plain(e, sets, SHORT_REST);
}

/** Always a lower back stretch and a hip flexor stretch first, then stretches for tonight's regions. */
export function cooldown(ctx: PartContext, regions: TagMuscle[], count = 4): Block {
  const isStretch = (e: Exercise) => e.type === 'stretch';
  const picks: Exercise[] = [];
  for (const must of ['lower back', 'hip flexors'] as const) {
    const e = byDay(ctx, `cooldown-${must}`, x => isStretch(x) && x.muscles.includes(must))[0];
    if (e) { ctx.used.add(e.id); picks.push(e); }
  }
  picks.push(...coverRegions(ctx, 'cooldown', isStretch, regions, count - picks.length));
  return { kind: 'cooldown', items: picks.map(stretchItem) };
}

/** An interval piece when allowed, otherwise 8 minutes of Zone 2. */
export function finisher(ctx: PartContext, intervals: boolean): Block {
  if (intervals) {
    const e = byDay(ctx, 'finisher-intervals', isInterval)[0];
    if (e) {
      ctx.used.add(e.id);
      const sets = e.dose.format === 'duration' ? Math.max(1, Math.round(FINISHER_MINUTES / e.dose.minutes)) : 4;
      return { kind: 'finisher', items: [plain(e, sets, INTERVAL_REST)] };
    }
  }
  const z = byDay(ctx, 'finisher-zone2', isZone2)[0];
  if (!z) return { kind: 'finisher', items: [] };
  ctx.used.add(z.id);
  return { kind: 'finisher', items: [plain(z, 1, 0, { format: 'duration', minutes: FINISHER_MINUTES })] };
}
