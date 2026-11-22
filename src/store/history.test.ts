import type { SessionLog } from '../builder';
import { checkInFor, loadHistory, saveCheckIn, saveSession, setFeedback } from './history';
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
      exerciseId: 'Barbell_Bench_Press_-_Medium_Grip', targetMin: 6, targetMax: 10, chip: 'hard',
      sets: [{ weight: 60, reps: 8, seconds: null }, { weight: 62.5, reps: 6, seconds: null }],
    },
    { exerciseId: 'Plank', targetMin: null, targetMax: null, chip: null, sets: [{ weight: null, reps: null, seconds: 30 }] },
  ],
});

test('migrate twice is a no-op', async () => {
  await migrate(db);
  expect(await loadHistory(db)).toEqual({ sessions: [], checkIns: [], feedback: {} });
});

test('a check-in saved today is read back, and saving again replaces it', async () => {
  await saveCheckIn(db, '2026-11-22', 'good', 'gym');
  expect(await checkInFor(db, '2026-11-22')).toEqual({ value: 'good', place: 'gym' });
  await saveCheckIn(db, '2026-11-22', 'wrecked', 'home');
  expect(await checkInFor(db, '2026-11-22')).toEqual({ value: 'wrecked', place: 'home' });
});

test('no check-in for a day reads as null', async () =>
  expect(await checkInFor(db, '2026-11-22')).toBeNull());

test('loadHistory lists check-ins by date', async () => {
  await saveCheckIn(db, '2026-11-22', 'ok', 'gym');
  await saveCheckIn(db, '2026-11-20', 'good', 'home');
  expect((await loadHistory(db)).checkIns).toEqual([
    { date: '2026-11-20', value: 'good' },
    { date: '2026-11-22', value: 'ok' },
  ]);
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
