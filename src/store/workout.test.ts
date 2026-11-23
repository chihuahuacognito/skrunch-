import { buildSession } from '../builder';
import { emptyHistory, lib } from '../builder/test-utils/fixtures';
import { reduceWorkout, startWorkout, type WorkoutState } from '../workout';
import { loadHistory, saveSession } from './history';
import { migrate, MIGRATIONS } from './schema';
import { getSetting, setSetting } from './settings';
import type { SqlDb } from './sql';
import { nodeDb } from './test-utils/nodeDb';
import { completeWorkout, discardWorkout, loadDraft, saveDraft } from './workout';

let db: SqlDb;
beforeEach(async () => {
  db = nodeDb();
  await migrate(db);
});

const fresh = (today = '2026-11-22'): WorkoutState => {
  const s = buildSession({ library: lib, history: emptyHistory(), today, checkIn: 'good', place: 'gym' }, { focus: 'chest-back', dose: 'full' });
  return startWorkout(s, lib, emptyHistory(), 1000);
};
/** The first warm-up item ticked (no weight needed), so there is something to save. */
const ticked = (today?: string) => reduceWorkout(fresh(today), { type: 'tick', ref: { block: 0, item: 0 }, set: 0, now: 2000 });

test('migrating a v1 database adds the draft and settings tables and keeps its history', async () => {
  const old = nodeDb();
  await old.execAsync(`BEGIN; ${MIGRATIONS[0]} PRAGMA user_version = 1; COMMIT;`);
  await saveSession(old, { date: '2026-11-20', focus: 'lower', intervals: false, exercises: [] });
  const before = await loadHistory(old);
  await migrate(old);
  expect(await loadHistory(old)).toEqual(before);
  expect(await old.getFirstAsync<{ user_version: number }>('PRAGMA user_version')).toEqual({ user_version: 2 });
  await saveDraft(old, ticked());
  await setSetting(old, 'k', 'v');
});

test('a draft round-trips exactly', async () => {
  const w = reduceWorkout(ticked(), { type: 'chip', ref: { block: 0, item: 0 }, chip: 'easy' });
  await saveDraft(db, w);
  expect(await loadDraft(db, '2026-11-22')).toEqual(w);
});

test('saving a draft again replaces it', async () => {
  await saveDraft(db, fresh());
  await saveDraft(db, ticked());
  expect(await loadDraft(db, '2026-11-22')).toEqual(ticked());
  expect(await db.getAllAsync('SELECT id FROM active_workout')).toHaveLength(1);
});

test('no draft reads as null', async () => {
  expect(await loadDraft(db, '2026-11-22')).toBeNull();
});

test('a stale draft is saved under its own date and cleared', async () => {
  await saveDraft(db, ticked('2026-11-22'));
  expect(await loadDraft(db, '2026-11-23')).toBeNull();
  const { sessions } = await loadHistory(db);
  expect(sessions).toHaveLength(1);
  expect(sessions[0].date).toBe('2026-11-22');
  expect(await db.getAllAsync('SELECT id FROM active_workout')).toHaveLength(0);
});

test('a stale draft with nothing done is dropped', async () => {
  await saveDraft(db, fresh('2026-11-22'));
  expect(await loadDraft(db, '2026-11-23')).toBeNull();
  expect((await loadHistory(db)).sessions).toHaveLength(0);
  expect(await db.getAllAsync('SELECT id FROM active_workout')).toHaveLength(0);
});

test('a corrupt draft reads as no draft', async () => {
  await saveDraft(db, ticked());
  await db.runAsync("UPDATE active_workout SET state = '{'");
  expect(await loadDraft(db, '2026-11-22')).toBeNull();
  expect(await db.getAllAsync('SELECT id FROM active_workout')).toHaveLength(0);
});

test('a draft from another app version reads as no draft', async () => {
  await saveDraft(db, { ...ticked(), version: 2 } as unknown as WorkoutState);
  expect(await loadDraft(db, '2026-11-22')).toBeNull();
});

test('completing saves the session and clears the draft once', async () => {
  const w = ticked();
  await saveDraft(db, w);
  expect(await completeWorkout(db, w)).toBe(true);
  expect(await completeWorkout(db, w)).toBe(false);
  expect((await loadHistory(db)).sessions).toHaveLength(1);
  expect(await loadDraft(db, '2026-11-22')).toBeNull();
});

test('completing with nothing done saves nothing', async () => {
  const w = fresh();
  await saveDraft(db, w);
  expect(await completeWorkout(db, w)).toBe(false);
  expect((await loadHistory(db)).sessions).toHaveLength(0);
  expect(await loadDraft(db, '2026-11-22')).toBeNull();
});

test('discarding drops the draft and saves nothing', async () => {
  await saveDraft(db, ticked());
  await discardWorkout(db);
  expect(await loadDraft(db, '2026-11-22')).toBeNull();
  expect((await loadHistory(db)).sessions).toHaveLength(0);
});

test('settings are stored and replaced', async () => {
  expect(await getSetting(db, 'backup_dir')).toBeNull();
  await setSetting(db, 'backup_dir', 'a');
  await setSetting(db, 'backup_dir', 'b');
  expect(await getSetting(db, 'backup_dir')).toBe('b');
});
