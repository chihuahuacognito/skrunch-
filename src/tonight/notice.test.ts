import { restNotice } from './notice';
import { emptyTonight } from './reduce';
import type { TonightState } from './types';

const NAMES = new Map([['Barbell_Squat', 'Barbell Squat']]);
const E = 1_000_000;
const resting = (seconds: number, set = 1, of = 3): TonightState =>
  ({ ...emptyTonight('2026-11-25'), rest: { endsAt: E, seconds, exerciseId: 'Barbell_Squat', set, of } });

test('no notice without a rest or under 45 s', () => {
  expect(restNotice(emptyTonight('2026-11-25'), NAMES, () => '19:42', null)).toBeNull();
  expect(restNotice(resting(44), NAMES, () => '19:42', { reps: 6, weight: 60 })).toBeNull();
});

test('title shows the end clock; body names the exercise, next set and load', () => {
  expect(restNotice(resting(120), NAMES, () => '19:42', { reps: 6, weight: 60 }))
    .toEqual({ endsAt: E, title: 'Rest until 19:42', body: 'Next: Barbell Squat · set 2 · 60 kg × 6' });
});

test('bodyweight and unknown weights read as reps only', () => {
  expect(restNotice(resting(90), NAMES, () => '19:42', { reps: 12, weight: 0 })?.body).toBe('Next: Barbell Squat · set 2 · 12 reps');
  expect(restNotice(resting(90), NAMES, () => '19:42', { reps: 12, weight: null })?.body).toBe('Next: Barbell Squat · set 2 · 12 reps');
});

test('after the last set the body says the exercise is done', () => {
  expect(restNotice(resting(90, 3, 3), NAMES, () => '19:42', null)?.body).toBe('Barbell Squat done');
});
