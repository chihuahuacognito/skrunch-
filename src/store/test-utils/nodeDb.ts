/// <reference types="node" />
// A real in-memory SQLite (Node's built-in node:sqlite) behind the app's SqlDb interface, so storage
// tests run real SQL with no mocks.
import type { SqlDb, SqlParam } from '../sql';

export function nodeDb(): SqlDb {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { DatabaseSync } = require('node:sqlite') as typeof import('node:sqlite');
  const db = new DatabaseSync(':memory:');
  const plain = <T>(row: unknown) => ({ ...(row as object) }) as T;
  return {
    async execAsync(sql: string) {
      db.exec(sql);
    },
    async runAsync(sql: string, ...params: SqlParam[]) {
      const r = db.prepare(sql).run(...params);
      return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) };
    },
    async getAllAsync<T>(sql: string, ...params: SqlParam[]) {
      return db.prepare(sql).all(...params).map(r => plain<T>(r));
    },
    async getFirstAsync<T>(sql: string, ...params: SqlParam[]) {
      const r = db.prepare(sql).get(...params);
      return r === undefined ? null : plain<T>(r);
    },
  };
}
