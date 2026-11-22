import { BENCH, byId, lib, logged } from './test-utils/fixtures';
import { setCredit, weeklyVolume } from './volume';

test('bench press credits chest 1 and triceps 0.5, never frontDelts', () =>
  expect(setCredit(byId(BENCH))).toEqual({ chest: 1, triceps: 0.5 }));

test('overhead press credits frontDelts as primary', () =>
  expect(setCredit(byId('Standing_Military_Press')).frontDelts).toBe(1));

test('weekly volume counts the last 7 days including today', () => {
  const s = [
    logged('2026-11-15', 'chest-back', [[BENCH, 3]]),
    logged('2026-11-16', 'chest-back', [[BENCH, 3]]),
    logged('2026-11-22', 'chest-back', [[BENCH, 2]]),
  ];
  expect(weeklyVolume(lib, s, '2026-11-22').chest).toBe(5);
});

test('stretch and stability sets never count', () =>
  expect(weeklyVolume(lib, [logged('2026-11-22', 'mobility', [['Plank', 3], ['couch-stretch', 2]])], '2026-11-22').core).toBe(0));

test('unknown exercise ids in history are ignored', () =>
  expect(weeklyVolume(lib, [logged('2026-11-22', 'lower', [['Deleted_Lift', 4]])], '2026-11-22'))
    .toEqual(weeklyVolume(lib, [], '2026-11-22')));
