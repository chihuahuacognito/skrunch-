import type { LoggedSet } from '../builder';
import { loadHistory } from './history';
import { appendSet, dayTimes, removeExercise, replaceSets, type LogMeta } from './log';
import { migrate } from './schema';
import type { SqlDb } from './sql';
import { nodeDb } from './test-utils/nodeDb';

const D = '2026-11-25';
const set60x6: LoggedSet = { weight: 60, reps: 6, seconds: null };
const meta: LogMeta = { plannedSets: 3, targetMin: 6, targetMax: 8, intervals: false };

let db: SqlDb;
beforeEach(async () => {
  db = nodeDb();
  await migrate(db);
});

test('appendSet creates the day session as free and is idempotent per index', async () => {
  expect(await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 0)).toBe(true);
  expect(await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 0)).toBe(false);
  expect(await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 1)).toBe(true);
  expect(await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 3)).toBe(false);
  const h = await loadHistory(db);
  expect(h.sessions).toHaveLength(1);
  expect(h.sessions[0]).toMatchObject({ date: D, focus: 'free', intervals: false });
  expect(h.sessions[0].exercises[0]).toEqual({
    exerciseId: 'Barbell_Squat', targetMin: 6, targetMax: 8, chip: null, plannedSets: 3, sets: [set60x6, set60x6],
  });
});

test('a second exercise joins the same day session, in the order first logged', async () => {
  await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 0);
  await appendSet(db, D, 'Dumbbell_Lunges', { weight: 12, reps: 10, seconds: null }, meta, 0);
  const h = await loadHistory(db);
  expect(h.sessions).toHaveLength(1);
  expect(h.sessions[0].exercises.map(x => x.exerciseId)).toEqual(['Barbell_Squat', 'Dumbbell_Lunges']);
});

test('an old focus row on the same date is left alone; tonight gets its own free row', async () => {
  await db.runAsync("INSERT INTO sessions (date, focus, intervals) VALUES (?, 'lower', 0)", D);
  await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 0);
  expect((await loadHistory(db)).sessions.map(s => s.focus)).toEqual(['lower', 'free']);
});

test('replaceSets swaps tonight sets and the planned meta', async () => {
  await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 0);
  const edited = [{ weight: 65, reps: 5, seconds: null }, { weight: 65, reps: 5, seconds: null }];
  await replaceSets(db, D, 'Barbell_Squat', edited, { ...meta, targetMin: 5 });
  const x = (await loadHistory(db)).sessions[0].exercises[0];
  expect(x.sets).toEqual(edited);
  expect(x.targetMin).toBe(5);
});

test('replaceSets with no sets removes the exercise', async () => {
  await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 0);
  await appendSet(db, D, 'Dumbbell_Lunges', set60x6, meta, 0);
  await replaceSets(db, D, 'Barbell_Squat', [], meta);
  expect((await loadHistory(db)).sessions[0].exercises.map(x => x.exerciseId)).toEqual(['Dumbbell_Lunges']);
});

test('removing the only exercise deletes the empty session row', async () => {
  await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 0);
  await removeExercise(db, D, 'Barbell_Squat');
  expect((await loadHistory(db)).sessions).toHaveLength(0);
  expect(await db.getFirstAsync('SELECT * FROM logged_sets')).toBeNull();
});

test('removing an exercise that was never logged is a no-op', async () => {
  await removeExercise(db, D, 'Barbell_Squat');
  expect((await loadHistory(db)).sessions).toHaveLength(0);
});

test('an interval log marks the day session intervals', async () => {
  await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 0);
  await appendSet(db, D, 'burpees', { weight: null, reps: 8, seconds: null }, { ...meta, intervals: true }, 0);
  expect((await loadHistory(db)).sessions[0].intervals).toBe(true);
});

test('sets carry the time they were logged; dayTimes gives each day its first and last set', async () => {
  await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 0, 1_000_000);
  await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 1, 1_000_000 + 34 * 60_000);
  await replaceSets(db, '2026-11-24', 'Leg_Press', [set60x6], meta, 5_000);
  expect(await dayTimes(db)).toEqual({
    [D]: { first: 1_000_000, last: 1_000_000 + 34 * 60_000 },
    '2026-11-24': { first: 5_000, last: 5_000 },
  });
});
