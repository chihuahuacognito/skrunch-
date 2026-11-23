import { buildSession, INCREMENT_KG, type BuilderInput, type FocusOption } from '../builder';
import { byId, emptyHistory, hist, lib } from '../builder/test-utils/fixtures';
import { reduceWorkout, startWorkout, summaryOf, toSessionLog, type ItemRef, type WorkoutAction, type WorkoutState } from './index';

const input = (over: Partial<BuilderInput> = {}): BuilderInput =>
  ({ library: lib, history: emptyHistory(), today: '2026-11-22', checkIn: 'good', place: 'gym', ...over });
const build = (option: FocusOption, over: Partial<BuilderInput> = {}) => buildSession(input(over), option);
const run = (state: WorkoutState, ...actions: WorkoutAction[]) => actions.reduce(reduceWorkout, state);
const tick = (ref: ItemRef, set: number): WorkoutAction => ({ type: 'tick', ref, set, now: 1000 });

const s = build({ focus: 'chest-back', dose: 'full' });
const mainB = s.blocks.findIndex(b => b.kind === 'main');
const coolB = s.blocks.findIndex(b => b.kind === 'cooldown');
const MAIN: ItemRef = { block: mainB, item: 0 };
const COOL: ItemRef = { block: coolB, item: 0 };
const start = () => run(startWorkout(s, lib, emptyHistory(), 0), { type: 'edit', ref: MAIN, set: 0, field: 'weight', value: 60 });

test('only done sets are logged, skipped exercises are left out', () => {
  const w = run(start(), tick(MAIN, 0), tick(MAIN, 1));
  const log = toSessionLog(w)!;
  expect(log).toMatchObject({ date: '2026-11-22', focus: 'chest-back', intervals: false });
  expect(log.exercises).toHaveLength(1);
  expect(log.exercises[0].exerciseId).toBe(s.blocks[mainB].items[0].exerciseId);
  expect(log.exercises[0].sets).toHaveLength(2);
  expect(log.exercises[0].sets[0]).toEqual({ weight: 60, reps: w.logs[mainB][0].sets[0].reps, seconds: null });
});

test('exercises are logged in block then item order', () => {
  const w = run(start(), tick(COOL, 0), tick(MAIN, 0));
  expect(toSessionLog(w)!.exercises.map(e => e.exerciseId)).toEqual(
    [s.blocks[mainB].items[0].exerciseId, s.blocks[coolB].items[0].exerciseId]);
});

test('targets come from the reps dose; holds log seconds with null targets', () => {
  const w = run(start(), tick(MAIN, 0), tick(COOL, 0));
  const [main, cool] = toSessionLog(w)!.exercises;
  const dose = s.blocks[mainB].items[0].dose;
  expect(dose.format).toBe('reps');
  if (dose.format === 'reps') expect([main.targetMin, main.targetMax]).toEqual([dose.min, dose.max]);
  expect([cool.targetMin, cool.targetMax]).toEqual([null, null]);
  expect(cool.sets[0].weight).toBeNull();
  expect(cool.sets[0].seconds).toBeGreaterThan(0);
});

test('chips are carried to the log', () => {
  const w = run(start(), tick(MAIN, 0), { type: 'chip', ref: MAIN, chip: 'hard' });
  expect(toSessionLog(w)!.exercises[0].chip).toBe('hard');
});

test('intervals is set only when an interval set was done', () => {
  const c = build({ focus: 'conditioning', dose: 'full' });
  expect(c.intervals).toBe(true);
  const ib = c.blocks.findIndex(b => b.kind === 'intervals');
  const wb = c.blocks.findIndex(b => b.kind === 'warmup');
  const w = startWorkout(c, lib, emptyHistory(), 0);
  expect(toSessionLog(run(w, tick({ block: wb, item: 0 }, 0)))!.intervals).toBe(false);
  expect(toSessionLog(run(w, tick({ block: ib, item: 0 }, 0)))!.intervals).toBe(true);
});

test('nothing done logs nothing', () => {
  expect(toSessionLog(start())).toBeNull();
});

test('summary counts minutes, sets and exercises', () => {
  const w = run(start(), tick(MAIN, 0), tick(MAIN, 1), tick(COOL, 0));
  expect(summaryOf(w, 54 * 60_000 + 20_000)).toEqual({ minutes: 54, sets: 3, exercises: 2 });
});

test('a logged workout feeds progression', () => {
  const item = s.blocks[mainB].items[0];
  if (item.dose.format !== 'reps') throw new Error('main lift should be reps');
  let w = start();
  for (let i = 0; i < item.sets; i++) w = run(w, { type: 'edit', ref: MAIN, set: i, field: 'reps', value: item.dose.max }, tick(MAIN, i));
  w = run(w, { type: 'chip', ref: MAIN, chip: 'right' });
  const history = hist([toSessionLog(w)!]);
  const next = build({ focus: 'chest-back', dose: 'full' }, { history, today: '2026-11-25' });
  const again = next.blocks.flatMap(b => b.items).find(x => x.exerciseId === item.exerciseId);
  expect(again).toBeDefined();
  expect(again!.weight).toBe(60 + INCREMENT_KG[byId(item.exerciseId).equipment[0] ?? 'other']);
  expect(again!.progressed).toBe(true);
});
