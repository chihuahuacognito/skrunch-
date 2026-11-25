import { GROUPS } from './groups';
import { cardioPicks, pickGroup } from './pick';
import { byId, hist, lib, logged } from './test-utils/fixtures';
import type { Feedback, GroupInput, SessionLog } from './types';

const TODAY = '2026-11-25';
const input = (sessions: SessionLog[] = [], feedback: Record<string, Feedback> = {}): GroupInput =>
  ({ library: lib, history: hist(sessions, { feedback }), today: TODAY });

test('every group yields 3 cards; main lift first where one exists', () => {
  for (const g of GROUPS) {
    const { cards } = pickGroup(input(), g);
    expect(cards).toHaveLength(3);
    const mains = cards.filter(c => c.role === 'main').length;
    expect(mains).toBe(['arms', 'calves', 'core'].includes(g) ? 0 : 1);
    if (mains === 1) expect(cards[0].role).toBe('main');
  }
});

test('arms shows a biceps and a triceps accessory', () => {
  const muscles = pickGroup(input(), 'arms').cards.map(c => byId(c.exerciseId).primary[0]);
  expect(muscles).toEqual(expect.arrayContaining(['biceps', 'triceps']));
});

test('cards train the group, are gym strength without purposes, and never repeat with More', () => {
  for (const g of GROUPS) {
    const { cards, more } = pickGroup(input(), g);
    const ids = [...cards.map(c => c.exerciseId), ...more];
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) {
      const e = byId(id);
      expect(e.type).toBe('strength');
      expect(e.location).toContain('gym');
      expect(e.purposes).toEqual([]);
    }
  }
  expect(pickGroup(input(), 'calves').more).toHaveLength(1);
});

test('an exercise logged in the last 21 days wins its slot (continuity)', () => {
  const fresh = pickGroup(input(), 'quads').cards.map(c => c.exerciseId);
  const other = pickGroup(input(), 'quads').more.at(-1)!;
  expect(fresh).not.toContain(other);
  const withHistory = pickGroup(input([logged('2026-11-10', 'free', [[other, 3]])]), 'quads').cards.map(c => c.exerciseId);
  expect(withHistory).toContain(other);
  const stale = pickGroup(input([logged('2026-10-01', 'free', [[other, 3]])]), 'quads').cards.map(c => c.exerciseId);
  expect(stale).toEqual(fresh);
});

test('the most recently done main lift stays the main lift', () => {
  const h = [logged('2026-11-20', 'free', [['Leg_Press', 3]]), logged('2026-11-10', 'free', [['Barbell_Squat', 3]])];
  expect(pickGroup(input(h), 'quads').cards[0]).toEqual({ exerciseId: 'Leg_Press', role: 'main' });
});

test('feedback never hides an exercise; more pulls one into the cards', () => {
  const first = pickGroup(input(), 'chest').cards[0].exerciseId;
  const hidden = pickGroup(input([], { [first]: 'never' }), 'chest');
  expect([...hidden.cards.map(c => c.exerciseId), ...hidden.more]).not.toContain(first);
  const last = pickGroup(input(), 'chest').more.at(-1)!;
  const liked = pickGroup(input([], { [last]: 'more' }), 'chest');
  expect(liked.more).not.toContain(last);
});

test('the same day gives the same picks', () => {
  expect(pickGroup(input(), 'back')).toEqual(pickGroup(input(), 'back'));
});

test('cardio picks split Zone 2 and interval items', () => {
  const { zone2, intervals } = cardioPicks(input());
  expect(zone2).toEqual(expect.arrayContaining(['Walking_Treadmill', 'Bicycling_Stationary', 'Rowing_Stationary']));
  expect(intervals).toEqual(expect.arrayContaining(['burpees', 'Battling_Ropes', 'air-bike-intervals']));
  expect(zone2.some(id => intervals.includes(id))).toBe(false);
});
