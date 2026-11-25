import type { Exercise } from '../library/types';
import { GROUP_LABEL, GROUP_MUSCLES, GROUPS, groupCredit, groupTargets } from './groups';

const ex = (over: Partial<Exercise>): Exercise => ({
  id: 'x', name: 'X', source: 'custom', type: 'strength', pattern: null, muscles: [], primary: [], secondary: [],
  equipment: [], location: ['gym'], position: 'standing', dose: { format: 'reps', min: 8, max: 12 }, impact: null,
  mechanic: 'compound', purposes: [], instructions: [], images: [], sourceUrl: null, ...over,
} as Exercise);

test('nine groups in grid order, each with a label and muscles', () => {
  expect(GROUPS).toEqual(['chest', 'back', 'shoulders', 'arms', 'core', 'glutes', 'quads', 'hamstrings', 'calves']);
  for (const g of GROUPS) {
    expect(GROUP_LABEL[g]).toBeTruthy();
    expect(GROUP_MUSCLES[g].length).toBeGreaterThan(0);
  }
  expect(GROUP_MUSCLES.back).toEqual(['lats', 'midBack']);
  expect(GROUP_MUSCLES.shoulders).toEqual(['sideDelts', 'rearDelts', 'frontDelts']);
  expect(GROUP_MUSCLES.arms).toEqual(['biceps', 'triceps']);
});

test('a row set counts once for Back, not once per back muscle', () => {
  expect(groupCredit(ex({ primary: ['midBack', 'lats'], secondary: ['biceps'] }))).toEqual({ back: 1, arms: 0.5 });
});

test('front delts as a secondary give Shoulders nothing (direct work only)', () => {
  expect(groupCredit(ex({ primary: ['chest'], secondary: ['frontDelts', 'triceps'] }))).toEqual({ chest: 1, arms: 0.5 });
});

test('a primary beats a secondary in the same group', () => {
  expect(groupCredit(ex({ primary: ['biceps'], secondary: ['triceps'] }))).toEqual({ arms: 1 });
});

test('conditioning and stability give no credit', () => {
  expect(groupCredit(ex({ type: 'conditioning' }))).toEqual({});
  expect(groupCredit(ex({ type: 'stability', primary: ['core'] }))).toEqual({});
});

test('targets ramp from the low end, deload halves, calves fixed', () => {
  expect(groupTargets(1, false)).toEqual({ chest: 12, back: 12, shoulders: 10, arms: 10, core: 6, glutes: 6, quads: 8, hamstrings: 6, calves: 6 });
  expect(groupTargets(3, false)).toMatchObject({ chest: 14, quads: 10, calves: 6 });
  expect(groupTargets(9, false)).toMatchObject({ chest: 16, core: 10, quads: 12 });
  expect(groupTargets(6, true)).toEqual({ chest: 6, back: 6, shoulders: 5, arms: 5, core: 3, glutes: 3, quads: 4, hamstrings: 3, calves: 3 });
});
