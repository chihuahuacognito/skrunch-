import type { Dose } from '../library/types';
import { estimateMinutes } from './estimate';
import type { PlannedExercise } from './types';

const reps = (min: number, max: number): Dose => ({ format: 'reps', min, max });
const item = (over: Partial<PlannedExercise>): PlannedExercise =>
  ({ exerciseId: 'x', slot: null, sets: 1, dose: reps(8, 10), rir: null, restSeconds: 0, weight: null, progressed: false, ...over });

test('estimate sums sets, work and rest, supersets per round', () =>
  expect(estimateMinutes([
    { kind: 'main', items: [item({ sets: 3, dose: reps(6, 10), restSeconds: 150 })] }, // 3 * 195 = 585 s
    { kind: 'superset', items: [item({ sets: 3, dose: reps(10, 15), restSeconds: 0 }), item({ sets: 3, dose: reps(10, 15), restSeconds: 75 })] }, // 3 * 165 = 495 s
  ])).toBe(18));

test('holds and durations use their own time', () =>
  expect(estimateMinutes([
    { kind: 'cooldown', items: [item({ sets: 2, dose: { format: 'hold', seconds: 30 }, restSeconds: 15 })] }, // 90 s
    { kind: 'finisher', items: [item({ sets: 1, dose: { format: 'duration', minutes: 8 } })] }, // 480 s
  ])).toBe(10));
