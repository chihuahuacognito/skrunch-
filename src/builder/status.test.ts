import { cardioWeek, groupStatus, recencyOf, tonightSummary } from './status';
import { hist, lib, logged } from './test-utils/fixtures';
import type { GroupInput, SessionLog } from './types';

const TODAY = '2026-11-25';
const input = (sessions: SessionLog[]): GroupInput => ({ library: lib, history: hist(sessions), today: TODAY });
const minutes = (date: string, id: string, min: number, intervals = false): SessionLog => ({
  date, focus: 'free', intervals,
  exercises: [{ exerciseId: id, targetMin: null, targetMax: null, chip: null, plannedSets: 1, sets: [{ weight: null, reps: null, seconds: min * 60 }] }],
});

test('recency, sets and BEHIND for quads and glutes after one squat day', () => {
  const s = groupStatus(input([logged('2026-11-20', 'free', [['Barbell_Squat', 3]])]));
  expect(s.quads).toEqual({ lastWorked: '2026-11-20', daysSince: 5, recency: 'rested', sets: 3, target: 8, behind: true });
  expect(s.glutes).toMatchObject({ lastWorked: '2026-11-20', sets: 1.5, target: 6, behind: true });
  expect(s.chest).toEqual({ lastWorked: null, daysSince: null, recency: 'never', sets: 0, target: 12, behind: true });
  expect(s.calves).toMatchObject({ recency: 'never', sets: 0, target: 6, behind: false });
});

test('a day under 1.5 credit does not count as worked', () => {
  const s = groupStatus(input([logged('2026-11-24', 'free', [['Barbell_Squat', 2]])]));
  expect(s.glutes).toMatchObject({ lastWorked: null, recency: 'never', sets: 1 });
  expect(s.quads).toMatchObject({ lastWorked: '2026-11-24', recency: 'just' });
});

test('half the target is not behind', () => {
  const s = groupStatus(input([logged('2026-11-24', 'free', [['Barbell_Squat', 4]])]));
  expect(s.quads).toMatchObject({ sets: 4, target: 8, behind: false });
});

test('recency thresholds 0-1 just, 2-4 recovering, 5+ rested, null never', () => {
  expect([0, 1, 2, 4, 5, 30, null].map(recencyOf)).toEqual(['just', 'just', 'recovering', 'recovering', 'rested', 'rested', 'never']);
});

test('sets older than 6 days drop out of the rolling week but last worked remains', () => {
  const s = groupStatus(input([logged('2026-11-18', 'free', [['Barbell_Squat', 3]])]));
  expect(s.quads).toMatchObject({ lastWorked: '2026-11-18', daysSince: 7, sets: 0 });
  const edge = groupStatus(input([logged('2026-11-19', 'free', [['Barbell_Squat', 3]])]));
  expect(edge.quads.sets).toBe(3);
});

test('sessions after today are ignored', () => {
  expect(groupStatus(input([logged('2026-11-26', 'free', [['Barbell_Squat', 3]])])).quads).toMatchObject({ lastWorked: null, sets: 0 });
});

test('cardio week sums Zone 2 minutes and counts interval days', () => {
  const s = input([
    minutes('2026-11-24', 'Walking_Treadmill', 25),
    minutes('2026-11-23', 'Battling_Ropes', 5, true),
    minutes('2026-11-10', 'Walking_Treadmill', 40),
  ]);
  expect(cardioWeek(s)).toEqual({ zone2Minutes: 25, zone2Target: 150, intervalDays: 1, intervalCap: 2 });
});

test('tonight summary counts logged sets today and the groups they touched', () => {
  const s = input([
    logged(TODAY, 'free', [['Barbell_Squat', 2]]),
    logged('2026-11-24', 'free', [['Barbell_Bench_Press_-_Medium_Grip', 3]]),
  ]);
  expect(tonightSummary(s)).toEqual({ groups: ['quads'], sets: 2 });
  expect(tonightSummary(input([]))).toEqual({ groups: [], sets: 0 });
});
