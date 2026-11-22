import type { BudgetMuscle, Exercise, Pattern } from '../library/types';
import { BUDGET_MUSCLES } from '../library/vocab';
import { blockState } from './block';
import { weeklyTargets } from './budget';
import { daysBetween } from './dates';
import { FOCUS_SPECS, LIFTING_FOCUSES, type LiftingFocus } from './focus';
import { unrecovered } from './recovery';
import type { BuilderInput, FocusId, FocusOption, SessionDose } from './types';
import { weeklyVolume } from './volume';

// Tunable defaults: the spec expects these to change with use.
const FULL_BODY_FACTOR = 0.9;
const CONDITIONING_WEIGHT = 0.6;
const CONDITIONING_RAMP_DAYS = 4;
const MAX_INTERVALS_PER_WEEK = 2;
const REST_AFTER_DAYS = 6;

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

/** Good check-in, fewer than 2 interval sessions in the rolling week, and never on a Lower day. */
export function intervalsAllowed(input: BuilderInput, focus: FocusId): boolean {
  if (input.checkIn !== 'good' || focus === 'lower') return false;
  const recent = input.history.sessions.filter(s => {
    const age = daysBetween(s.date, input.today);
    return s.intervals && age >= 0 && age <= 6;
  });
  return recent.length < MAX_INTERVALS_PER_WEEK;
}

function hasMainCandidate(input: BuilderInput, patterns: Pattern[], blocked: Set<BudgetMuscle>): boolean {
  return input.library.some((e: Exercise) =>
    e.type === 'strength' && e.mechanic === 'compound' && e.purposes.length === 0 && e.location.includes('gym')
    && e.pattern !== null && patterns.includes(e.pattern) && input.history.feedback[e.id] !== 'never'
    && e.primary.every(m => !blocked.has(m)));
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
  const mean = muscles.reduce((a, m) => a + def[m], 0) / muscles.length;
  return focus === 'full-body' ? mean * FULL_BODY_FACTOR : mean;
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

  const blocked = unrecovered(input.library, input.history.sessions, input.today);
  const def = deficits(input);
  const targets = targetsFor(input);

  // Stable sorts: ties keep LIFTING_FOCUSES order, conditioning after.
  const lifting = LIFTING_FOCUSES
    .filter(f => eligible(input, f, blocked))
    .map(f => ({ focus: f as FocusId, score: liftingScore(f, def, blocked, targets) }));

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
