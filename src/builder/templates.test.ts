import { buildSession } from './session';
import { logAsPlanned } from './test-utils/simulate';
import { byId, emptyHistory, lib } from './test-utils/fixtures';
import type { BlockKind, BuilderInput, CheckIn, FocusId, PlannedSession, SessionDose } from './types';

const input = (over: Partial<BuilderInput> = {}): BuilderInput =>
  ({ library: lib, history: emptyHistory(), today: '2026-11-22', checkIn: 'good', place: 'gym', ...over });
const kinds = (s: PlannedSession): BlockKind[] => s.blocks.map(b => b.kind);
const allItems = (s: PlannedSession) => s.blocks.flatMap(b => b.items).map(i => byId(i.exerciseId));

test('rest has no blocks', () =>
  expect(buildSession(input(), { focus: 'rest', dose: 'full' })).toMatchObject({ blocks: [], estimatedMinutes: 0 }));

test('conditioning with intervals allowed uses an interval block, OK uses Zone 2', () => {
  const good = buildSession(input(), { focus: 'conditioning', dose: 'full' });
  expect(kinds(good)).toEqual(['warmup', 'intervals', 'core', 'stability', 'cooldown']);
  expect(good.intervals).toBe(true);
  const ok = buildSession(input({ checkIn: 'ok' }), { focus: 'conditioning', dose: 'reduced' });
  expect(kinds(ok)).toEqual(['warmup', 'zone2', 'core', 'stability', 'cooldown']);
  expect(ok.intervals).toBe(false);
});

test('conditioning core work is loaded core strength, which counts toward the core budget', () => {
  const core = buildSession(input(), { focus: 'conditioning', dose: 'full' }).blocks.find(b => b.kind === 'core')!;
  expect(core.items).toHaveLength(2);
  expect(core.items.every(i => byId(i.exerciseId).type === 'strength' && byId(i.exerciseId).primary.includes('core'))).toBe(true);
});

test('gym mobility has Zone 2, a flow, stability work and a longer cool-down', () => {
  const s = buildSession(input(), { focus: 'mobility', dose: 'full' });
  expect(kinds(s)).toEqual(['zone2', 'mobility', 'stability', 'cooldown']);
  expect(s.blocks[1].items).toHaveLength(6);
  expect(s.blocks[3].items).toHaveLength(5);
});

test('a wrecked mobility session walks for its Zone 2', () => {
  const s = buildSession(input({ checkIn: 'wrecked' }), { focus: 'mobility', dose: 'full' });
  expect(byId(s.blocks[0].items[0].exerciseId).name.toLowerCase()).toContain('walk');
});

test('home mobility uses only no-equipment mobility and stretch items', () => {
  const s = buildSession(input({ place: 'home' }), { focus: 'mobility', dose: 'full' });
  expect(kinds(s)).toEqual(['mobility', 'cooldown']);
  expect(allItems(s).every(e => ['mobility', 'stretch'].includes(e.type) && e.equipment.length === 0)).toBe(true);
});

test('stability items never appear at home', () =>
  expect(allItems(buildSession(input({ place: 'home' }), { focus: 'mobility', dose: 'full' })).some(e => e.type === 'stability')).toBe(false));

const DOSE: Record<CheckIn, SessionDose> = { good: 'full', ok: 'reduced', wrecked: 'minimum' };
test('every session fits the hour', () => {
  const focuses: FocusId[] = ['chest-back', 'lower', 'shoulders-arms', 'full-body', 'conditioning', 'mobility', 'rest'];
  for (const checkIn of ['good', 'ok', 'wrecked'] as const)
    for (const focus of focuses) {
      const s = buildSession(input({ checkIn }), { focus, dose: focus === 'mobility' || focus === 'rest' ? 'full' : DOSE[checkIn] });
      expect(s.estimatedMinutes).toBeLessThanOrEqual(65);
      expect(s.blocks.every(b => b.items.length > 0)).toBe(true);
    }
});

test('purpose-tagged items stay out of Conditioning and lifting finishers (warm-up, cool-down, desk reset and Mobility only)', () => {
  const tagged = lib
    .filter(e => e.type === 'stability' || e.type === 'conditioning')
    .map(e => ({ ...e, id: `ig-${e.id}`, purposes: ['wrists' as const] }));
  const withTagged = [...lib, ...tagged];
  const ids: string[] = [];
  for (const date of ['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22']) {
    const c = buildSession(input({ library: withTagged, today: date }), { focus: 'conditioning', dose: 'full' });
    const z = buildSession(input({ library: withTagged, today: date, checkIn: 'ok' }), { focus: 'conditioning', dose: 'reduced' });
    const l = buildSession(input({ library: withTagged, today: date }), { focus: 'chest-back', dose: 'full' });
    for (const s of [c, z, l]) ids.push(...s.blocks.filter(b => !['warmup', 'cooldown'].includes(b.kind)).flatMap(b => b.items.map(i => i.exerciseId)));
  }
  expect(ids.filter(id => id.startsWith('ig-'))).toEqual([]);
});

test('the Mobility Zone 2 block never uses a purpose-tagged machine', () => {
  const tagged = lib.filter(e => e.type === 'conditioning').map(e => ({ ...e, id: `ig-${e.id}`, purposes: ['knees' as const] }));
  for (const date of ['2026-11-18', '2026-11-19', '2026-11-20', '2026-11-21', '2026-11-22'])
    for (const checkIn of ['good', 'wrecked'] as const) {
      const s = buildSession(input({ library: [...lib, ...tagged], today: date, checkIn }), { focus: 'mobility', dose: 'full' });
      expect(s.blocks.filter(b => b.kind === 'zone2').flatMap(b => b.items.map(i => i.exerciseId)).filter(id => id.startsWith('ig-'))).toEqual([]);
    }
});

test('holds and timed work are logged in seconds, not as fake reps', () => {
  const s = buildSession(input(), { focus: 'conditioning', dose: 'full' });
  const log = logAsPlanned(s);
  for (const x of log.exercises) {
    const dose = byId(x.exerciseId).dose;
    const planned = s.blocks.flatMap(b => b.items).find(i => i.exerciseId === x.exerciseId)!;
    for (const set of x.sets) {
      if (planned.dose.format === 'reps') expect(set).toMatchObject({ reps: planned.dose.max, seconds: null });
      else expect(set).toMatchObject({ reps: null, seconds: planned.dose.format === 'hold' ? planned.dose.seconds : planned.dose.minutes * 60 });
    }
    expect(dose).toBeDefined();
  }
});
