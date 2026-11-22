import type { BudgetMuscle } from '../library/types';
import { MUSCLE_GROUP } from './focus';
import { buildSession } from './session';
import { byId, emptyHistory, hist, lib, logged } from './test-utils/fixtures';
import type { BlockKind, BuilderInput, FocusId, PlannedSession } from './types';

const input = (over: Partial<BuilderInput> = {}): BuilderInput =>
  ({ library: lib, history: emptyHistory(), today: '2026-11-22', checkIn: 'good', place: 'gym', ...over });
const good = (focus: FocusId, over: Partial<BuilderInput> = {}) => buildSession(input(over), { focus, dose: 'full' });
const LIFTING = ['chest-back', 'lower', 'shoulders-arms', 'full-body'] as const;

const blocksOf = (s: PlannedSession, kind: BlockKind) => s.blocks.filter(b => b.kind === kind);
const itemsOf = (s: PlannedSession, kinds: BlockKind[]) => s.blocks.filter(b => kinds.includes(b.kind)).flatMap(b => b.items);
const totalSets = (s: PlannedSession, kinds: BlockKind[]) => itemsOf(s, kinds).reduce((a, i) => a + i.sets, 0);
const directSets = (s: PlannedSession, m: BudgetMuscle) =>
  itemsOf(s, ['main', 'superset', 'core']).filter(i => byId(i.exerciseId).primary.includes(m)).reduce((a, i) => a + i.sets, 0);

test.each(LIFTING)('%s follows the template order and fits the hour', f => {
  const s = good(f);
  expect(s.blocks.map(b => b.kind)).toEqual(['warmup', 'main', 'superset', 'superset', 'finisher', 'cooldown']);
  expect(s.estimatedMinutes).toBeGreaterThanOrEqual(45);
  expect(s.estimatedMinutes).toBeLessThanOrEqual(65);
});

test.each(LIFTING)('%s main lifts are compound at 5-12 reps, superset items at 10-20', f => {
  const s = good(f);
  const main = itemsOf(s, ['main']);
  expect(main).toHaveLength(2);
  for (const i of main) {
    expect(byId(i.exerciseId).mechanic).toBe('compound');
    expect(i.dose).toMatchObject({ format: 'reps' });
    if (i.dose.format === 'reps') { expect(i.dose.min).toBeGreaterThanOrEqual(5); expect(i.dose.max).toBeLessThanOrEqual(12); }
  }
  for (const i of itemsOf(s, ['superset'])) {
    if (i.dose.format === 'reps') { expect(i.dose.min).toBeGreaterThanOrEqual(10); expect(i.dose.max).toBeLessThanOrEqual(20); }
  }
});

test.each(LIFTING)('%s superset pairs never pair muscles from the same group', f => {
  for (const b of blocksOf(good(f), 'superset')) {
    expect(b.items.length).toBeGreaterThanOrEqual(1);
    if (b.items.length === 2) {
      const [a, c] = b.items.map(i => MUSCLE_GROUP[byId(i.exerciseId).primary[0]]);
      expect(a).not.toBe(c);
    }
  }
});

test.each(LIFTING)('%s cool-down always covers lower back and hip flexors', f => {
  const regions = blocksOf(good(f), 'cooldown')[0].items.flatMap(i => byId(i.exerciseId).muscles);
  expect(regions).toContain('lower back');
  expect(regions).toContain('hip flexors');
});

test.each(LIFTING)('%s gives no muscle more than 8 direct sets', f => {
  const s = good(f);
  for (const m of ['chest', 'lats', 'midBack', 'quads', 'hamstrings', 'glutes', 'sideDelts', 'rearDelts', 'frontDelts', 'biceps', 'triceps', 'core', 'calves'] as const)
    expect(directSets(s, m)).toBeLessThanOrEqual(8);
});

test('front delts never pass 4 direct sets in the rolling week', () => {
  const s = good('shoulders-arms', { history: hist([logged('2026-11-19', 'shoulders-arms', [['Standing_Military_Press', 3]])]) });
  expect(directSets(s, 'frontDelts')).toBe(0);
});

test('OK has about 75% of the sets of Good', () => {
  const ok = buildSession(input({ checkIn: 'ok' }), { focus: 'chest-back', dose: 'reduced' });
  const ratio = totalSets(ok, ['main', 'superset']) / totalSets(good('chest-back'), ['main', 'superset']);
  expect(ratio).toBeGreaterThanOrEqual(0.7);
  expect(ratio).toBeLessThanOrEqual(0.8);
  expect(blocksOf(ok, 'finisher')[0].items.every(i => i.dose.format === 'duration' && byId(i.exerciseId).dose.format === 'duration')).toBe(true);
  expect(ok.intervals).toBe(false);
});

