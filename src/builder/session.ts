import type { BudgetMuscle, Exercise, TagMuscle } from '../library/types';
import { BUDGET_MUSCLES } from '../library/vocab';
import { blockState } from './block';
import { BUDGET } from './budget';
import { estimateMinutes } from './estimate';
import { FOCUS_SPECS, isLifting, MUSCLE_GROUP, type LiftingFocus } from './focus';
import {
  BUDGET_TO_REGION, byDay, cooldown, coverRegions, finisher, isInterval, isZone2, type PartContext, plain, warmup,
} from './parts';
import { nextLoad, prescribeReps, rirFor } from './prescribe';
import { intervalFinisherAllowed, intervalsAllowed, needs, targetsFor } from './rank';
import { unrecovered } from './recovery';
import { rankCandidates, type SelectContext } from './select';
import type { Block, BuilderInput, FocusOption, PlannedExercise, PlannedSession } from './types';
import { setCredit, weeklyVolume, zeroVolume } from './volume';

const MAX_DIRECT_SETS_PER_SESSION = 8;
const MAIN_REST = 150;
const SUPERSET_REST = 75;

interface Shape { mainSets: number; pairs: number; supersetSets: number; finisher: boolean }

function shapeFor(option: FocusOption, deload: boolean): Shape {
  if (deload || option.dose === 'minimum') return { mainSets: 2, pairs: 1, supersetSets: 2, finisher: false };
  if (option.dose === 'reduced') return { mainSets: 3, pairs: 2, supersetSets: 2, finisher: true };
  return { mainSets: 3, pairs: 2, supersetSets: 3, finisher: true };
}

/** Tracks tonight's work so caps (8 direct sets a session, the weekly ceiling) and deficits stay current. */
class Tally {
  direct = zeroVolume();
  credit = zeroVolume();
  constructor(
    private done: Record<BudgetMuscle, number>,
    private targets: Record<BudgetMuscle, number>,
    private recovering: Set<BudgetMuscle>,
    private need: Record<BudgetMuscle, number>,
  ) {}

  add(e: Exercise, sets: number) {
    for (const m of e.primary) this.direct[m] += sets;
    for (const [m, c] of Object.entries(setCredit(e)) as [BudgetMuscle, number][]) this.credit[m] += c * sets;
  }

  /** Muscles that cannot take `sets` more primary sets tonight. */
  blocked(sets: number): Set<BudgetMuscle> {
    const out = new Set(this.recovering);
    for (const m of BUDGET_MUSCLES) {
      if (this.direct[m] + sets > MAX_DIRECT_SETS_PER_SESSION) out.add(m);
      if (this.done[m] + this.credit[m] + sets > BUDGET[m][1]) out.add(m);
    }
    return out;
  }

  /** Tonight's need (budget deficit or twice-a-week frequency) less the work already planned tonight. */
  deficit(m: BudgetMuscle): number {
    const t = this.targets[m];
    return t > 0 ? Math.max(0, this.need[m] - this.credit[m] / t) : 0;
  }
}

