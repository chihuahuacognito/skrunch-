import { buildSession, INCREMENT_KG, replaceItem, swapCandidates } from './index';
import { prescribeReps } from './prescribe';
import { byId, emptyHistory, hist, lib, logged } from './test-utils/fixtures';
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

describe('replaceItem', () => {
  const setup = (checkIn: BuilderInput['checkIn'] = 'good') => {
    const s = buildSession(input(), { focus: 'chest-back', dose: 'full' });
    const m = s.blocks.findIndex(b => b.kind === 'main');
    const pick = swapCandidates(input(), s, m, 0)[0];
    const top = prescribeReps(pick.dose, 'main');
    const max = top.format === 'reps' ? top.max : 10;
    const history = hist([logged('2026-11-18', 'chest-back', [[pick.id, 3]], { weight: 40, reps: max })]);
    return { s, m, pick, history, inp: input({ history, checkIn }) };
  };

  test('swaps in the candidate with its own rep range and last weight, progressed on a good full night', () => {
    const { s, m, pick, inp } = setup();
    const old = s.blocks[m].items[0];
    const next = replaceItem(inp, s, m, 0, pick.id).blocks[m].items[0];
    expect(next).toMatchObject({ exerciseId: pick.id, slot: old.slot, sets: old.sets, rir: old.rir, restSeconds: old.restSeconds });
    expect(next.dose).toEqual(prescribeReps(pick.dose, 'main'));
    expect(next.weight).toBe(40 + INCREMENT_KG[pick.equipment[0] ?? 'other']);
    expect(next.progressed).toBe(true);
  });

  test('holds the weight on an OK night', () => {
    const { s, m, pick, inp } = setup('ok');
    const next = replaceItem(inp, s, m, 0, pick.id).blocks[m].items[0];
    expect(next).toMatchObject({ weight: 40, progressed: false });
  });

  test('leaves the original session untouched', () => {
    const { s, m, pick, inp } = setup();
    const before = s.blocks[m].items[0].exerciseId;
    replaceItem(inp, s, m, 0, pick.id);
    expect(s.blocks[m].items[0].exerciseId).toBe(before);
  });

  test('refuses items without a slot', () => {
    const { s, pick, inp } = setup();
    const w = s.blocks.findIndex(b => b.kind === 'warmup');
    expect(() => replaceItem(inp, s, w, 0, pick.id)).toThrow();
  });
});