test('minimum dose is 6-8 sets at 3-4 RIR with no finisher', () => {
  const s = buildSession(input({ checkIn: 'wrecked' }), { focus: 'chest-back', dose: 'minimum' });
  const sets = totalSets(s, ['main', 'superset']);
  expect(sets).toBeGreaterThanOrEqual(6);
  expect(sets).toBeLessThanOrEqual(8);
  expect(itemsOf(s, ['main', 'superset']).every(i => i.rir?.[0] === 3 && i.rir?.[1] === 4)).toBe(true);
  expect(blocksOf(s, 'finisher')).toHaveLength(0);
});

test('a Lower session never gets an interval finisher', () => expect(good('lower').intervals).toBe(false));

test('empty history builds a calibration session', () => {
  const s = good('chest-back');
  expect(s.calibration).toBe(true);
  expect(itemsOf(s, ['main']).every(i => i.weight === null && i.rir?.[0] === 3)).toBe(true);
});

test('progressed weights come from history', () => {
  const s0 = good('chest-back');
  const lift = itemsOf(s0, ['main'])[0];
  const max = lift.dose.format === 'reps' ? lift.dose.max : 10;
  const past = logged('2026-11-15', 'chest-back', [[lift.exerciseId, 3]], { reps: max, weight: 50 });
  past.exercises[0].targetMax = max;
  // A second, earlier session moves the block out of calibration week.
  const s = good('chest-back', { history: hist([logged('2026-11-08', 'lower', [['Barbell_Squat', 3]]), past]) });
  const again = itemsOf(s, ['main']).find(i => i.exerciseId === lift.exerciseId);
  expect(again?.progressed).toBe(true);
  expect(again?.weight).toBeGreaterThan(50);
});

test('slots with no candidate are skipped, never undefined', () => {
  const never = Object.fromEntries(lib.filter(e => e.pattern === 'push-vertical').map(e => [e.id, 'never' as const]));
  const s = good('shoulders-arms', { history: { ...emptyHistory(), feedback: never } });
  expect(s.blocks.flatMap(b => b.items).every(Boolean)).toBe(true);
  expect(itemsOf(s, ['main'])).toHaveLength(1);
  expect(blocksOf(s, 'superset').length).toBeGreaterThanOrEqual(2);
});

test('no exercise appears twice in one session', () => {
  for (const f of LIFTING) {
    const ids = itemsOf(good(f), ['main', 'superset']).map(i => i.exerciseId);
    expect(new Set(ids).size).toBe(ids.length);
  }
});

test('buildSession is deterministic', () => expect(good('full-body')).toEqual(good('full-body')));

test.each(LIFTING)('%s fills both superset blocks with real pairs on a fresh week', f => {
  for (const b of blocksOf(good(f), 'superset')) expect(b.items).toHaveLength(2);
});

test.each(LIFTING)('%s main lifts train their own pattern muscle (no close-grip bench as a chest main)', f => {
  const native: Record<string, string[]> = {
    'push-horizontal': ['chest'], 'push-vertical': ['frontDelts', 'sideDelts'], 'pull-horizontal': ['midBack', 'lats'],
    'pull-vertical': ['lats'], squat: ['quads'], lunge: ['quads', 'glutes'], hinge: ['hamstrings', 'glutes'],
  };
  for (const date of ['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24']) {
    for (const i of itemsOf(good(f, { today: date }), ['main'])) {
      const e = byId(i.exerciseId);
      expect(e.primary.some(m => native[e.pattern!].includes(m))).toBe(true);
    }
  }
});

test.each(LIFTING)('%s warm-up drills target tonight\'s regions', f => {
  for (const date of ['2026-11-20', '2026-11-21', '2026-11-22']) {
    const s = good(f, { today: date });
    const regions = new Set([
      ...itemsOf(s, ['main']).flatMap(i => byId(i.exerciseId).muscles),
      f === 'lower' || f === 'full-body' ? 'hip flexors' : 'thoracic spine',
    ]);
    const drills = blocksOf(s, 'warmup')[0].items.map(i => byId(i.exerciseId)).filter(e => e.type === 'mobility');
    expect(drills).toHaveLength(3);
    for (const d of drills) expect(d.muscles.some(m => regions.has(m))).toBe(true);
  }
});
