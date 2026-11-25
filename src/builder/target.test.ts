import { isHit, targetFor } from './target';
import { byId, emptyHistory, hist } from './test-utils/fixtures';
import type { History, LoggedSet, SessionLog } from './types';

const TODAY = '2026-11-25';
const squat = byId('Barbell_Squat'); // 5-8, barbell
const lunges = byId('Dumbbell_Lunges'); // 8-12, dumbbell
const pushups = byId('Pushups'); // 8-15, bodyweight
const set = (weight: number | null, reps: number | null, seconds: number | null = null): LoggedSet => ({ weight, reps, seconds });
type Meta = { planned: number | null; min: number | null };
const day = (date: string, id: string, sets: LoggedSet[], meta: Meta): SessionLog => ({
  date, focus: 'free', intervals: false,
  exercises: [{ exerciseId: id, targetMin: meta.min, targetMax: null, chip: null, plannedSets: meta.planned, sets }],
});
const logged = (id: string, sets: LoggedSet[], meta: Meta): History => hist([day('2026-11-20', id, sets, meta)]);
const three = (w: number, r: number) => [set(w, r), set(w, r), set(w, r)];

test('first time: bottom of the range, no weight, needs weight', () => {
  expect(targetFor(squat, 'main', emptyHistory(), TODAY)).toEqual({
    sets: 3, reps: 5, minutes: null, weight: null, restSeconds: 120, range: [5, 8], needsWeight: true,
  });
});

test('a hit adds a rep', () => {
  expect(targetFor(squat, 'main', logged(squat.id, three(60, 6), { planned: 3, min: 6 }), TODAY))
    .toMatchObject({ reps: 7, weight: 60, needsWeight: false });
});

test('every set at the top of the range adds the increment and resets reps', () => {
  expect(targetFor(squat, 'main', logged(squat.id, three(60, 8), { planned: 3, min: 8 }), TODAY)).toMatchObject({ reps: 5, weight: 62.5 });
});

test('fewer sets than planned is a miss: same target', () => {
  expect(targetFor(squat, 'main', logged(squat.id, [set(60, 6), set(60, 6)], { planned: 3, min: 6 }), TODAY))
    .toMatchObject({ reps: 6, weight: 60 });
});

test('a short rep is a miss', () => {
  expect(targetFor(squat, 'main', logged(squat.id, [set(60, 6), set(60, 5), set(60, 6)], { planned: 3, min: 6 }), TODAY))
    .toMatchObject({ reps: 6, weight: 60 });
});

test('a log without planned sets (pre-v3) counts as a miss', () => {
  expect(targetFor(squat, 'main', logged(squat.id, three(60, 6), { planned: null, min: 6 }), TODAY)).toMatchObject({ reps: 6, weight: 60 });
});

test('a last target outside the range is clamped into it', () => {
  expect(targetFor(squat, 'main', logged(squat.id, three(60, 3), { planned: 3, min: 3 }), TODAY)).toMatchObject({ reps: 5, weight: 60 });
});

test('bodyweight starts at 0 kg without asking, climbs reps and never adds kilograms', () => {
  expect(targetFor(pushups, 'main', emptyHistory(), TODAY)).toMatchObject({ weight: 0, reps: 8, needsWeight: false });
  expect(targetFor(pushups, 'main', logged(pushups.id, three(0, 12), { planned: 3, min: 12 }), TODAY)).toMatchObject({ weight: 0, reps: 12 });
  expect(targetFor(pushups, 'main', logged(pushups.id, three(0, 11), { planned: 3, min: 11 }), TODAY)).toMatchObject({ weight: 0, reps: 12 });
});

test('accessories use 10-15 clamped to the dose, rest 90 s', () => {
  expect(targetFor(lunges, 'accessory', emptyHistory(), TODAY)).toMatchObject({ reps: 10, range: [10, 12], restSeconds: 90 });
  expect(targetFor(lunges, 'accessory', logged(lunges.id, three(12, 12), { planned: 3, min: 12 }), TODAY))
    .toMatchObject({ reps: 10, weight: 14.5 });
});

test('deload week: 2 sets, last weight and target reps, no progression', () => {
  // Weekly sessions from 2026-10-17 (no 14-day gap) put 2026-11-25 in week 6 of the block.
  const weekly = ['2026-10-17', '2026-10-24', '2026-10-31', '2026-11-07', '2026-11-14'].map(d => day(d, squat.id, three(50, 5), { planned: 3, min: 5 }));
  const h = hist([...weekly, day('2026-11-20', squat.id, three(60, 8), { planned: 3, min: 8 })]);
  expect(targetFor(squat, 'main', h, TODAY)).toMatchObject({ sets: 2, reps: 8, weight: 60 });
});

test('Zone 2 is 25 min; rep intervals 4 rounds at 60 s rest; timed intervals use the library minutes', () => {
  expect(targetFor(byId('Walking_Treadmill'), 'accessory', emptyHistory(), TODAY)).toEqual({
    sets: 1, reps: null, minutes: 25, weight: null, restSeconds: 0, range: null, needsWeight: false,
  });
  expect(targetFor(byId('burpees'), 'accessory', emptyHistory(), TODAY)).toEqual({
    sets: 4, reps: 8, minutes: null, weight: null, restSeconds: 60, range: null, needsWeight: false,
  });
  expect(targetFor(byId('Battling_Ropes'), 'accessory', emptyHistory(), TODAY)).toMatchObject({ sets: 1, minutes: 5, reps: null });
});

test('isHit needs planned sets and every set at target', () => {
  const ex = (sets: LoggedSet[], planned: number | null, min: number | null) =>
    ({ exerciseId: 'x', targetMin: min, targetMax: null, chip: null, plannedSets: planned, sets });
  expect(isHit(ex(three(60, 6), 3, 6))).toBe(true);
  expect(isHit(ex(three(60, 7), 3, 6))).toBe(true);
  expect(isHit(ex([set(60, 6), set(60, 6)], 3, 6))).toBe(false);
  expect(isHit(ex(three(60, 6), null, 6))).toBe(false);
  expect(isHit(ex(three(60, 6), 3, null))).toBe(false);
});
