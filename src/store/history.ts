import type { CheckIn, Feedback, History, LoggedExercise, LoggedSet, Place, SessionLog } from '../builder';
import type { SqlDb, SqlParam } from './sql';

export async function saveCheckIn(db: SqlDb, date: string, value: CheckIn, place: Place): Promise<void> {
  await db.runAsync(
    'INSERT INTO check_ins (date, value, place) VALUES (?, ?, ?) ON CONFLICT(date) DO UPDATE SET value = excluded.value, place = excluded.place',
    date, value, place,
  );
}

export async function checkInFor(db: SqlDb, date: string): Promise<{ value: CheckIn; place: Place } | null> {
  return db.getFirstAsync<{ value: CheckIn; place: Place }>('SELECT value, place FROM check_ins WHERE date = ?', date);
}

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

/** Saves one logged session in a single transaction: a half-written session never appears. */
export async function saveSession(db: SqlDb, log: SessionLog): Promise<void> {
  await db.execAsync('BEGIN');
  try {
    const { lastInsertRowId: sessionId } = await db.runAsync(
      'INSERT INTO sessions (date, focus, intervals) VALUES (?, ?, ?)', log.date, log.focus, log.intervals ? 1 : 0,
    );
    for (const [i, ex] of log.exercises.entries()) {
      const { lastInsertRowId: exId } = await db.runAsync(
        'INSERT INTO logged_exercises (session_id, position, exercise_id, target_min, target_max, chip) VALUES (?, ?, ?, ?, ?, ?)',
        sessionId, i, ex.exerciseId, num(ex.targetMin), num(ex.targetMax), ex.chip,
      );
      for (const [j, set] of ex.sets.entries()) {
        await db.runAsync(
          'INSERT INTO logged_sets (logged_exercise_id, position, weight, reps, seconds) VALUES (?, ?, ?, ?, ?)',
          exId, j, num(set.weight), num(set.reps), num(set.seconds),
        );
      }
    }
    await db.execAsync('COMMIT');
  } catch (e) {
    await db.execAsync('ROLLBACK');
    throw e;
  }
}

type SessionRow = { id: number; date: string; focus: SessionLog['focus']; intervals: number };
type ExerciseRow = { id: number; session_id: number; exercise_id: string; target_min: number | null; target_max: number | null; chip: LoggedExercise['chip'] };
type SetRow = { logged_exercise_id: number; weight: number | null; reps: number | null; seconds: number | null };

/** Everything the builder reads: sessions by date then save order, check-ins by date, feedback by exercise. */
export async function loadHistory(db: SqlDb): Promise<History> {
  const [sessionRows, exerciseRows, setRows, checkIns, feedbackRows] = await Promise.all([
    db.getAllAsync<SessionRow>('SELECT id, date, focus, intervals FROM sessions ORDER BY date, id'),
    db.getAllAsync<ExerciseRow>('SELECT id, session_id, exercise_id, target_min, target_max, chip FROM logged_exercises ORDER BY session_id, position'),
    db.getAllAsync<SetRow>('SELECT logged_exercise_id, weight, reps, seconds FROM logged_sets ORDER BY logged_exercise_id, position'),
    db.getAllAsync<{ date: string; value: CheckIn }>('SELECT date, value FROM check_ins ORDER BY date'),
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
    list.push({ exerciseId: e.exercise_id, targetMin: e.target_min, targetMax: e.target_max, chip: e.chip, sets: setsBy.get(e.id) ?? [] });
    exercisesBy.set(e.session_id, list);
  }

  return {
    sessions: sessionRows.map(s => ({ date: s.date, focus: s.focus, intervals: s.intervals === 1, exercises: exercisesBy.get(s.id) ?? [] })),
    checkIns: checkIns.map(c => ({ date: c.date, value: c.value })),
    feedback: Object.fromEntries(feedbackRows.map(f => [f.exercise_id, f.value])),
  };
}
