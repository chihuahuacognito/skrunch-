import * as builder from './index';
import { emptyHistory, lib } from './test-utils/fixtures';

test('the public API exposes the builder functions', () => {
  for (const name of ['blockState', 'buildDeskReset', 'nextLoad', 'rankFocuses', 'rankCandidates', 'buildSession', 'weeklyVolume'] as const)
    expect(typeof builder[name]).toBe('function');
});

test('one evening end to end: rank, pick the first option, build it', () => {
  const input = { library: lib, history: emptyHistory(), today: '2026-11-22', checkIn: 'good' as const, place: 'gym' as const };
  const [first] = builder.rankFocuses(input);
  const s = builder.buildSession(input, first);
  expect(s.focus).toBe(first.focus);
  expect(s.blocks.length).toBeGreaterThan(0);
});