function buildLifting(input: BuilderInput, option: FocusOption, focus: LiftingFocus): PlannedSession {
  const { deload, calibration } = blockState(input.history, input.today);
  const shape = shapeFor(option, deload);
  const rir = rirFor(option.dose, calibration, deload);
  const allowProgression = option.dose === 'full' && input.checkIn === 'good' && !deload;
  const targets = targetsFor(input);
  const tally = new Tally(
    weeklyVolume(input.library, input.history.sessions, input.today),
    targets,
    unrecovered(input.library, input.history.sessions, input.today),
    needs(input),
  );
  const used = new Set<string>();
  const ctx = (sets: number): SelectContext => ({
    lib: input.library, history: input.history, today: input.today, focus, place: input.place,
    used, blocked: tally.blocked(sets), deficit: needs(input),
  });
  const plan = (e: Exercise, sets: number, kind: 'main' | 'superset', restSeconds: number): PlannedExercise => {
    used.add(e.id);
    tally.add(e, sets);
    const load = nextLoad(e, input.history, allowProgression);
    return { exerciseId: e.id, sets, dose: prescribeReps(e.dose, kind), rir, restSeconds, weight: load.weight, progressed: load.progressed };
  };

  const spec = FOCUS_SPECS[focus];
  const main: PlannedExercise[] = [];
  spec.mainSlots.forEach((patterns, i) => {
    const e = rankCandidates(ctx(shape.mainSets), { kind: 'main', patterns, key: `main${i}` })[0];
    if (e) main.push(plan(e, shape.mainSets, 'main', MAIN_REST));
  });

  // Supersets: each pair takes the pool muscle that needs it most tonight, then the best partner from a different
  // group. Only muscles still under target qualify: nothing left to do means fewer pairs, not filler volume.
  const supersets: Block[] = [];
  const pairs = shape.pairs + (spec.mainSlots.length - main.length);
  const pickFor = (m: BudgetMuscle, key: string) =>
    rankCandidates(ctx(shape.supersetSets), { kind: 'superset', muscle: m, key })[0];
  const ranked = (muscles: readonly BudgetMuscle[]) => muscles
    .map((m, i) => ({ m, i, d: tally.deficit(m) }))
    .filter(x => x.d > 0)
    .sort((a, b) => b.d - a.d || a.i - b.i)
    .map(x => x.m);
  for (let p = 0; p < pairs; p++) {
    const order = ranked(spec.pool);
    let first: Exercise | undefined;
    let firstMuscle: BudgetMuscle | undefined;
    for (const m of order) {
      first = pickFor(m, `ss${p}a`);
      if (first) { firstMuscle = m; break; }
    }
    if (!first || !firstMuscle) break;
    const a = plan(first, shape.supersetSets, 'superset', 0);
    let b: PlannedExercise | undefined;
    for (const m of order) {
      if (MUSCLE_GROUP[m] === MUSCLE_GROUP[firstMuscle]) continue;
      const e = pickFor(m, `ss${p}b`);
      if (e) { b = plan(e, shape.supersetSets, 'superset', SUPERSET_REST); break; }
    }
    supersets.push({ kind: 'superset', items: b ? [a, b] : [{ ...a, restSeconds: SUPERSET_REST }] });
  }

  const parts: PartContext = { lib: input.library, today: input.today, place: input.place, used };
  const mainRegions = regionsOf(input.library, main);
  const extra: TagMuscle = focus === 'lower' || focus === 'full-body' ? 'hip flexors' : 'thoracic spine';
  const blocks: Block[] = [warmup(parts, [...mainRegions, extra])];
  if (main.length) blocks.push({ kind: 'main', items: main });
  blocks.push(...supersets);
  let intervals = false;
  if (shape.finisher) {
    const fin = finisher(parts, option.dose === 'full' && intervalFinisherAllowed(input, focus));
    intervals = fin.items.some(i => isInterval(byIdIn(input.library, i.exerciseId)));
    if (fin.items.length) blocks.push(fin);
  }
  blocks.push(cooldown(parts, regionsOf(input.library, [...main, ...supersets.flatMap(s => s.items)])));

  return {
    focus, dose: option.dose, date: input.today, place: input.place, deload, calibration, intervals,
    blocks, estimatedMinutes: estimateMinutes(blocks),
  };
}

function byIdIn(lib: Exercise[], id: string): Exercise {
  const e = lib.find(x => x.id === id);
  if (!e) throw new Error(`unknown exercise ${id}`);
  return e;
}

function regionsOf(lib: Exercise[], items: PlannedExercise[]): TagMuscle[] {
  return [...new Set(items.flatMap(i => byIdIn(lib, i.exerciseId).primary.map(m => BUDGET_TO_REGION[m])))];
}

const INTERVAL_PIECE_MINUTES = 10;
const INTERVAL_REST = 45;
const ZONE2_MINUTES: Record<FocusOption['dose'], number> = { full: 30, reduced: 20, minimum: 20 };
const MOBILITY_ZONE2_MINUTES = 20;
const CORE_REST = 60;
const STABILITY_REST = 30;
const CONDITIONING_REGIONS: TagMuscle[] = ['hip flexors', 'thoracic spine', 'hamstrings', 'abdominals'];
const MOBILITY_REGIONS: TagMuscle[] = ['hip flexors', 'thoracic spine', 'lower back', 'hamstrings', 'glutes', 'shoulders'];

function session(input: BuilderInput, option: FocusOption, blocks: Block[], intervals: boolean): PlannedSession {
  const { deload, calibration } = blockState(input.history, input.today);
  const kept = blocks.filter(b => b.items.length > 0);
  return {
    focus: option.focus, dose: option.dose, date: input.today, place: input.place, deload, calibration, intervals,
    blocks: kept, estimatedMinutes: estimateMinutes(kept),
  };
}

function stabilityBlock(parts: PartContext, n: number): Block {
  const items = byDay(parts, 'stability', e => e.type === 'stability').slice(0, n);
  items.forEach(e => parts.used.add(e.id));
  return { kind: 'stability', items: items.map(e => plain(e, 2, STABILITY_REST)) };
}

