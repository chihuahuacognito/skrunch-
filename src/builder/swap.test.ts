import { buildSession, swapCandidates } from './index';
import { byId, emptyHistory, lib } from './test-utils/fixtures';
import type { BuilderInput } from './types';

const input = (over: Partial<BuilderInput> = {}): BuilderInput =>
  ({ library: lib, history: emptyHistory(), today: '2026-11-22', checkIn: 'good', place: 'gym', ...over });

test('every main and superset item records the slot it filled; warm-up and cool-down items do not', () => {
  const s = buildSession(input(), { focus: 'chest-back', dose: 'full' });
  for (const b of s.blocks) for (const i of b.items) {
    if (b.kind === 'main') expect(i.slot).toMatchObject({ kind: 'main', patterns: expect.any(Array) });
    else if (b.kind === 'superset') expect(i.slot).toMatchObject({ kind: 'superset', muscle: expect.any(String) });
    else expect(i.slot).toBeNull();
  }
});

test('swapping a main lift offers other main lifts of the same slot, never one already in the session', () => {
  const s = buildSession(input(), { focus: 'chest-back', dose: 'full' });
  const mainIdx = s.blocks.findIndex(b => b.kind === 'main');
  const current = s.blocks[mainIdx].items[0];
  const options = swapCandidates(input(), s, mainIdx, 0);
  expect(options.length).toBeGreaterThan(0);
  const inSession = new Set(s.blocks.flatMap(b => b.items.map(i => i.exerciseId)));
  for (const e of options) {
    expect(inSession.has(e.id)).toBe(false);
    expect(current.slot?.patterns).toContain(e.pattern);
    expect(e.mechanic).toBe('compound');
  }
});

test('swapping a superset item keeps its muscle and respects never-feedback', () => {
  const s = buildSession(input(), { focus: 'shoulders-arms', dose: 'full' });
  const ssIdx = s.blocks.findIndex(b => b.kind === 'superset');
  const muscle = s.blocks[ssIdx].items[0].slot!.muscle!;
  const banned = swapCandidates(input(), s, ssIdx, 0)[0].id;
  const options = swapCandidates(input({ history: { ...emptyHistory(), feedback: { [banned]: 'never' } } }), s, ssIdx, 0);
  expect(options.map(e => e.id)).not.toContain(banned);
  expect(options.every(e => byId(e.id).primary.includes(muscle))).toBe(true);
});

test('items without a slot have no swap list', () => {
  const s = buildSession(input(), { focus: 'chest-back', dose: 'full' });
  expect(swapCandidates(input(), s, 0, 0)).toEqual([]);
});
