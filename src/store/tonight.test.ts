import { emptyTonight } from '../tonight';
import { migrate } from './schema';
import type { SqlDb } from './sql';
import { nodeDb } from './test-utils/nodeDb';
import { loadTonight, saveTonight } from './tonight';

let db: SqlDb;
beforeEach(async () => {
  db = nodeDb();
  await migrate(db);
});

test('a saved state reloads on the same day', async () => {
  const s = { ...emptyTonight('2026-11-25'), opened: ['quads' as const], lastGroup: 'quads' as const, lastActionAt: 5 };
  await saveTonight(db, s);
  expect(await loadTonight(db, '2026-11-25')).toEqual(s);
});

test('no row reads as an empty state for today', async () => {
  expect(await loadTonight(db, '2026-11-25')).toEqual(emptyTonight('2026-11-25'));
});

test('a state from yesterday is dropped and an empty one returned', async () => {
  await saveTonight(db, { ...emptyTonight('2026-11-24'), opened: ['quads'] });
  expect(await loadTonight(db, '2026-11-25')).toEqual(emptyTonight('2026-11-25'));
  expect(await db.getFirstAsync('SELECT * FROM active_workout')).toBeNull();
});

test('a version 1 Plan 4 draft is dropped, never parsed as tonight', async () => {
  await db.runAsync("INSERT INTO active_workout (id, date, state) VALUES (1, '2026-11-25', ?)", JSON.stringify({ version: 1, step: 0 }));
  expect(await loadTonight(db, '2026-11-25')).toEqual(emptyTonight('2026-11-25'));
  expect(await db.getFirstAsync('SELECT * FROM active_workout')).toBeNull();
});

test('an unreadable row is dropped', async () => {
  await db.runAsync("INSERT INTO active_workout (id, date, state) VALUES (1, '2026-11-25', 'not json')");
  expect(await loadTonight(db, '2026-11-25')).toEqual(emptyTonight('2026-11-25'));
});
