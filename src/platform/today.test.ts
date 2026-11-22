import { localToday } from './today';

test('localToday uses the local calendar date', () =>
  expect(localToday(new Date(2026, 10, 22, 19, 0))).toBe('2026-11-22'));

test('localToday keeps 00:30 on the previous day', () =>
  expect(localToday(new Date(2026, 10, 23, 0, 30))).toBe('2026-11-22'));

test('localToday starts the new day at 04:00', () =>
  expect(localToday(new Date(2026, 10, 23, 4, 0))).toBe('2026-11-23'));

test('localToday crosses month and year ends', () =>
  expect(localToday(new Date(2027, 0, 1, 1, 0))).toBe('2026-12-31'));
