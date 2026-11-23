import { buildSession } from '../builder';
import { emptyHistory, lib } from '../builder/test-utils/fixtures';
import { canTick, nextOpenSet, reduceWorkout, startWorkout, stepsOf, type ItemRef, type WorkoutAction, type WorkoutState } from './index';

const s = buildSession({ library: lib, history: emptyHistory(), today: '2026-11-22', checkIn: 'good', place: 'gym' }, { focus: 'chest-back', dose: 'full' });
const steps = stepsOf(s);
const mainB = s.blocks.findIndex(b => b.kind === 'main');
const ssB = s.blocks.findIndex(b => b.kind === 'superset');
const MAIN: ItemRef = { block: mainB, item: 0 };
const A1: ItemRef = { block: ssB, item: 0 };
const A2: ItemRef = { block: ssB, item: 1 };
const stepOf = (ref: ItemRef) => steps.findIndex(st => st.block === ref.block && st.items.includes(ref.item));

const run = (state: WorkoutState, ...actions: WorkoutAction[]) => actions.reduce(reduceWorkout, state);
const weigh = (ref: ItemRef, value: number): WorkoutAction => ({ type: 'edit', ref, set: 0, field: 'weight', value });
const start = () => run(startWorkout(s, lib, emptyHistory(), 0), weigh(MAIN, 60), weigh(A1, 20), weigh(A2, 15));
const tick = (ref: ItemRef, set: number, now = 1000): WorkoutAction => ({ type: 'tick', ref, set, now });
const sets = (w: WorkoutState, ref: ItemRef) => w.logs[ref.block][ref.item].sets;

test('ticking logs the set and starts the item rest', () => {
  const w = run(start(), tick(MAIN, 0, 1000));
  expect(sets(w, MAIN)[0].done).toBe(true);
  expect(w.rest).toEqual({ endsAt: 1000 + 150_000, seconds: 150, from: MAIN });
});

test('ticking a done set changes nothing', () => {
  const w = run(start(), tick(MAIN, 0));
  expect(reduceWorkout(w, tick(MAIN, 0, 5000))).toBe(w);
});

test('a loaded set with no weight cannot be ticked', () => {
  const w = startWorkout(s, lib, emptyHistory(), 0);
  expect(canTick(w, MAIN, 0)).toBe(false);
  expect(reduceWorkout(w, tick(MAIN, 0))).toBe(w);
});

test('a weight edit fills the later open sets of that exercise', () => {
  const w = run(start(), tick(MAIN, 0), { type: 'edit', ref: MAIN, set: 1, field: 'weight', value: 65 });
  expect(sets(w, MAIN).map(x => x.weight)).toEqual([60, 65, 65]);
});

test('a reps edit changes only that set', () => {
  const w = run(start(), { type: 'edit', ref: MAIN, set: 1, field: 'reps', value: 9 });
  const before = sets(start(), MAIN).map(x => x.reps);
  expect(sets(w, MAIN).map(x => x.reps)).toEqual([before[0], 9, before[2]]);
});

test('finishing a step moves to the next one', () => {
  let w = start();
  const first = s.blocks[0].items[0];
  for (let i = 0; i < first.sets; i++) w = run(w, tick({ block: 0, item: 0 }, i));
  expect(w.step).toBe(1);

  const lastStep = steps.length - 1;
  w = run(w, { type: 'go', step: lastStep });
  const st = steps[lastStep];
  for (const item of st.items) for (let i = 0; i < s.blocks[st.block].items[item].sets; i++) w = run(w, tick({ block: st.block, item }, i));
  expect(w.step).toBe(lastStep);
});

test('a superset rests only after the second exercise', () => {
  let w = run(start(), { type: 'go', step: stepOf(A1) }, tick(A1, 0));
  expect(w.rest).toBeNull();
  w = run(w, tick(A2, 0, 2000));
  expect(w.rest).toMatchObject({ seconds: 75, endsAt: 2000 + 75_000, from: A2 });
});

test('complete set from the notification ticks the next open set in round order', () => {
  let w = run(start(), { type: 'go', step: stepOf(A1) });
  expect(nextOpenSet(w)).toEqual({ ref: A1, set: 0 });
  const order: { ref: ItemRef; set: number }[] = [];
  for (let i = 0; i < 3; i++) {
    order.push(nextOpenSet(w)!);
    w = run(w, { type: 'completeNext', now: 1000 });
  }
  expect(order).toEqual([{ ref: A1, set: 0 }, { ref: A2, set: 0 }, { ref: A1, set: 1 }]);
});

test('complete set skips nothing it cannot log', () => {
  const w = run(startWorkout(s, lib, emptyHistory(), 0), { type: 'go', step: stepOf(MAIN) });
  expect(canTick(w, MAIN, 0)).toBe(false);
  expect(reduceWorkout(w, { type: 'completeNext', now: 1 })).toBe(w);
});

test('+15 s extends the rest and the rest can end', () => {
  let w = run(start(), tick(MAIN, 0, 1000), { type: 'restPlus', seconds: 15 });
  expect(w.rest).toMatchObject({ endsAt: 1000 + 165_000, seconds: 165 });
  w = run(w, { type: 'restEnd' });
  expect(w.rest).toBeNull();
  expect(reduceWorkout(w, { type: 'restPlus', seconds: 15 })).toBe(w);
});

test('swap replaces an untouched item and refuses a started one', () => {
  const item = { ...s.blocks[mainB].items[0], exerciseId: 'Other', weight: 40 };
  const fresh = [{ weight: 40, reps: 5, seconds: null, done: false }];
  const w = run(start(), { type: 'chip', ref: MAIN, chip: 'easy' }, { type: 'swap', ref: MAIN, item, sets: fresh });
  expect(w.session.blocks[mainB].items[0].exerciseId).toBe('Other');
  expect(w.logs[mainB][0]).toEqual({ sets: fresh, chip: null });
  expect(s.blocks[mainB].items[0].exerciseId).not.toBe('Other');

  const started = run(start(), tick(MAIN, 0));
  expect(reduceWorkout(started, { type: 'swap', ref: MAIN, item, sets: fresh })).toBe(started);
});

test('untick reopens a set and leaves the rest alone', () => {
  const w = run(start(), tick(MAIN, 0), { type: 'untick', ref: MAIN, set: 0 });
  expect(sets(w, MAIN)[0].done).toBe(false);
  expect(w.rest).not.toBeNull();
});

test('chips are set and cleared', () => {
  let w = run(start(), { type: 'chip', ref: MAIN, chip: 'hard' });
  expect(w.logs[mainB][0].chip).toBe('hard');
  w = run(w, { type: 'chip', ref: MAIN, chip: null });
  expect(w.logs[mainB][0].chip).toBeNull();
});

test('go clamps to the steps', () => {
  expect(run(start(), { type: 'go', step: 999 }).step).toBe(steps.length - 1);
  expect(run(start(), { type: 'go', step: -3 }).step).toBe(0);
});
