import type { SqlDb } from './sql';

/** Ordered migrations; index + 1 is the schema version stored in PRAGMA user_version. */
const MIGRATIONS: string[] = [
  `CREATE TABLE check_ins (date TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, place TEXT NOT NULL);
   CREATE TABLE feedback (exercise_id TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);
   CREATE TABLE sessions (id INTEGER PRIMARY KEY, date TEXT NOT NULL, focus TEXT NOT NULL, intervals INTEGER NOT NULL);
   CREATE TABLE logged_exercises (
     id INTEGER PRIMARY KEY, session_id INTEGER NOT NULL REFERENCES sessions(id), position INTEGER NOT NULL,
     exercise_id TEXT NOT NULL, target_min INTEGER, target_max INTEGER, chip TEXT);
   CREATE TABLE logged_sets (
     logged_exercise_id INTEGER NOT NULL REFERENCES logged_exercises(id), position INTEGER NOT NULL,
     weight REAL, reps INTEGER, seconds INTEGER);
   CREATE INDEX logged_exercises_session ON logged_exercises(session_id);
   CREATE INDEX logged_sets_exercise ON logged_sets(logged_exercise_id);`,
];

/** Brings the database up to the latest schema. Safe to run on every launch. */
export async function migrate(db: SqlDb): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  for (let v = current; v < MIGRATIONS.length; v++) {
    await db.execAsync(`BEGIN; ${MIGRATIONS[v]} PRAGMA user_version = ${v + 1}; COMMIT;`);
  }
}
