import { toSessionLog, type WorkoutState } from '../workout';
import { insertSession } from './history';
import { inTransaction, type SqlDb } from './sql';

// The workout in progress lives in one row, rewritten after every change, so Android killing the app mid-rest loses
// nothing.

export async function saveDraft(db: SqlDb, state: WorkoutState): Promise<void> {
  await db.runAsync(
    'INSERT INTO active_workout (id, date, state) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET date = excluded.date, state = excluded.state',
    state.session.date, JSON.stringify(state),
  );
}

function parse(json: string): WorkoutState | null {
  try {
    const state = JSON.parse(json) as WorkoutState;
    return state?.version === 1 ? state : null;
  } catch {
    return null;
  }
}

/**
 * Today's workout in progress, or null. A draft from an earlier training day is never resumed: whatever was done is
 * saved as that day's session and the draft is dropped. A draft that cannot be read is dropped.
 */
export async function loadDraft(db: SqlDb, today: string): Promise<WorkoutState | null> {
  const row = await db.getFirstAsync<{ date: string; state: string }>('SELECT date, state FROM active_workout WHERE id = 1');
  if (!row) return null;
  const state = parse(row.state);
  if (state && row.date === today) return state;
  await inTransaction(db, async tx => {
    const log = state ? toSessionLog(state) : null;
    if (log) await insertSession(tx, log);
    await tx.runAsync('DELETE FROM active_workout');
  });
  return null;
}

/** Saves what was done and clears the draft, atomically. False when nothing was saved (or it was already completed). */
export async function completeWorkout(db: SqlDb, state: WorkoutState): Promise<boolean> {
  let saved = false;
  await inTransaction(db, async tx => {
    const { changes } = await tx.runAsync('DELETE FROM active_workout');
    const log = toSessionLog(state);
    if (changes === 0 || !log) return;
    await insertSession(tx, log);
    saved = true;
  });
  return saved;
}

export async function discardWorkout(db: SqlDb): Promise<void> {
  await db.runAsync('DELETE FROM active_workout');
}
