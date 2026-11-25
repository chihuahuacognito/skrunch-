import type { SessionLog } from '../builder';
import { loadHistory, saveSession, setFeedback } from './history';
import { migrate } from './schema';
import type { SqlDb } from './sql';
import { nodeDb } from './test-utils/nodeDb';

let db: SqlDb;
beforeEach(async () => {
  db = nodeDb();
  await migrate(db);
});

const session = (date: string, focus: SessionLog['focus'] = 'chest-back'): SessionLog => ({
  date,
  focus,
  intervals: true,
  exercises: [
    {
      exerciseId: 'Barbell_Bench_Press_-_Medium_Grip', targetMin: 6, targetMax: 10, chip: 'hard', plannedSets: 3,
      sets: [{ weight: 60, reps: 8, seconds: null }, { weight: 62.5, reps: 6, seconds: null }],
    },
    { exerciseId: 'Plank', targetMin: null, targetMax: null, chip: null, plannedSets: null, sets: [{ weight: null, reps: null, seconds: 30 }] },
  ],
});

test('migrate twice is a no-op', async () => {
  await migrate(db);
  expect(await loadHistory(db)).toEqual({ sessions: [], feedback: {} });
});

test('a saved session round-trips through loadHistory exactly', async () => {
  await saveSession(db, session('2026-11-22'));
  expect((await loadHistory(db)).sessions).toEqual([session('2026-11-22')]);
});

test('sessions come back in date order, same-date ones in save order', async () => {
  await saveSession(db, session('2026-11-22', 'lower'));
  await saveSession(db, session('2026-11-20', 'chest-back'));
  await saveSession(db, session('2026-11-22', 'mobility'));
  expect((await loadHistory(db)).sessions.map(s => `${s.date} ${s.focus}`)).toEqual([
    '2026-11-20 chest-back', '2026-11-22 lower', '2026-11-22 mobility',
  ]);
});

test('a session that fails to save leaves nothing behind', async () => {
  const bad = session('2026-11-22');
  (bad.exercises[1].sets[0] as { weight: unknown }).weight = { not: 'a number' };
  await expect(saveSession(db, bad)).rejects.toThrow();
  expect((await loadHistory(db)).sessions).toEqual([]);
});

test('feedback is set, replaced and cleared', async () => {
  await setFeedback(db, 'Plank', 'more');
  await setFeedback(db, 'Plank', 'never');
  expect((await loadHistory(db)).feedback).toEqual({ Plank: 'never' });
  await setFeedback(db, 'Plank', null);
  expect((await loadHistory(db)).feedback).toEqual({});
});

test('a failed session save leaves nothing behind', async () => {
  const bad = session('2026-11-22');
  (bad.exercises[0].sets[1] as { weight: unknown }).weight = '62.5';
  await expect(saveSession(db, bad)).rejects.toThrow(TypeError);
  expect((await loadHistory(db)).sessions).toEqual([]);
});

test('planned sets round-trip and old rows read as null', async () => {
  await saveSession(db, { date: '2026-11-25', focus: 'free', intervals: false, exercises: [
    { exerciseId: 'Barbell_Squat', targetMin: 5, targetMax: 8, chip: null, plannedSets: 3, sets: [{ weight: 60, reps: 6, seconds: null }] },
  ] });
  await db.runAsync("INSERT INTO sessions (date, focus, intervals) VALUES ('2026-11-20', 'lower', 0)");
  const id = (await db.getFirstAsync<{ id: number }>("SELECT id FROM sessions WHERE date = '2026-11-20'"))!.id;
  await db.runAsync("INSERT INTO logged_exercises (session_id, position, exercise_id) VALUES (?, 0, 'Plank')", id);
  const h = await loadHistory(db);
  expect(h.sessions.map(s => s.focus)).toEqual(['lower', 'free']);
  expect(h.sessions[0].exercises[0].plannedSets).toBeNull();
  expect(h.sessions[1].exercises[0].plannedSets).toBe(3);
  expect('checkIns' in h).toBe(false);
});

test('migrations leave user_version at 4 (v3 planned sets, v4 set times)', async () => {
  expect((await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version).toBe(4);
});
