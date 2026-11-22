import { buildLibrary, type CurationEntry, type FedbEntry } from './build';
import type { Exercise } from './types';

const fedbBench: FedbEntry = {
  id: 'Barbell_Bench_Press',
  name: 'Barbell Bench Press',
  force: 'push',
  level: 'beginner',
  mechanic: 'compound',
  equipment: 'barbell',
  primaryMuscles: ['chest'],
  secondaryMuscles: ['triceps'],
  instructions: ['Lie on the bench.', 'Press the bar up.'],
  category: 'strength',
  images: ['Barbell_Bench_Press/0.jpg'],
};

const curBench: CurationEntry = {
  fedbId: 'Barbell_Bench_Press',
  type: 'strength',
  pattern: 'push-horizontal',
  primary: ['chest'],
  secondary: ['triceps', 'frontDelts'],
  location: ['gym'],
  position: 'floor',
  dose: { format: 'reps', min: 6, max: 10 },
};

const customBirdDog: Exercise = {
  id: 'bird-dog',
  name: 'Bird Dog',
  source: 'custom',
  type: 'stability',
  pattern: 'core',
  muscles: ['abdominals', 'lower back', 'glutes'],
  primary: [],
  secondary: [],
  equipment: [],
  location: ['gym', 'home'],
  position: 'floor',
  dose: { format: 'reps', min: 6, max: 8 },
  impact: null,
  mechanic: null,
  purposes: [],
  instructions: ['Kneel on all fours.', 'Reach one arm and the opposite leg out.', 'Return and switch sides.'],
  images: [],
  sourceUrl: null,
};

test('buildLibrary maps a curation entry onto its fedb record', () => {
  const [ex] = buildLibrary([fedbBench], [curBench], []);
  expect(ex).toMatchObject({
    id: 'Barbell_Bench_Press', name: fedbBench.name, source: 'fedb',
    equipment: ['barbell'], muscles: ['chest', 'triceps'], mechanic: 'compound',
    images: ['Barbell_Bench_Press/0.jpg'], impact: null, purposes: [], sourceUrl: null,
  });
});

test('buildLibrary throws on unknown fedb id', () =>
  expect(() => buildLibrary([fedbBench], [{ ...curBench, fedbId: 'Nope' }], [])).toThrow(/unknown fedb id "Nope"/));

test('custom entries are appended and output is sorted by id', () =>
  expect(buildLibrary([fedbBench], [curBench], [customBirdDog]).map(e => e.id)).toEqual(['Barbell_Bench_Press', 'bird-dog']));

test('invalid result throws with every problem', () =>
  expect(() => buildLibrary([fedbBench], [{ ...curBench, type: 'stretch' }], [])).toThrow(/budget muscles/));

test('build output is deterministic', () => {
  const a = JSON.stringify(buildLibrary([fedbBench], [curBench], [customBirdDog]));
  const b = JSON.stringify(buildLibrary([fedbBench], [curBench], [customBirdDog]));
  expect(a).toBe(b);
});

test('em dashes in database text become plain dashes', () => {
  const dashed = { ...fedbBench, name: 'Bench \u2014 Flat', instructions: ['Lie down \u2014 then press.'] };
  const [ex] = buildLibrary([dashed], [curBench], []);
  expect(ex.name).toBe('Bench - Flat');
  expect(ex.instructions).toEqual(['Lie down - then press.']);
});

test('a curation entry cannot override id, source or images', () => {
  const bad = { ...curBench, id: 'Leg_Press', source: 'instagram' } as unknown as CurationEntry;
  expect(() => buildLibrary([fedbBench], [bad], [])).toThrow(/curation key "id" is not allowed/);
});

test('an unknown curation key fails the build', () => {
  const typo = { ...curBench, secundary: ['chest'] } as unknown as CurationEntry;
  expect(() => buildLibrary([fedbBench], [typo], [])).toThrow(/unknown curation key "secundary"/);
});
