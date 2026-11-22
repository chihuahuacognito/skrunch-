import type { BudgetMuscle } from '../library/types';
import { blockState } from './block';
import { daysBetween } from './dates';
import { FOCUS_SPECS, LIFTING_FOCUSES, type LiftingFocus, PATTERN_MUSCLES } from './focus';
import { pickMainLifts } from './main';
import { needs, targetsFor } from './needs';
import { Tally } from './tally';
import type { BuilderInput, FocusId, FocusOption, SessionDose } from './types';

// Tunable defaults: the spec expects these to change with use.
const FULL_BODY_FACTOR = 0.9;
const CONDITIONING_WEIGHT = 0.45;
const CONDITIONING_RAMP_DAYS = 7;
const MAX_INTERVALS_PER_WEEK = 2;
const REST_AFTER_DAYS = 6;
const REPEAT_DAYS = 4;
const REPEAT_FACTOR = 0.5;
const SLOT_WEIGHT = 0.5;

/** Good check-in, fewer than 2 interval sessions in the rolling week, and never on a Lower day. */
export function intervalsAllowed(input: BuilderInput, focus: FocusId): boolean {
  if (input.checkIn !== 'good' || focus === 'lower') return false;
  const recent = input.history.sessions.filter(s => {
    const age = daysBetween(s.date, input.today);
    return s.intervals && age >= 0 && age <= 6;
  });
  return recent.length < MAX_INTERVALS_PER_WEEK;
}

/**
 * Intervals never go the day before a Lower session. A finisher is optional, so a lifting day only gets interval
 * work when Lower is impossible tomorrow anyway (a Lower session today or yesterday keeps legs recovering).
 * Conditioning days keep their intervals: that is their point.
 */
export function intervalFinisherAllowed(input: BuilderInput, focus: FocusId): boolean {
  const lowerRecently = input.history.sessions.some(s => {
    const age = daysBetween(s.date, input.today);
    return s.focus === 'lower' && age >= 0 && age <= 1;
  });
  return lowerRecently && intervalsAllowed(input, focus);
}

function eligible(input: BuilderInput, focus: LiftingFocus, mainSets: number): boolean {
  // Intervals never go the day before a Lower session; the app cannot see tomorrow, so Lower waits a day instead.
  const intervalsYesterday = input.history.sessions.some(s => s.intervals && daysBetween(s.date, input.today) === 1);
  if (focus === 'lower' && intervalsYesterday) return false;
  return pickMainLifts(input, focus, mainSets).length === FOCUS_SPECS[focus].mainSlots.length;
}

function liftingScore(
  focus: LiftingFocus, def: Record<BudgetMuscle, number>, blocked: Set<BudgetMuscle>, targets: Record<BudgetMuscle, number>,
): number {
  const muscles = FOCUS_SPECS[focus].pool.filter(m => targets[m] > 0 && !blocked.has(m));
  if (muscles.length === 0) return 0;
  // Weighted by each muscle's target, so the bigger budgets (chest 12-16) pull harder than small ones.
  const weight = muscles.reduce((a, m) => a + targets[m], 0);
  const poolNeed = muscles.reduce((a, m) => a + def[m] * targets[m], 0) / weight;
  // A big pool dilutes one urgent muscle, so each main slot also counts its neediest own muscle.
  const slotNeed = FOCUS_SPECS[focus].mainSlots
    .map(patterns => Math.max(0, ...patterns.flatMap(p => PATTERN_MUSCLES[p] ?? []).filter(m => !blocked.has(m)).map(m => def[m])))
    .reduce((a, b) => a + b, 0) / FOCUS_SPECS[focus].mainSlots.length;
  const mean = SLOT_WEIGHT * slotNeed + (1 - SLOT_WEIGHT) * poolNeed;
  return focus === 'full-body' ? mean * FULL_BODY_FACTOR : mean;
}

/** The same focus again within 3 days scores half, so the week does not repeat itself. */
function repeatFactor(input: BuilderInput, focus: FocusId): number {
  const recent = input.history.sessions.some(s => {
    const age = daysBetween(s.date, input.today);
    return s.focus === focus && age >= 0 && age < REPEAT_DAYS;
  });
  return recent ? REPEAT_FACTOR : 1;
}

function conditioningScore(input: BuilderInput): number {
  const ages = input.history.sessions
    .filter(s => s.focus === 'conditioning')
    .map(s => daysBetween(s.date, input.today))
    .filter(a => a >= 0);
  const since = ages.length ? Math.min(...ages) : CONDITIONING_RAMP_DAYS;
  return CONDITIONING_WEIGHT * Math.min(1, since / CONDITIONING_RAMP_DAYS);
}

/** Trained (anything but mobility) on each of the 6 days before today. */
function needsRest(input: BuilderInput): boolean {
  const days = new Set(input.history.sessions
    .filter(s => s.focus !== 'mobility' && s.focus !== 'rest')
    .map(s => daysBetween(s.date, input.today)));
  for (let d = 1; d <= REST_AFTER_DAYS; d++) if (!days.has(d)) return false;
  return true;
}

/** The 3-4 focus options for tonight, best first. Mobility is always offered. */
export function rankFocuses(input: BuilderInput): FocusOption[] {
  const mobility: FocusOption = { focus: 'mobility', dose: 'full' };
  if (input.place === 'home') return [mobility];

  const { deload } = blockState(input.history, input.today);
  const mainSets = deload || input.checkIn === 'wrecked' ? 2 : 3;
  const blocked = Tally.for(input).blocked(mainSets);
  const def = needs(input);
  const targets = targetsFor(input);

  // Stable sorts: ties keep LIFTING_FOCUSES order, conditioning after.
  const lifting = LIFTING_FOCUSES
    .filter(f => eligible(input, f, mainSets))
    .map(f => ({ focus: f as FocusId, score: liftingScore(f, def, blocked, targets) * repeatFactor(input, f) }));

  if (input.checkIn === 'wrecked') {
    const out: FocusOption[] = [{ focus: 'rest', dose: 'full' }, mobility];
    const best = [...lifting].sort((a, b) => b.score - a.score)[0];
    if (best) out.push({ focus: best.focus, dose: 'minimum' });
    return out;
  }

  const dose: SessionDose = input.checkIn === 'ok' ? 'reduced' : 'full';
  const ranked = [...lifting, { focus: 'conditioning' as FocusId, score: conditioningScore(input) }]
    .sort((a, b) => b.score - a.score)
    .map((x): FocusOption => ({ focus: x.focus, dose }));

  if (needsRest(input)) return [{ focus: 'rest', dose: 'full' }, ...ranked.slice(0, 2), mobility];
  return [...ranked.slice(0, 3), mobility];
}
