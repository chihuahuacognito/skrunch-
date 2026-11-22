import { unrecovered } from './recovery';
import { BENCH, lib, logged } from './test-utils/fixtures';

test('chest trained yesterday is unrecovered, two days ago is recovered', () => {
  expect(unrecovered(lib, [logged('2026-11-21', 'chest-back', [[BENCH, 3]])], '2026-11-22').has('chest')).toBe(true);
  expect(unrecovered(lib, [logged('2026-11-20', 'chest-back', [[BENCH, 3]])], '2026-11-22').has('chest')).toBe(false);
});

test('legs need 72 hours after a Lower session but 48 after Full Body', () => {
  expect(unrecovered(lib, [logged('2026-11-20', 'lower', [['Barbell_Squat', 3]])], '2026-11-22').has('quads')).toBe(true);
  expect(unrecovered(lib, [logged('2026-11-20', 'full-body', [['Barbell_Squat', 3]])], '2026-11-22').has('quads')).toBe(false);
});

test('a session logged today blocks the same muscles', () =>
  expect(unrecovered(lib, [logged('2026-11-22', 'chest-back', [[BENCH, 3]])], '2026-11-22').has('chest')).toBe(true));

test('secondary-only work does not block a muscle', () =>
  expect(unrecovered(lib, [logged('2026-11-22', 'chest-back', [[BENCH, 3]])], '2026-11-22').has('triceps')).toBe(false));
