import { buildSession, type PlannedExercise } from '../builder';
import { BENCH, byId, emptyHistory, hist, lib, logged } from '../builder/test-utils/fixtures';
import { prefillSets, startWorkout, stepsOf } from './index';

const session = () =>
  buildSession({ library: lib, history: emptyHistory(), today: '2026-11-22', checkIn: 'good', place: 'gym' }, { focus: 'chest-back', dose: 'full' });

const planned = (over: Partial<PlannedExercise>): PlannedExercise => ({
  exerciseId: BENCH, slot: { kind: 'main', patterns: ['push-horizontal'], key: 'm0' }, sets: 3,
  dose: { format: 'reps', min: 6, max: 10 }, rir: [1, 3], restSeconds: 150, weight: null, progressed: false, ...over,
});

const withReps = (reps: number[]) => {
  const log = logged('2026-11-18', 'chest-back', [[BENCH, reps.length]], { weight: 60 });
  log.exercises[0].sets = reps.map(r => ({ weight: 60, reps: r, seconds: null }));
  return hist([log]);
};

test('steps: a superset is one step, other items one step each', () => {
  const s = session();
  const steps = stepsOf(s);
  s.blocks.forEach((b, bi) => {
    const mine = steps.filter(st => st.block === bi);
    if (b.kind === 'superset') expect(mine).toEqual([{ block: bi, items: b.items.map((_, i) => i) }]);
    else expect(mine).toEqual(b.items.map((_, i) => ({ block: bi, items: [i] })));
  });
  expect(steps.map(st => st.block)).toEqual([...steps.map(st => st.block)].sort((a, b) => a - b));
});

test('first appearance: loaded lifts are blank, bodyweight lifts 0 kg, reps at the bottom of the range', () => {
  expect(prefillSets(planned({}), byId(BENCH), emptyHistory())).toEqual(
    [1, 2, 3].map(() => ({ weight: null, reps: 6, seconds: null, done: false })));
  const push = planned({ exerciseId: 'Pushups', slot: { kind: 'superset', muscle: 'chest', key: 'ss0a' }, dose: { format: 'reps', min: 10, max: 15 } });
  expect(prefillSets(push, byId('Pushups'), emptyHistory()).map(s => s.weight)).toEqual([0, 0, 0]);
});

test('items without a slot never carry a weight', () => {
  const warm = planned({ exerciseId: 'Pushups', slot: null, rir: null });
  expect(prefillSets(warm, byId('Pushups'), emptyHistory()).map(s => s.weight)).toEqual([null, null, null]);
});

test('reps follow last time per set, clamped to the range', () => {
  const item = planned({ weight: 60 });
  expect(prefillSets(item, byId(BENCH), withReps([10, 9, 7])).map(s => s.reps)).toEqual([10, 9, 7]);
  expect(prefillSets(item, byId(BENCH), withReps([12, 12, 12])).map(s => s.reps)).toEqual([10, 10, 10]);
  expect(prefillSets(item, byId(BENCH), withReps([4, 8])).map(s => s.reps)).toEqual([6, 8, 8]);
});

test('after a weight increase reps restart at the bottom', () => {
  const item = planned({ weight: 62.5, progressed: true });
  expect(prefillSets(item, byId(BENCH), withReps([10, 10, 10])).map(s => s.reps)).toEqual([6, 6, 6]);
});

test('holds and timed work pre-fill seconds', () => {
  const hold = planned({ exerciseId: '90_90_Hamstring', slot: null, sets: 2, dose: { format: 'hold', seconds: 30 }, rir: null });
  expect(prefillSets(hold, byId('90_90_Hamstring'), emptyHistory())).toEqual(
    [1, 2].map(() => ({ weight: null, reps: null, seconds: 30, done: false })));
  const timed = planned({ exerciseId: 'Battling_Ropes', slot: null, sets: 1, dose: { format: 'duration', minutes: 8 }, rir: null });
  expect(prefillSets(timed, byId('Battling_Ropes'), emptyHistory())[0]).toMatchObject({ seconds: 480, reps: null });
});

test('startWorkout pre-fills every item and starts at the first step with no rest', () => {
  const s = session();
  const w = startWorkout(s, lib, emptyHistory(), 1000);
  expect(w).toMatchObject({ version: 1, session: s, startedAt: 1000, step: 0, rest: null });
  expect(w.logs.map(b => b.length)).toEqual(s.blocks.map(b => b.items.length));
  w.logs.forEach((b, bi) => b.forEach((l, i) => {
    expect(l.chip).toBeNull();
    expect(l.sets).toHaveLength(s.blocks[bi].items[i].sets);
  }));
});
