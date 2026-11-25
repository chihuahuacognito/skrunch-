import { INCREMENT_KG, lastLog, prescribeReps } from './prescribe';
import { BENCH, hist, logged } from './test-utils/fixtures';

test('main reps clamp into 5-12, accessories into 10-15', () => {
  expect(prescribeReps({ format: 'reps', min: 4, max: 8 }, 'main')).toEqual({ format: 'reps', min: 5, max: 8 });
  expect(prescribeReps({ format: 'reps', min: 6, max: 10 }, 'accessory')).toEqual({ format: 'reps', min: 10, max: 10 });
  expect(prescribeReps({ format: 'reps', min: 8, max: 12 }, 'accessory')).toEqual({ format: 'reps', min: 10, max: 12 });
  expect(prescribeReps({ format: 'reps', min: 12, max: 20 }, 'accessory')).toEqual({ format: 'reps', min: 12, max: 15 });
  expect(prescribeReps({ format: 'reps', min: 15, max: 20 }, 'main')).toEqual({ format: 'reps', min: 12, max: 12 });
  expect(prescribeReps({ format: 'hold', seconds: 30 }, 'main')).toEqual({ format: 'hold', seconds: 30 });
});

test('machines step by 5 kg, barbells by 2.5 kg', () => {
  expect(INCREMENT_KG.machine).toBe(5);
  expect(INCREMENT_KG.barbell).toBe(2.5);
});

test('lastLog returns the most recent logged entry with sets', () => {
  const h = hist([
    logged('2026-11-10', 'free', [[BENCH, 3]], { weight: 50 }),
    logged('2026-11-14', 'free', [[BENCH, 3]], { weight: 55 }),
    logged('2026-11-16', 'free', [[BENCH, 0]], { weight: 70 }),
  ]);
  expect(lastLog(BENCH, h)?.sets[0].weight).toBe(55);
  expect(lastLog('nope', h)).toBeNull();
});
