import { emptyTonight, type TonightState } from '../tonight';
import type { SqlDb } from './sql';

// Tonight's UI state lives in the one active_workout row, rewritten after every change, so Android killing the app
// mid-rest loses nothing. Logged sets are never kept here.

export async function saveTonight(db: SqlDb, s: TonightState): Promise<void> {
  await db.runAsync(
    'INSERT INTO active_workout (id, date, state) VALUES (1, ?, ?) ON CONFLICT(id) DO UPDATE SET date = excluded.date, state = excluded.state',
    s.date, JSON.stringify(s),
  );
}

function parse(json: string): TonightState | null {
  try {
    const s = JSON.parse(json) as TonightState;
    return s?.version === 2 ? s : null;
  } catch {
    return null;
  }
}

/** Today's state. A row from another day, an older format or an unreadable row is deleted and a fresh state returned. */
export async function loadTonight(db: SqlDb, today: string): Promise<TonightState> {
  const row = await db.getFirstAsync<{ date: string; state: string }>('SELECT date, state FROM active_workout WHERE id = 1');
  if (!row) return emptyTonight(today);
  const s = parse(row.state);
  if (s && row.date === today && s.date === today) return s;
  await db.runAsync('DELETE FROM active_workout');
  return emptyTonight(today);
}
