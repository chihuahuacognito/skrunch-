import type { LoggedSet } from '../builder';
import { inTransaction, type SqlDb } from './sql';

// Every done set is written the moment it happens, into the day's 'free' session row.

export interface LogMeta { plannedSets: number; targetMin: number | null; targetMax: number | null; intervals: boolean }

async function findDay(tx: SqlDb, date: string): Promise<number | null> {
  const row = await tx.getFirstAsync<{ id: number }>("SELECT id FROM sessions WHERE date = ? AND focus = 'free'", date);
  return row?.id ?? null;
}

async function daySession(tx: SqlDb, date: string, intervals: boolean): Promise<number> {
  const id = await findDay(tx, date);
  if (id !== null) {
    if (intervals) await tx.runAsync('UPDATE sessions SET intervals = 1 WHERE id = ?', id);
    return id;
  }
  const r = await tx.runAsync("INSERT INTO sessions (date, focus, intervals) VALUES (?, 'free', ?)", date, intervals ? 1 : 0);
  return r.lastInsertRowId;
}

async function exerciseRow(tx: SqlDb, sessionId: number, exerciseId: string, meta: LogMeta): Promise<number> {
  const row = await tx.getFirstAsync<{ id: number }>(
    'SELECT id FROM logged_exercises WHERE session_id = ? AND exercise_id = ?', sessionId, exerciseId,
  );
  if (row) {
    await tx.runAsync(
      'UPDATE logged_exercises SET planned_sets = ?, target_min = ?, target_max = ? WHERE id = ?',
      meta.plannedSets, meta.targetMin, meta.targetMax, row.id,
    );
    return row.id;
  }
  const pos = await tx.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM logged_exercises WHERE session_id = ?', sessionId);
  const r = await tx.runAsync(
    'INSERT INTO logged_exercises (session_id, position, exercise_id, target_min, target_max, chip, planned_sets) VALUES (?, ?, ?, ?, ?, NULL, ?)',
    sessionId, pos?.n ?? 0, exerciseId, meta.targetMin, meta.targetMax, meta.plannedSets,
  );
  return r.lastInsertRowId;
}

const insertSet = (tx: SqlDb, exId: number, position: number, s: LoggedSet) =>
  tx.runAsync(
    'INSERT INTO logged_sets (logged_exercise_id, position, weight, reps, seconds) VALUES (?, ?, ?, ?, ?)',
    exId, position, s.weight, s.reps, s.seconds,
  );

async function setCount(tx: SqlDb, date: string, exerciseId: string): Promise<number> {
  const row = await tx.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM logged_sets s JOIN logged_exercises x ON x.id = s.logged_exercise_id ' +
    "JOIN sessions d ON d.id = x.session_id WHERE d.date = ? AND d.focus = 'free' AND x.exercise_id = ?",
    date, exerciseId,
  );
  return row?.n ?? 0;
}

/** Logs set number `index` (0-based) of tonight's exercise. False, and nothing written, unless it is the next open set. */
export async function appendSet(db: SqlDb, date: string, exerciseId: string, set: LoggedSet, meta: LogMeta, index: number): Promise<boolean> {
  let written = false;
  await inTransaction(db, async tx => {
    if ((await setCount(tx, date, exerciseId)) !== index) return;
    const exId = await exerciseRow(tx, await daySession(tx, date, meta.intervals), exerciseId, meta);
    await insertSet(tx, exId, index, set);
    written = true;
  });
  return written;
}

async function remove(tx: SqlDb, date: string, exerciseId: string): Promise<void> {
  const sessionId = await findDay(tx, date);
  if (sessionId === null) return;
  const ex = await tx.getFirstAsync<{ id: number }>(
    'SELECT id FROM logged_exercises WHERE session_id = ? AND exercise_id = ?', sessionId, exerciseId,
  );
  if (ex) {
    await tx.runAsync('DELETE FROM logged_sets WHERE logged_exercise_id = ?', ex.id);
    await tx.runAsync('DELETE FROM logged_exercises WHERE id = ?', ex.id);
  }
  const left = await tx.getFirstAsync<{ n: number }>('SELECT COUNT(*) AS n FROM logged_exercises WHERE session_id = ?', sessionId);
  if ((left?.n ?? 0) === 0) await tx.runAsync('DELETE FROM sessions WHERE id = ?', sessionId);
}

/** Replaces tonight's sets of one exercise (Edit). No sets removes the exercise. */
export async function replaceSets(db: SqlDb, date: string, exerciseId: string, sets: LoggedSet[], meta: LogMeta): Promise<void> {
  await inTransaction(db, async tx => {
    if (sets.length === 0) {
      await remove(tx, date, exerciseId);
      return;
    }
    const exId = await exerciseRow(tx, await daySession(tx, date, meta.intervals), exerciseId, meta);
    await tx.runAsync('DELETE FROM logged_sets WHERE logged_exercise_id = ?', exId);
    for (const [i, s] of sets.entries()) await insertSet(tx, exId, i, s);
  });
}

/** Undo: tonight's sets of one exercise go, and the day's session row goes with its last exercise. */
export async function removeExercise(db: SqlDb, date: string, exerciseId: string): Promise<void> {
  await inTransaction(db, tx => remove(tx, date, exerciseId));
}
