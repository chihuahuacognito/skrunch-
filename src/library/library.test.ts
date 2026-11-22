import library from './library.json';
import type { Exercise, Pattern, TagMuscle } from './types';
import { validateLibrary } from './validate';
import { BUDGET_MUSCLES } from './vocab';

const lib = library as Exercise[];
const gymStrength = lib.filter(e => e.type === 'strength' && e.location.includes('gym') && e.purposes.length === 0);
const DESK_REGIONS: TagMuscle[] = ['lower back', 'thoracic spine', 'hip flexors', 'hamstrings', 'glutes'];
const MAIN_PATTERNS: Pattern[] = ['squat', 'hinge', 'lunge', 'push-horizontal', 'push-vertical', 'pull-horizontal', 'pull-vertical'];

test('library validates', () => expect(validateLibrary(lib)).toEqual([]));

test('size is in range', () => {
  expect(lib.length).toBeGreaterThanOrEqual(150);
  expect(lib.length).toBeLessThanOrEqual(200);
});

test.each(BUDGET_MUSCLES)('at least 3 gym strength options with %s as primary', m =>
  expect(gymStrength.filter(e => e.primary.includes(m)).length).toBeGreaterThanOrEqual(3));

test.each(MAIN_PATTERNS)('at least 2 compound main-lift options for %s', p =>
  expect(gymStrength.filter(e => e.pattern === p && e.mechanic === 'compound').length).toBeGreaterThanOrEqual(2));

test('at least 10 mobility warm-up items', () =>
  expect(lib.filter(e => e.type === 'mobility').length).toBeGreaterThanOrEqual(10));

test.each(DESK_REGIONS)('at least 2 stretches for %s', m =>
  expect(lib.filter(e => e.type === 'stretch' && e.muscles.includes(m)).length).toBeGreaterThanOrEqual(2));

test('desk reset coverage', () => {
  const desk = lib.filter(e => (e.type === 'stretch' || e.type === 'mobility') && e.position !== 'floor' && e.equipment.length === 0);
  expect(desk.length).toBeGreaterThanOrEqual(8);
  for (const m of DESK_REGIONS) expect(desk.some(e => e.muscles.includes(m))).toBe(true);
});

test('conditioning has at least 6 options, 3 of them low-impact', () => {
  const c = lib.filter(e => e.type === 'conditioning');
  expect(c.length).toBeGreaterThanOrEqual(6);
  expect(c.filter(e => e.impact === 'low').length).toBeGreaterThanOrEqual(3);
});

test('at least 5 stability items', () =>
  expect(lib.filter(e => e.type === 'stability').length).toBeGreaterThanOrEqual(5));

test('home location only on mobility, stretch and stability', () =>
  expect(lib.filter(e => e.location.includes('home') && !['mobility', 'stretch', 'stability'].includes(e.type)).map(e => e.id)).toEqual([]));
