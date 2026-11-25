import type { Exercise, Pattern } from '../library/types';
import { daysBetween } from './dates';
import { GROUP_MUSCLES, type GroupId } from './groups';
import { isInterval, isZone2 } from './parts';
import { hash01, isMainLift } from './select';
import type { Role } from './target';
import type { GroupInput } from './types';

// Tunable (spec 8.4).
const CARDS = 3;
const CONTINUITY_DAYS = 21;
const CONTINUITY_BONUS = 3;
const FEEDBACK_BONUS = 2;
const ISOLATION_BONUS = 0.5;

/** Patterns whose compound lifts can be a group's main lift. Arms, core and calves have none. */
const MAIN_PATTERNS: Record<GroupId, Pattern[]> = {
  chest: ['push-horizontal'], back: ['pull-horizontal', 'pull-vertical'], shoulders: ['push-vertical'],
  quads: ['squat', 'lunge'], hamstrings: ['hinge'], glutes: ['hinge', 'lunge'], arms: [], core: [], calves: [],
};

export interface CardPick { exerciseId: string; role: Role }

/** Most recent date each exercise was logged with sets, up to today. */
function lastDone(input: GroupInput): Map<string, string> {
  const out = new Map<string, string>();
  for (const s of input.history.sessions) {
    if (daysBetween(s.date, input.today) < 0) continue;
    for (const x of s.exercises) {
      if (x.sets.length === 0) continue;
      const prev = out.get(x.exerciseId);
      if (!prev || s.date > prev) out.set(x.exerciseId, s.date);
    }
  }
  return out;
}

function ranker(input: GroupInput, key: string) {
  const done = lastDone(input);
  return (e: Exercise, accessory: boolean): number => {
    const fb = input.history.feedback[e.id];
    let s = fb === 'more' ? FEEDBACK_BONUS : fb === 'less' ? -FEEDBACK_BONUS : 0;
    const date = done.get(e.id);
    if (date && daysBetween(date, input.today) <= CONTINUITY_DAYS) {
      // More recent wins among recent ones: a 0..1 freshness on top of the bonus.
      s += CONTINUITY_BONUS + 1 - daysBetween(date, input.today) / (CONTINUITY_DAYS + 1);
    }
    if (accessory && e.mechanic === 'isolation') s += ISOLATION_BONUS;
    return s + 0.5 * hash01(input.today + key + e.id);
  };
}

const byScore = (list: Exercise[], score: (e: Exercise) => number): Exercise[] =>
  list.map(e => ({ e, s: score(e) })).sort((a, b) => b.s - a.s || (a.e.id < b.e.id ? -1 : 1)).map(x => x.e);

/**
 * Tonight's three cards for a group (a main lift first when the group has one) and the rest as More, best first.
 * Recently done exercises keep their place so progression stays meaningful.
 */
export function pickGroup(input: GroupInput, group: GroupId): { cards: CardPick[]; more: string[] } {
  const muscles = GROUP_MUSCLES[group];
  const candidates = input.library.filter(e =>
    e.type === 'strength' && e.location.includes('gym') && e.purposes.length === 0 &&
    input.history.feedback[e.id] !== 'never' && e.primary.some(m => muscles.includes(m)));
  const score = ranker(input, group);

  const cards: CardPick[] = [];
  const mainPool = candidates.filter(e => isMainLift(e, MAIN_PATTERNS[group]));
  const main = byScore(mainPool, e => score(e, false))[0];
  if (main) cards.push({ exerciseId: main.id, role: 'main' });

  let rest = byScore(candidates.filter(e => e.id !== main?.id), e => score(e, true));
  if (group === 'arms') {
    // One of each first, so arms never means two curls.
    for (const m of ['biceps', 'triceps'] as const) {
      const pick = rest.find(e => e.primary.includes(m));
      if (pick && cards.length < CARDS) {
        cards.push({ exerciseId: pick.id, role: 'accessory' });
        rest = rest.filter(e => e.id !== pick.id);
      }
    }
  }
  while (cards.length < CARDS && rest.length > 0) {
    cards.push({ exerciseId: rest[0].id, role: 'accessory' });
    rest = rest.slice(1);
  }
  return { cards, more: rest.map(e => e.id) };
}

/** Zone 2 and interval items for the Cardio screen, recently done first. */
export function cardioPicks(input: GroupInput): { zone2: string[]; intervals: string[] } {
  const score = ranker(input, 'cardio');
  const order = (pred: (e: Exercise) => boolean) =>
    byScore(input.library.filter(e => pred(e) && input.history.feedback[e.id] !== 'never'), e => score(e, false)).map(e => e.id);
  return { zone2: order(isZone2), intervals: order(isInterval) };
}
