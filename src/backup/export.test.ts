import { loadHistory, saveCheckIn, saveSession, setFeedback } from '../store/history';
import { migrate } from '../store/schema';
import type { SqlDb } from '../store/sql';
import { nodeDb } from '../store/test-utils/nodeDb';
import { exportFileName, historyExport } from './export';

let db: SqlDb;
beforeEach(async () => {
  db = nodeDb();
  await migrate(db);
});

test('the export carries sessions, check-ins with place and feedback', async () => {
  await saveCheckIn(db, '2026-11-22', 'good', 'gym');
  await saveSession(db, {
    date: '2026-11-22', focus: 'lower', intervals: false,
    exercises: [{ exerciseId: 'Leg_Press', targetMin: 8, targetMax: 12, chip: 'right', sets: [{ weight: 100, reps: 10, seconds: null }] }],
  });
  await setFeedback(db, 'Leg_Press', 'more');
  const out = JSON.parse(await historyExport(db, new Date(2026, 10, 23, 21, 5)));
  expect(out).toEqual({
    format: 'workout-history',
    schema: 2,
    exportedAt: '2026-11-23T21:05',
    checkIns: [{ date: '2026-11-22', value: 'good', place: 'gym' }],
    feedback: { Leg_Press: 'more' },
    sessions: (await loadHistory(db)).sessions,
  });
});

test('an empty database exports empty lists', async () => {
  const out = JSON.parse(await historyExport(db, new Date(2026, 0, 2, 7, 9)));
  expect(out).toMatchObject({ exportedAt: '2026-01-02T07:09', checkIns: [], feedback: {}, sessions: [] });
});

test('the export is indented for reading', async () => {
  expect(await historyExport(db, new Date(2026, 10, 23))).toContain('\n  "format": "workout-history"');
});

test('the file name uses the training day', () => {
  expect(exportFileName('2026-11-23')).toBe('workout-history-2026-11-23.json');
});
