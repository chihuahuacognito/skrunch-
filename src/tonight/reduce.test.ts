import type { CardPick } from '../builder';
import { emptyTonight, reduceTonight } from './reduce';
import type { TonightAction } from './types';

const empty = emptyTonight('2026-11-25');
const cardsA: CardPick[] = [{ exerciseId: 'Barbell_Squat', role: 'main' }];
const cardsB: CardPick[] = [{ exerciseId: 'Leg_Press', role: 'main' }];
const open = (group: 'quads' | 'chest', cards: CardPick[], now: number): TonightAction => ({ type: 'open', group, cards, now });

test('the empty state', () => {
  expect(empty).toEqual({
    version: 2, date: '2026-11-25', rest: null, lastRest: null, opened: [], cards: {}, promoted: {}, lastGroup: null, lastActionAt: null, firstSetAt: null,
  });
});

test('open records the group once, freezes its cards and sets lastGroup', () => {
  const s = reduceTonight(reduceTonight(empty, open('quads', cardsA, 1)), open('quads', cardsB, 2));
  expect(s.opened).toEqual(['quads']);
  expect(s.cards.quads).toEqual(cardsA);
  expect(s.lastGroup).toBe('quads');
  const t = reduceTonight(s, open('chest', cardsB, 3));
  expect(t.opened).toEqual(['quads', 'chest']);
  expect(t.lastGroup).toBe('chest');
});

test('logged sets firstSetAt once and lastActionAt every time', () => {
  const s = reduceTonight(reduceTonight(empty, { type: 'logged', now: 10 }), { type: 'logged', now: 20 });
  expect(s.firstSetAt).toBe(10);
  expect(s.lastActionAt).toBe(20);
});

test('restStart sets endsAt = now + seconds * 1000; restPlus adds; restEnd clears', () => {
  const rest = { seconds: 120, exerciseId: 'Barbell_Squat', set: 1, of: 3 };
  let s = reduceTonight(empty, { type: 'restStart', rest, now: 1000 });
  expect(s.rest).toEqual({ ...rest, endsAt: 121000 });
  expect(s.lastActionAt).toBe(1000);
  s = reduceTonight(s, { type: 'restPlus', seconds: 15 });
  expect(s.rest).toEqual({ ...rest, seconds: 135, endsAt: 136000 });
  expect(reduceTonight(s, { type: 'restEnd' }).rest).toBeNull();
  expect(reduceTonight(empty, { type: 'restPlus', seconds: 15 })).toBe(empty);
});

test('promote appends once', () => {
  let s = reduceTonight(empty, { type: 'promote', group: 'quads', exerciseId: 'Hack_Squat' });
  s = reduceTonight(s, { type: 'promote', group: 'quads', exerciseId: 'Hack_Squat' });
  expect(s.promoted.quads).toEqual(['Hack_Squat']);
});
