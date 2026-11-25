import { trainingDaysList } from './days';
import { hist, lib, logged } from './test-utils/fixtures';
import type { GroupInput, SessionLog } from './types';

const input = (sessions: SessionLog[]): GroupInput => ({ library: lib, history: hist(sessions), today: '2026-11-25' });

test('days merge old focus rows with the free row, newest first, and skip empty days', () => {
  const days = trainingDaysList(input([
    logged('2026-11-20', 'lower', [['Barbell_Squat', 3]]),
    logged('2026-11-25', 'free', [['Barbell_Squat', 2]]),
    logged('2026-11-25', 'lower', [['Romanian_Deadlift', 3]]),
    logged('2026-11-22', 'free', [['Barbell_Squat', 0]]),
  ]));
  expect(days.map(d => d.date)).toEqual(['2026-11-25', '2026-11-20']);
  expect(days[0]).toMatchObject({ sets: 5, groups: ['quads', 'hamstrings'] });
  expect(days[0].exercises.map(x => x.exerciseId)).toEqual(['Barbell_Squat', 'Romanian_Deadlift']);
});

test('conditioning-only days list no groups but keep their sets', () => {
  const days = trainingDaysList(input([logged('2026-11-24', 'free', [['Walking_Treadmill', 1]])]));
  expect(days).toEqual([{ date: '2026-11-24', groups: [], sets: 1, exercises: [{ exerciseId: 'Walking_Treadmill', sets: expect.any(Array) }] }]);
});
