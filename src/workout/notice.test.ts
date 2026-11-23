import { buildSession } from '../builder';
import { emptyHistory, lib } from '../builder/test-utils/fixtures';
import { reduceWorkout, startWorkout, stepsOf, type ItemRef, type WorkoutAction, type WorkoutState } from './index';
import { restNotice } from './notice';

const s = buildSession({ library: lib, history: emptyHistory(), today: '2026-11-22', checkIn: 'good', place: 'gym' }, { focus: 'chest-back', dose: 'full' });
const names = new Map(lib.map(e => [e.id, e.name]));
const clockText = (ms: number) => `T${ms}`;
const mainB = s.blocks.findIndex(b => b.kind === 'main');
const MAIN: ItemRef = { block: mainB, item: 0 };
const mainName = names.get(s.blocks[mainB].items[0].exerciseId)!;
const run = (w: WorkoutState, ...a: WorkoutAction[]) => a.reduce(reduceWorkout, w);
const atMain = () => {
  const w = startWorkout(s, lib, emptyHistory(), 0);
  w.logs[mainB][0].sets.forEach(x => { x.weight = 60; x.reps = 8; });
  return { ...w, step: stepsOf(s).findIndex(st => st.block === mainB) };
};

test('a main-lift rest names the next set', () => {
  const w = run(atMain(), { type: 'tick', ref: MAIN, set: 0, now: 1000 });
  expect(restNotice(w, names, clockText)).toEqual({
    endsAt: 151_000, title: 'Rest until T151000', body: `Next: ${mainName} · set 2 · 60 kg × 8`,
  });
});

test('a set with no weight yet names only the reps', () => {
  const w = run(atMain(), { type: 'tick', ref: MAIN, set: 0, now: 1000 });
  w.logs[mainB][0].sets[1].weight = null; // a loaded lift seen for the first time
  expect(restNotice(w, names, clockText)?.body).toBe(`Next: ${mainName} · set 2 · 8 reps`);
});

test('no rest, or a short one, gets no notification', () => {
  expect(restNotice(atMain(), names, clockText)).toBeNull();
  const w = run(atMain(), { type: 'tick', ref: MAIN, set: 0, now: 1000 });
  expect(restNotice({ ...w, rest: { ...w.rest!, seconds: 30 } }, names, clockText)).toBeNull();
});

test('the last set says so', () => {
  let w = atMain();
  w = { ...w, logs: w.logs.map(b => b.map(l => ({ ...l, sets: l.sets.map(x => ({ ...x, done: true, weight: x.weight ?? 0 })) }))) };
  w = { ...w, rest: { endsAt: 5000, seconds: 150, from: MAIN } };
  expect(restNotice(w, names, clockText)?.body).toBe('Last set done');
});
