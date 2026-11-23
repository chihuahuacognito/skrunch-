// The subset of expo-sqlite's SQLiteDatabase the app uses. Tests back it with node:sqlite.
export type SqlParam = string | number | null;

export interface SqlDb {
  execAsync(sql: string): Promise<void>;
  runAsync(sql: string, ...params: SqlParam[]): Promise<{ lastInsertRowId: number; changes: number }>;
  getAllAsync<T>(sql: string, ...params: SqlParam[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, ...params: SqlParam[]): Promise<T | null>;
  /** expo-sqlite only: runs the task on its own connection so no other query can slip into the transaction. */
  withExclusiveTransactionAsync?(task: (txn: SqlDb) => Promise<void>): Promise<void>;
}

/** Runs the task atomically: everything it writes lands, or nothing does. */
export async function inTransaction(db: SqlDb, task: (tx: SqlDb) => Promise<void>): Promise<void> {
  if (db.withExclusiveTransactionAsync) {
    await db.withExclusiveTransactionAsync(task);
    return;
  }
  await db.execAsync('BEGIN');
  try {
    await task(db);
    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}
