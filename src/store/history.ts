import type { Feedback, History, LoggedExercise, LoggedSet, SessionLog } from '../builder';
import { inTransaction, type SqlDb, type SqlParam } from './sql';

/** null clears the exercise's feedback. */
export async function setFeedback(db: SqlDb, exerciseId: string, value: Feedback | null): Promise<void> {
  if (value === null) await db.runAsync('DELETE FROM feedback WHERE exercise_id = ?', exerciseId);
  else await db.runAsync(
    'INSERT INTO feedback (exercise_id, value) VALUES (?, ?) ON CONFLICT(exercise_id) DO UPDATE SET value = excluded.value',
    exerciseId, value,
  );
}

const num = (v: unknown): SqlParam => {
  if (v === null || typeof v === 'number') return v;
  throw new TypeError(`expected a number or null, got ${JSON.stringify(v)}`);
};

/** Inserts one logged session; the caller owns the transaction. */
export async function insertSession(tx: SqlDb, log: SessionLog): Promise<void> {
  const { lastInsertRowId: sessionId } = await tx.runAsync(
    'INSERT INTO sessions (date, focus, intervals) VALUES (?, ?, ?)', log.date, log.focus, log.intervals ? 1 : 0,
  );
  for (const [i, ex] of log.exercises.entries()) {
    const { lastInsertRowId: exId } = await tx.runAsync(
      'INSERT INTO logged_exercises (session_id, position, exercise_id, target_min, target_max, chip, planned_sets) VALUES (?, ?, ?, ?, ?, ?, ?)',
      sessionId, i, ex.exerciseId, num(ex.targetMin), num(ex.targetMax), ex.chip, num(ex.plannedSets),
    );
    for (const [j, set] of ex.sets.entries()) {
      await tx.runAsync(
        'INSERT INTO logged_sets (logged_exercise_id, position, weight, reps, seconds) VALUES (?, ?, ?, ?, ?)',
        exId, j, num(set.weight), num(set.reps), num(set.seconds),
      );
    }
  }
}

/** Saves one logged session in a single transaction: a half-written session never appears. */
export async function saveSession(db: SqlDb, log: SessionLog): Promise<void> {
  await inTransaction(db, tx => insertSession(tx, log));
}

type SessionRow = { id: number; date: string; focus: SessionLog['focus']; intervals: number };
type ExerciseRow = { id: number; session_id: number; exercise_id: string; target_min: number | null; target_max: number | null; chip: LoggedExercise['chip']; planned_sets: number | null };
type SetRow = { logged_exercise_id: number; weight: number | null; reps: number | null; seconds: number | null };

/** Everything the builder reads: sessions by date then save order, feedback by exercise. */
export async function loadHistory(db: SqlDb): Promise<History> {
  const [sessionRows, exerciseRows, setRows, feedbackRows] = await Promise.all([
    db.getAllAsync<SessionRow>('SELECT id, date, focus, intervals FROM sessions ORDER BY date, id'),
    db.getAllAsync<ExerciseRow>('SELECT id, session_id, exercise_id, target_min, target_max, chip, planned_sets FROM logged_exercises ORDER BY session_id, position'),
    db.getAllAsync<SetRow>('SELECT logged_exercise_id, weight, reps, seconds FROM logged_sets ORDER BY logged_exercise_id, position'),
    db.getAllAsync<{ exercise_id: string; value: Feedback }>('SELECT exercise_id, value FROM feedback'),
  ]);

  const setsBy = new Map<number, LoggedSet[]>();
  for (const s of setRows) {
    const list = setsBy.get(s.logged_exercise_id) ?? [];
    list.push({ weight: s.weight, reps: s.reps, seconds: s.seconds });
    setsBy.set(s.logged_exercise_id, list);
  }
  const exercisesBy = new Map<number, LoggedExercise[]>();
  for (const e of exerciseRows) {
    const list = exercisesBy.get(e.session_id) ?? [];
    list.push({ exerciseId: e.exercise_id, targetMin: e.target_min, targetMax: e.target_max, chip: e.chip, plannedSets: e.planned_sets, sets: setsBy.get(e.id) ?? [] });
    exercisesBy.set(e.session_id, list);
  }

  return {
    sessions: sessionRows.map(s => ({ date: s.date, focus: s.focus, intervals: s.intervals === 1, exercises: exercisesBy.get(s.id) ?? [] })),
    feedback: Object.fromEntries(feedbackRows.map(f => [f.exercise_id, f.value])),
  };
}
