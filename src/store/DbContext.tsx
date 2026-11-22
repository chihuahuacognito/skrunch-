import { createContext, useContext, type ReactNode } from 'react';
import type { SQLiteDatabase } from 'expo-sqlite';
import type { SqlDb } from './sql';

// expo-sqlite's database must satisfy the app's interface; this line fails to compile if it ever stops.
const _expoFits: (d: SQLiteDatabase) => SqlDb = d => d;
void _expoFits;

const DbContext = createContext<SqlDb | null>(null);

export function DbProvider({ db, children }: { db: SqlDb; children: ReactNode }) {
  return <DbContext.Provider value={db}>{children}</DbContext.Provider>;
}

export function useDb(): SqlDb {
  const db = useContext(DbContext);
  if (!db) throw new Error('useDb must be used inside a DbProvider');
  return db;
}
