import { addDays } from './dates';
import { intervalsAllowed, rankFocuses } from './rank';
import { BENCH, emptyHistory, hist, lib, logged } from './test-utils/fixtures';
import type { BuilderInput, FocusId, History } from './types';

const input = (over: Partial<BuilderInput> = {}): BuilderInput =>
  ({ library: lib, history: emptyHistory(), today: '2026-11-22', checkIn: 'good', place: 'gym', ...over });
const focuses = (i: BuilderInput): FocusId[] => rankFocuses(i).map(o => o.focus);
const sixDays = (): History =>
  hist(Array.from({ length: 6 }, (_, i) => logged(addDays('2026-11-16', i), 'conditioning', [])));

test('empty history gives four options, mobility last', () => {
  const r = rankFocuses(input());
  expect(r).toHaveLength(4);
  expect(r[3]).toEqual({ focus: 'mobility', dose: 'full' });
});

test('never two Lower days in a row', () =>
  expect(focuses(input({ history: hist([logged('2026-11-21', 'lower', [['Barbell_Squat', 3]])]) }))).not.toContain('lower'));

test('no Lower the day after intervals', () =>
  expect(focuses(input({ history: hist([logged('2026-11-21', 'conditioning', [], { intervals: true })]) }))).not.toContain('lower'));

test('the most under-budget focus ranks first', () => {
  const h = hist([logged('2026-11-19', 'chest-back', [[BENCH, 6], ['Bent_Over_Barbell_Row', 6], ['Wide-Grip_Lat_Pulldown', 6]])]);
  expect(rankFocuses(input({ history: h }))[0].focus).toBe('lower');
});

test('OK reduces every option', () =>
  expect(rankFocuses(input({ checkIn: 'ok' })).filter(o => o.focus !== 'mobility').every(o => o.dose === 'reduced')).toBe(true));

test('wrecked leads with rest and mobility, then a minimum dose', () => {
  const r = rankFocuses(input({ checkIn: 'wrecked' }));
  expect(r.slice(0, 2).map(o => o.focus)).toEqual(['rest', 'mobility']);
  expect(r[2].dose).toBe('minimum');
});

test('six training days running puts rest first and keeps four options', () => {
  const r = rankFocuses(input({ history: sixDays() }));
  expect(r[0].focus).toBe('rest');
  expect(r).toHaveLength(4);
});

test('mobility sessions do not count toward the six-day run', () => {
  const h = sixDays();
  h.sessions[2] = { ...h.sessions[2], focus: 'mobility' };
  expect(rankFocuses(input({ history: h }))[0].focus).not.toBe('rest');
});

test('home offers only mobility', () =>
  expect(rankFocuses(input({ place: 'home' }))).toEqual([{ focus: 'mobility', dose: 'full' }]));

test('mobility always appears exactly once', () => {
  for (const checkIn of ['good', 'ok', 'wrecked'] as const)
    expect(focuses(input({ checkIn })).filter(f => f === 'mobility')).toHaveLength(1);
});

test('intervals are capped at two per rolling week and never on Lower', () => {
  const two = hist([logged('2026-11-18', 'conditioning', [], { intervals: true }), logged('2026-11-20', 'conditioning', [], { intervals: true })]);
  expect(intervalsAllowed(input({ history: two }), 'conditioning')).toBe(false);
  expect(intervalsAllowed(input(), 'conditioning')).toBe(true);
  expect(intervalsAllowed(input(), 'lower')).toBe(false);
  expect(intervalsAllowed(input({ checkIn: 'ok' }), 'conditioning')).toBe(false);
});
