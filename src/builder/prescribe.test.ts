import { nextLoad, prescribeReps, rirFor } from './prescribe';
import { BENCH, byId, emptyHistory, hist } from './test-utils/fixtures';
import type { Chip, History } from './types';
import type { Exercise } from '../library/types';

const bench = byId(BENCH);
const legPress = byId('Leg_Press');

type Log = { reps: number; targetMax: number; weight: number | null; chip: Chip | null };
const entry = (e: Exercise, date: string, l: Log) => ({
  date, focus: 'chest-back' as const, intervals: false,
  exercises: [{ exerciseId: e.id, targetMin: 6, targetMax: l.targetMax, chip: l.chip, sets: [1, 2, 3].map(() => ({ weight: l.weight, reps: l.reps as number | null, seconds: null as number | null })) }],
});
const histWith = (e: Exercise, l: Log): History => hist([entry(e, '2026-11-20', l)]);
const twoEasy = (e: Exercise, l: Omit<Log, 'chip'>): History =>
  hist([entry(e, '2026-11-20', { ...l, chip: 'easy' }), entry(e, '2026-11-17', { ...l, chip: 'easy' })]);

test('main reps clamp into 5-12, supersets into 10-20', () => {
  expect(prescribeReps({ format: 'reps', min: 4, max: 8 }, 'main')).toEqual({ format: 'reps', min: 5, max: 8 });
  expect(prescribeReps({ format: 'reps', min: 6, max: 10 }, 'superset')).toEqual({ format: 'reps', min: 10, max: 12 });
  expect(prescribeReps({ format: 'reps', min: 15, max: 20 }, 'main')).toEqual({ format: 'reps', min: 12, max: 12 });
  expect(prescribeReps({ format: 'hold', seconds: 30 }, 'main')).toEqual({ format: 'hold', seconds: 30 });
});

test('rir by dose', () => {
  expect(rirFor('full', false, false)).toEqual([1, 3]);
  expect(rirFor('full', true, false)).toEqual([3, 3]);
  expect(rirFor('reduced', false, false)).toEqual([2, 3]);
  expect(rirFor('full', false, true)).toEqual([3, 4]);
  expect(rirFor('minimum', false, false)).toEqual([3, 4]);
});

test('first appearance has a blank weight', () =>
  expect(nextLoad(bench, emptyHistory(), true)).toEqual({ weight: null, progressed: false }));

test('top of range on every set adds the smallest increment', () =>
  expect(nextLoad(bench, histWith(bench, { reps: 10, targetMax: 10, weight: 60, chip: null }), true)).toEqual({ weight: 62.5, progressed: true }));

test('hard holds the weight', () =>
  expect(nextLoad(bench, histWith(bench, { reps: 10, targetMax: 10, weight: 60, chip: 'hard' }), true).weight).toBe(60));

test('short of the top of the range holds the weight', () =>
  expect(nextLoad(bench, histWith(bench, { reps: 8, targetMax: 10, weight: 60, chip: 'right' }), true)).toEqual({ weight: 60, progressed: false }));

test('easy twice in a row progresses below the top of the range', () =>
  expect(nextLoad(bench, twoEasy(bench, { reps: 8, targetMax: 10, weight: 60 }), true).progressed).toBe(true));

test('no progression when not allowed', () =>
  expect(nextLoad(bench, histWith(bench, { reps: 10, targetMax: 10, weight: 60, chip: null }), false)).toEqual({ weight: 60, progressed: false }));

test('machines step by 5 kg', () =>
  expect(nextLoad(legPress, histWith(legPress, { reps: 12, targetMax: 12, weight: 100, chip: null }), true).weight).toBe(105));

test('bodyweight logs keep a blank weight', () =>
  expect(nextLoad(bench, histWith(bench, { reps: 10, targetMax: 10, weight: null, chip: null }), true)).toEqual({ weight: null, progressed: false }));

test('bodyweight lifts logged at 0 kg progress by reps, never by adding kilograms', () => {
  const pullUp = byId('Pullups');
  expect(nextLoad(pullUp, histWith(pullUp, { reps: 10, targetMax: 10, weight: 0, chip: null }), true)).toEqual({ weight: 0, progressed: false });
});

test('a set logged in seconds never counts as reaching a rep target', () => {
  const h = histWith(bench, { reps: 10, targetMax: 10, weight: 60, chip: null });
  h.sessions[0].exercises[0].sets = h.sessions[0].exercises[0].sets.map(s => ({ ...s, reps: null, seconds: 30 }));
  expect(nextLoad(bench, h, true)).toEqual({ weight: 60, progressed: false });
});
