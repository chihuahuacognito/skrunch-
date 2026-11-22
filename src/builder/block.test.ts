import { blockState } from './block';
import { weeklyTargets } from './budget';
import { addDays } from './dates';
import { BENCH, emptyHistory, hist, logged } from './test-utils/fixtures';
import type { History } from './types';

const h = (dates: string[]): History => hist(dates.map(d => logged(d, 'chest-back', [[BENCH, 3]])));
const weekly = (start: string, n: number): History => h(Array.from({ length: n }, (_, i) => addDays(start, i * 7)));

test('empty history is week 1 calibration', () =>
  expect(blockState(emptyHistory(), '2026-11-22')).toEqual({ week: 1, deload: false, calibration: true }));

test('the first week of the first block is calibration', () =>
  expect(blockState(h(['2026-11-01']), '2026-11-04')).toEqual({ week: 1, deload: false, calibration: true }));

test('day 10 of a block is week 2', () =>
  expect(blockState(h(['2026-11-01', '2026-11-09']), '2026-11-11')).toMatchObject({ week: 2, calibration: false }));

test('week 6 is the deload', () =>
  expect(blockState(weekly('2026-11-01', 6), '2026-12-06').deload).toBe(true));

test('the week after a deload is week 1 of a new block, not calibration', () =>
  expect(blockState(weekly('2026-11-01', 7), '2026-12-13')).toEqual({ week: 1, deload: false, calibration: false }));

test('three wrecked check-ins in week 2 make week 3 the deload', () => {
  const hw: History = {
    ...weekly('2026-11-01', 3),
    checkIns: ['2026-11-08', '2026-11-10', '2026-11-12'].map(date => ({ date, value: 'wrecked' as const })),
  };
  expect(blockState(hw, '2026-11-16')).toMatchObject({ week: 3, deload: true });
});

test('a 14 day gap restarts the block in calibration', () =>
  expect(blockState(weekly('2026-09-01', 5), '2026-11-22')).toEqual({ week: 1, deload: false, calibration: true }));

test('weeklyTargets ramps from the low end and caps at the high end', () => {
  expect(weeklyTargets(1, false).chest).toBe(12);
  expect(weeklyTargets(5, false).lats).toBe(10);
  expect(weeklyTargets(3, true).chest).toBe(6);
  expect(weeklyTargets(5, false).frontDelts).toBe(4);
});