/** Intervals (two pieces of about 10 minutes) or a Zone 2 block, then loaded core work and one stability drill. */
function buildConditioning(input: BuilderInput, option: FocusOption): PlannedSession {
  const { deload, calibration } = blockState(input.history, input.today);
  const used = new Set<string>();
  const parts: PartContext = { lib: input.library, today: input.today, place: input.place, used };
  const blocks: Block[] = [warmup(parts, CONDITIONING_REGIONS)];

  const intervals = option.dose === 'full' && intervalsAllowed(input, 'conditioning');
  if (intervals) {
    const picks = byDay(parts, 'intervals', isInterval).slice(0, 2);
    picks.forEach(e => used.add(e.id));
    const setsOf = (e: Exercise) => (e.dose.format === 'duration' ? Math.max(1, Math.round(INTERVAL_PIECE_MINUTES / e.dose.minutes)) : 5);
    blocks.push({ kind: 'intervals', items: picks.map(e => plain(e, setsOf(e), INTERVAL_REST)) });
  } else {
    const z = byDay(parts, 'zone2', isZone2)[0];
    if (z) {
      used.add(z.id);
      blocks.push({ kind: 'zone2', items: [plain(z, 1, 0, { format: 'duration', minutes: ZONE2_MINUTES[option.dose] })] });
    }
  }

  // Loaded core work is strength: it counts toward the core budget and respects recovery and the weekly ceiling.
  const tally = new Tally(
    weeklyVolume(input.library, input.history.sessions, input.today),
    targetsFor(input),
    unrecovered(input.library, input.history.sessions, input.today),
    needs(input),
  );
  const sets = option.dose === 'full' && !deload ? 3 : 2;
  const rir = rirFor(option.dose, calibration, deload);
  const allowProgression = option.dose === 'full' && input.checkIn === 'good' && !deload;
  const core: PlannedExercise[] = [];
  for (let i = 0; i < 2; i++) {
    const ctx: SelectContext = {
      lib: input.library, history: input.history, today: input.today, focus: 'conditioning', place: input.place,
      used, blocked: tally.blocked(sets), deficit: needs(input),
    };
    const e = rankCandidates(ctx, { kind: 'superset', muscle: 'core', key: `core${i}` })[0];
    if (!e) break;
    used.add(e.id);
    tally.add(e, sets);
    const load = nextLoad(e, input.history, allowProgression);
    core.push({
      exerciseId: e.id, sets, dose: prescribeReps(e.dose, 'superset'), rir, restSeconds: CORE_REST,
      weight: load.weight, progressed: load.progressed,
    });
  }
  blocks.push({ kind: 'core', items: core }, stabilityBlock(parts, 1), cooldown(parts, CONDITIONING_REGIONS));
  return session(input, option, blocks, intervals);
}

/** Gym: Zone 2 (a walk when wrecked), a mobility flow, stability, stretches. Home: flow and stretches, no equipment. */
function buildMobility(input: BuilderInput, option: FocusOption): PlannedSession {
  const parts: PartContext = { lib: input.library, today: input.today, place: input.place, used: new Set() };
  const flow = (n: number): Block => ({
    kind: 'mobility',
    items: coverRegions(parts, 'flow', e => e.type === 'mobility', MOBILITY_REGIONS, n).map(e => plain(e, 1, 15)),
  });
  if (input.place === 'home') return session(input, option, [flow(8), cooldown(parts, MOBILITY_REGIONS, 6)], false);

  const isWalk = (e: Exercise) => isZone2(e) && e.name.toLowerCase().includes('walk');
  const z = (input.checkIn === 'wrecked' ? byDay(parts, 'zone2', isWalk)[0] : undefined) ?? byDay(parts, 'zone2', isZone2)[0];
  const blocks: Block[] = [];
  if (z) {
    parts.used.add(z.id);
    blocks.push({ kind: 'zone2', items: [plain(z, 1, 0, { format: 'duration', minutes: MOBILITY_ZONE2_MINUTES })] });
  }
  blocks.push(flow(6), stabilityBlock(parts, 2), cooldown(parts, MOBILITY_REGIONS, 5));
  return session(input, option, blocks, false);
}

/** Build tonight's session for the chosen focus option. Rest is an empty session. */
export function buildSession(input: BuilderInput, option: FocusOption): PlannedSession {
  if (isLifting(option.focus)) return buildLifting(input, option, option.focus);
  if (option.focus === 'conditioning') return buildConditioning(input, option);
  if (option.focus === 'mobility') return buildMobility(input, option);
  return session(input, option, [], false);
}
