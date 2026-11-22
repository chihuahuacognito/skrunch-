import type { Exercise } from './types';
import { validateLibrary } from './validate';

const ok = (): Exercise => ({
  id: 'Barbell_Bench_Press',
  name: 'Barbell Bench Press',
  source: 'fedb',
  type: 'strength',
  pattern: 'push-horizontal',
  muscles: ['chest', 'triceps', 'shoulders'],
  primary: ['chest'],
  secondary: ['triceps', 'frontDelts'],
  equipment: ['barbell', 'bench'],
  location: ['gym'],
  position: 'floor',
  dose: { format: 'reps', min: 6, max: 10 },
  impact: null,
  mechanic: 'compound',
  purposes: [],
  instructions: ['Lie on the bench.', 'Press the bar up.'],
  images: [],
  sourceUrl: null,
});

test('valid exercise passes', () => expect(validateLibrary([ok()])).toEqual([]));

test('validateLibrary flags duplicate ids', () =>
  expect(validateLibrary([ok(), ok()]).join()).toMatch(/duplicate id/));

test('validateLibrary flags budget muscles on non-strength', () =>
  expect(validateLibrary([{ ...ok(), type: 'stretch' }]).join()).toMatch(/budget muscles.*strength/));

test('stability never counts toward core', () =>
  expect(validateLibrary([{ ...ok(), type: 'stability', primary: [], secondary: ['core'] }]).join()).toMatch(/budget muscles/));

test('unknown vocabulary values are flagged', () => {
  const bad = { ...ok(), muscles: ['pecs'] } as unknown as Exercise;
  expect(validateLibrary([bad]).join()).toMatch(/unknown muscle "pecs"/);
});

test('strength needs a primary muscle and a reps dose', () => {
  expect(validateLibrary([{ ...ok(), primary: [] }]).join()).toMatch(/primary/);
  expect(validateLibrary([{ ...ok(), dose: { format: 'hold', seconds: 30 } }]).join()).toMatch(/reps/);
});

test('impact only on conditioning', () =>
  expect(validateLibrary([{ ...ok(), impact: 'low' }]).join()).toMatch(/impact/));

test('reps range must be ordered and positive', () =>
  expect(validateLibrary([{ ...ok(), dose: { format: 'reps', min: 12, max: 8 } }]).join()).toMatch(/reps range/));

test('no em dash anywhere in text fields', () =>
  expect(validateLibrary([{ ...ok(), name: 'Bench — flat' }]).join()).toMatch(/em dash/));
