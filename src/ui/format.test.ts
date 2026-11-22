import { blockTitle, doseText, parseOption, weightText } from './format';

test('reps dose text', () => {
  expect(doseText(3, { format: 'reps', min: 6, max: 10 })).toBe('3 × 6-10');
  expect(doseText(3, { format: 'reps', min: 8, max: 8 })).toBe('3 × 8');
});

test('hold and duration dose text', () => {
  expect(doseText(2, { format: 'hold', seconds: 30 })).toBe('2 × 30 s');
  expect(doseText(1, { format: 'hold', seconds: 30 })).toBe('30 s');
  expect(doseText(1, { format: 'duration', minutes: 8 })).toBe('8 min');
  expect(doseText(2, { format: 'duration', minutes: 4 })).toBe('2 × 4 min');
});

test('parseOption accepts known focus and dose only', () => {
  expect(parseOption('lower', 'full')).toEqual({ focus: 'lower', dose: 'full' });
  expect(parseOption('legs', 'full')).toBeNull();
  expect(parseOption('lower', 'max')).toBeNull();
  expect(parseOption(['lower'], 'full')).toBeNull();
  expect(parseOption(undefined, undefined)).toBeNull();
  expect(parseOption('desk-reset', 'full')).toBeNull();
});

test('block titles', () => {
  expect(blockTitle('warmup')).toBe('Warm-up');
  expect(blockTitle('main')).toBe('Main lift');
  expect(blockTitle('zone2')).toBe('Zone 2');
  expect(blockTitle('cooldown')).toBe('Cool-down');
});

test('weight text', () => {
  expect(weightText(60)).toBe('60 kg');
  expect(weightText(62.5)).toBe('62.5 kg');
  expect(weightText(0)).toBe('Bodyweight');
  expect(weightText(null)).toBeNull();
});
