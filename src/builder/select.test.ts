import type { BudgetMuscle, Exercise } from '../library/types';
import { BUDGET_MUSCLES } from '../library/vocab';
import { hash01, rankCandidates, type SelectContext } from './select';
import { BENCH, byId, emptyHistory, lib, logged } from './test-utils/fixtures';
import type { Feedback, SessionLog } from './types';

const ctx = (over: { lib?: Exercise[]; feedback?: Record<string, Feedback>; blocked?: Set<BudgetMuscle>; sessions?: SessionLog[]; today?: string } = {}): SelectContext => ({
  lib: over.lib ?? lib,
  history: { ...emptyHistory(), sessions: over.sessions ?? [], feedback: over.feedback ?? {} },
  today: over.today ?? '2026-11-22',
  focus: 'chest-back',
  place: 'gym',
  used: new Set(),
  blocked: over.blocked ?? new Set(),
  deficit: Object.fromEntries(BUDGET_MUSCLES.map(m => [m, 1])) as Record<BudgetMuscle, number>,
});
const main = { kind: 'main' as const, patterns: ['push-horizontal' as const], key: 'm1' };

test('hash01 is stable and in range', () => {
  expect(hash01('a')).toBe(hash01('a'));
  expect(hash01('a')).not.toBe(hash01('b'));
  expect(hash01('a')).toBeGreaterThanOrEqual(0);
  expect(hash01('a')).toBeLessThan(1);
});

test('main candidates are compound gym strength in the slot pattern', () => {
  const r = rankCandidates(ctx(), main);
  expect(r.length).toBeGreaterThan(0);
  expect(r.every(e => e.type === 'strength' && e.mechanic === 'compound' && e.pattern === 'push-horizontal')).toBe(true);
});

test('purpose-tagged strength items never fill a main or superset slot', () => {
  const tagged = { ...byId(BENCH), id: 'ig-bench', purposes: ['shoulder health'] } as Exercise;
  expect(rankCandidates(ctx({ lib: [...lib, tagged] }), main).map(e => e.id)).not.toContain('ig-bench');
  expect(rankCandidates(ctx({ lib: [...lib, tagged] }), { kind: 'superset', muscle: 'chest', key: 's1' }).map(e => e.id)).not.toContain('ig-bench');
});

test('never-feedback excludes, more-feedback promotes', () => {
  const r = rankCandidates(ctx({ feedback: { [BENCH]: 'never', Dumbbell_Bench_Press: 'more' } }), main);
  expect(r.map(e => e.id)).not.toContain(BENCH);
  expect(r[0].id).toBe('Dumbbell_Bench_Press');
});

test('candidates hitting a blocked muscle are excluded', () =>
  expect(rankCandidates(ctx({ blocked: new Set(['chest']) }), main).every(e => !e.primary.includes('chest'))).toBe(true));

test('superset candidates train the slot muscle', () =>
  expect(rankCandidates(ctx(), { kind: 'superset', muscle: 'biceps', key: 's1' }).every(e => e.primary.includes('biceps'))).toBe(true));

test('a main lift done in this focus recently stays on top, so progression can work', () => {
  const sessions = [logged('2026-11-18', 'chest-back', [['Machine_Bench_Press', 3]])];
  expect(rankCandidates(ctx({ sessions }), main)[0].id).toBe('Machine_Bench_Press');
});

test('a superset item from the last session drops down for variety', () => {
  const first = rankCandidates(ctx(), { kind: 'superset', muscle: 'biceps', key: 's1' })[0].id;
  const after = rankCandidates(ctx({ sessions: [logged('2026-11-20', 'shoulders-arms', [[first, 3]])] }), { kind: 'superset', muscle: 'biceps', key: 's1' });
  expect(after[0].id).not.toBe(first);
});

test('the same date gives the same order', () => {
  const a = rankCandidates(ctx(), { kind: 'superset', muscle: 'biceps', key: 's1' });
  expect(rankCandidates(ctx(), { kind: 'superset', muscle: 'biceps', key: 's1' })).toEqual(a);
});

test('different dates rotate superset picks', () => {
  const firsts = new Set(['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-26']
    .map(today => rankCandidates(ctx({ today }), { kind: 'superset', muscle: 'biceps', key: 's1' })[0].id));
  expect(firsts.size).toBeGreaterThan(1);
});
