import { loadHistory } from '../store/history';
import type { SqlDb } from '../store/sql';

const pad = (n: number) => String(n).padStart(2, '0');
const localStamp = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

/**
 * Everything worth keeping, as readable JSON: logged sessions (with planned sets) and feedback. It is a backup
 * and can later feed a weekly review on the PC.
 */
export async function historyExport(db: SqlDb, now: Date): Promise<string> {
  const history = await loadHistory(db);
  return JSON.stringify(
    {
      format: 'workout-history',
      schema: 3,
      exportedAt: localStamp(now),
      feedback: history.feedback,
      sessions: history.sessions,
    },
    null,
    2,
  );
}

export function exportFileName(today: string): string {
  return `workout-history-${today}.json`;
}
