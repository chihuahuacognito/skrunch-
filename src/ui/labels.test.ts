import { agoText, dayLabel, setsText, weekRangeLabel } from './labels';

test('day label', () => expect(dayLabel('2026-11-25')).toBe('Wed 25 Nov'));

test('the rolling week drops the first month when both ends share it', () => {
  expect(weekRangeLabel('2026-11-25')).toBe('Thu 19 - Wed 25 Nov');
  expect(weekRangeLabel('2026-12-03')).toBe('Fri 27 Nov - Thu 3 Dec');
});

test('ago text: Today, Nd ago, Never', () => {
  expect([0, 1, 5, null].map(agoText)).toEqual(['Today', '1d ago', '5d ago', 'Never']);
});

test('sets text keeps a half set and drops .0', () => {
  expect([0, 3, 1.5, 7.5].map(setsText)).toEqual(['0', '3', '1.5', '7.5']);
});
