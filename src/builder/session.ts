import type { BudgetMuscle, Exercise, TagMuscle } from '../library/types';
import { BUDGET_MUSCLES } from '../library/vocab';
import { blockState } from './block';
import { BUDGET } from './budget';
import { estimateMinutes } from './estimate';
import { FOCUS_SPECS, isLifting, MUSCLE_GROUP, type LiftingFocus } from './focus';
import { BUDGET_TO_REGION, cooldown, finisher, isInterval, type PartContext, warmup } from './parts';
import { nextLoad, prescribeReps, rirFor } from './prescribe';
import { deficits, intervalsAllowed, targetsFor } from './rank';
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
  constructor(private done: Record<BudgetMuscle, number>, private targets: Record<BudgetMuscle, number>, private recovering: Set<BudgetMuscle>) {}

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

  /** Under-budget fraction after tonight's work so far. */
  deficit(m: BudgetMuscle): number {
    const t = this.targets[m];
    return t > 0 ? Math.max(0, (t - this.done[m] - this.credit[m]) / t) : 0;
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
  );
  const used = new Set<string>();
  const ctx = (sets: number): SelectContext => ({
    lib: input.library, history: input.history, today: input.today, focus, place: input.place,
    used, blocked: tally.blocked(sets), deficit: deficits(input),
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

  // Supersets: each pair takes the most under-budget muscle tonight, then the best partner from a different group.
  const supersets: Block[] = [];
  const pairs = shape.pairs + (spec.mainSlots.length - main.length);
  const pickFor = (m: BudgetMuscle, key: string) =>
    rankCandidates(ctx(shape.supersetSets), { kind: 'superset', muscle: m, key })[0];
  for (let p = 0; p < pairs; p++) {
    const order = spec.pool
      .filter(m => targets[m] > 0)
      .map((m, i) => ({ m, i, d: tally.deficit(m) }))
      .sort((a, b) => b.d - a.d || a.i - b.i)
      .map(x => x.m);
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
    const fin = finisher(parts, option.dose === 'full' && intervalsAllowed(input, focus));
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

/** Build tonight's session for the chosen focus option. */
export function buildSession(input: BuilderInput, option: FocusOption): PlannedSession {
  if (isLifting(option.focus)) return buildLifting(input, option, option.focus);
  throw new Error(`buildSession: focus "${option.focus}" is not supported yet`);
}
