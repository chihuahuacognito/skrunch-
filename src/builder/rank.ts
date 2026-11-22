import type { BudgetMuscle, Exercise, Pattern } from '../library/types';
import { BUDGET_MUSCLES } from '../library/vocab';
import { blockState } from './block';
import { BUDGET, weeklyTargets } from './budget';
import { daysBetween } from './dates';
import { FOCUS_SPECS, LIFTING_FOCUSES, type LiftingFocus } from './focus';
import { unrecovered } from './recovery';
import { isMainLift } from './select';
import type { BuilderInput, FocusId, FocusOption, SessionDose } from './types';
import { trainingDays, weeklyVolume } from './volume';

// Tunable defaults: the spec expects these to change with use.
const FULL_BODY_FACTOR = 0.9;
const CONDITIONING_WEIGHT = 0.45;
const CONDITIONING_RAMP_DAYS = 7;
const MAX_INTERVALS_PER_WEEK = 2;
const REST_AFTER_DAYS = 6;
const FREQ_NEED_NONE = 1;
const FREQ_NEED_ONCE = 0.35;
const FREQ_MIN_SETS = 3;
const REPEAT_DAYS = 4;
const REPEAT_FACTOR = 0.5;

/** This week's target per muscle, from the block position. */
export function targetsFor(input: BuilderInput): Record<BudgetMuscle, number> {
  const { week, deload } = blockState(input.history, input.today);
  return weeklyTargets(week, deload);
}

/** How far under this week's target each muscle is, as a 0..1 fraction (0 when the target is 0). */
export function deficits(input: BuilderInput): Record<BudgetMuscle, number> {
  const targets = targetsFor(input);
  const done = weeklyVolume(input.library, input.history.sessions, input.today);
  const out = {} as Record<BudgetMuscle, number>;
  for (const m of BUDGET_MUSCLES) {
    const t = targets[m];
    out[m] = t > 0 ? Math.min(1, Math.max(0, (t - done[m]) / t)) : 0;
  }
  return out;
}

/**
 * What each muscle needs tonight: its budget deficit, raised when it has been trained on fewer than
 * 2 days this week (the spec's twice-a-week rule), so frequency counts as well as volume.
 */
export function needs(input: BuilderInput): Record<BudgetMuscle, number> {
  const def = deficits(input);
  const days = trainingDays(input.library, input.history.sessions, input.today);
  const done = weeklyVolume(input.library, input.history.sessions, input.today);
  const targets = targetsFor(input);
  const out = {} as Record<BudgetMuscle, number>;
  for (const m of BUDGET_MUSCLES) {
    // Frequency only matters while the week still has room for a real exposure under the ceiling.
    const room = done[m] + FREQ_MIN_SETS <= BUDGET[m][1];
    const freq = targets[m] === 0 || !room ? 0 : days[m] === 0 ? FREQ_NEED_NONE : days[m] === 1 ? FREQ_NEED_ONCE : 0;
    out[m] = Math.max(def[m], freq);
  }
  return out;
}

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
 * Muscles that cannot be a main lift's primary tonight: still recovering, or `sets` more would pass the weekly
 * ceiling. The session builder applies the same rule, so a focus on the menu can always fill its main lifts.
 */
export function mainBlocked(input: BuilderInput, sets: number): Set<BudgetMuscle> {
  const out = unrecovered(input.library, input.history.sessions, input.today);
  const done = weeklyVolume(input.library, input.history.sessions, input.today);
  for (const m of BUDGET_MUSCLES) if (done[m] + sets > BUDGET[m][1]) out.add(m);
  return out;
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

function hasMainCandidate(input: BuilderInput, patterns: Pattern[], blocked: Set<BudgetMuscle>): boolean {
  return input.library.some((e: Exercise) =>
    e.type === 'strength' && e.purposes.length === 0 && e.location.includes('gym') && isMainLift(e, patterns)
    && input.history.feedback[e.id] !== 'never' && e.primary.every(m => !blocked.has(m)));
}

function eligible(input: BuilderInput, focus: LiftingFocus, blocked: Set<BudgetMuscle>): boolean {
  // Intervals never go the day before a Lower session; the app cannot see tomorrow, so Lower waits a day instead.
  const intervalsYesterday = input.history.sessions.some(s => s.intervals && daysBetween(s.date, input.today) === 1);
  if (focus === 'lower' && intervalsYesterday) return false;
  return FOCUS_SPECS[focus].mainSlots.every(p => hasMainCandidate(input, p, blocked));
}

function liftingScore(
  focus: LiftingFocus, def: Record<BudgetMuscle, number>, blocked: Set<BudgetMuscle>, targets: Record<BudgetMuscle, number>,
): number {
  const muscles = FOCUS_SPECS[focus].pool.filter(m => targets[m] > 0 && !blocked.has(m));
  if (muscles.length === 0) return 0;
  // Weighted by each muscle's target, so the bigger budgets (chest 12-16) pull harder than small ones.
  const weight = muscles.reduce((a, m) => a + targets[m], 0);
  const mean = muscles.reduce((a, m) => a + def[m] * targets[m], 0) / weight;
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
  const blocked = mainBlocked(input, mainSets);
  const def = needs(input);
  const targets = targetsFor(input);

  // Stable sorts: ties keep LIFTING_FOCUSES order, conditioning after.
  const lifting = LIFTING_FOCUSES
    .filter(f => eligible(input, f, blocked))
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
