import type { Target } from '../../builder';
import { doneText, lastText, setText, targetText } from './text';

const t = (over: Partial<Target>): Target =>
  ({ sets: 3, reps: 6, minutes: null, weight: 60, restSeconds: 120, range: [5, 8], needsWeight: false, ...over });

test('target text', () => {
  expect(targetText(t({}))).toBe('3 × 6 @ 60 kg');
  expect(targetText(t({ weight: 0, reps: 12 }))).toBe('3 × 12');
  expect(targetText(t({ weight: null, reps: 5, needsWeight: true }))).toBe('3 × 5 · set weight');
  expect(targetText(t({ sets: 1, reps: null, minutes: 25, weight: null }))).toBe('25 min');
  expect(targetText(t({ sets: 4, reps: 8, weight: null }))).toBe('4 × 8');
});

test('set, done and last text', () => {
  expect(setText({ weight: 60, reps: 8, seconds: null })).toBe('60 kg × 8');
  expect(setText({ weight: 0, reps: 12, seconds: null })).toBe('12 reps');
  expect(setText({ weight: null, reps: null, seconds: 1500 })).toBe('25 min');
  expect(doneText([{ weight: 60, reps: 6, seconds: null }, { weight: 60, reps: 6, seconds: null }])).toBe('2 × 6 @ 60 kg');
  expect(lastText({ days: 9, sets: [{ weight: 60, reps: 8, seconds: null }] })).toBe('Last: 9 days ago · 60 kg × 8');
  expect(lastText({ days: 1, sets: [{ weight: 0, reps: 12, seconds: null }] })).toBe('Last: yesterday · 12 reps');
  expect(lastText(null)).toBe('Never done');
});
