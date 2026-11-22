import { addDays, daysBetween } from './dates';

test('daysBetween crosses month and year ends', () => {
  expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
  expect(daysBetween('2026-11-22', '2026-11-15')).toBe(-7);
  expect(addDays('2026-02-27', 2)).toBe('2026-03-01');
});
