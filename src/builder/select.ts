import type { BudgetMuscle, Exercise, Pattern } from '../library/types';
import { daysBetween } from './dates';
import { PATTERN_MUSCLES } from './focus';
import type { FocusId, History, Place, Slot } from './types';

export type { Slot, SlotKind } from './types';


export interface SelectContext {
  lib: Exercise[];
  history: History;
  today: string;
  focus: FocusId;
  place: Place;
  /** Exercise ids already in tonight's session. */
  used: Set<string>;
  /** Muscles that must not be a primary tonight (recovering, or at the weekly ceiling). */
  blocked: Set<BudgetMuscle>;
  /** 0..1 under-budget fraction per muscle. */
  deficit: Record<BudgetMuscle, number>;
}


/** FNV-1a 32-bit hash scaled to [0, 1): stable variety without randomness. */
export function hash01(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 2 ** 32;
}

const CONTINUITY_DAYS = 14;
const VARIETY_SESSIONS = 2;

/** Compound lift in one of the patterns that trains that pattern's own muscle (so close-grip bench is not a chest main). */
export function isMainLift(e: Exercise, patterns: Pattern[]): boolean {
  if (e.mechanic !== 'compound' || e.pattern === null || !patterns.includes(e.pattern)) return false;
  const native = PATTERN_MUSCLES[e.pattern] ?? [];
  return e.primary.some(m => native.includes(m));
}

function eligible(ctx: SelectContext, slot: Slot, e: Exercise): boolean {
  if (e.type !== 'strength' || e.purposes.length > 0 || !e.location.includes(ctx.place)) return false;
  if (ctx.history.feedback[e.id] === 'never' || ctx.used.has(e.id)) return false;
  if (e.primary.some(m => ctx.blocked.has(m))) return false;
  if (slot.kind === 'main') return isMainLift(e, slot.patterns ?? []);
  return slot.muscle !== undefined && e.primary.includes(slot.muscle);
}

/** Candidates for a slot, best first. Plan 4's swap list reuses this. */
export function rankCandidates(ctx: SelectContext, slot: Slot): Exercise[] {
  const past = ctx.history.sessions.filter(s => daysBetween(s.date, ctx.today) >= 0);
  const recentInFocus = new Set(past
    .filter(s => s.focus === ctx.focus && daysBetween(s.date, ctx.today) <= CONTINUITY_DAYS)
    .flatMap(s => s.exercises.map(x => x.exerciseId)));
  const lastSessions = new Set([...past]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, VARIETY_SESSIONS)
    .flatMap(s => s.exercises.map(x => x.exerciseId)));

  const score = (e: Exercise): number => {
    const fb = ctx.history.feedback[e.id];
    let s = fb === 'more' ? 2 : fb === 'less' ? -2 : 0;
    s += e.primary.reduce((a, m) => a + ctx.deficit[m], 0) / Math.max(1, e.primary.length);
    if (slot.kind === 'main') {
      if (recentInFocus.has(e.id)) s += 1;
    } else {
      if (lastSessions.has(e.id)) s -= 1;
      if (e.mechanic === 'isolation') s += 0.5;
    }
    return s + 0.5 * hash01(ctx.today + slot.key + e.id);
  };

  return ctx.lib
    .filter(e => eligible(ctx, slot, e))
    .map(e => ({ e, s: score(e) }))
    .sort((a, b) => b.s - a.s || (a.e.id < b.e.id ? -1 : 1))
    .map(x => x.e);
}
