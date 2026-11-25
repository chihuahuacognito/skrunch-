import { hash01, isMainLift } from './select';
import { BENCH, byId, lib } from './test-utils/fixtures';

test('hash01 is stable and in range', () => {
  expect(hash01('a')).toBe(hash01('a'));
  expect(hash01('a')).not.toBe(hash01('b'));
  expect(hash01('a')).toBeGreaterThanOrEqual(0);
  expect(hash01('a')).toBeLessThan(1);
});

test('bench press is a horizontal-push main lift, not a vertical one', () => {
  expect(isMainLift(byId(BENCH), ['push-horizontal'])).toBe(true);
  expect(isMainLift(byId(BENCH), ['push-vertical'])).toBe(false);
});

test('a compound whose primaries miss the pattern muscle is not a main lift', () => {
  const closeGrip = lib.find(e => e.pattern === 'push-horizontal' && e.mechanic === 'compound' && !e.primary.includes('chest'));
  if (closeGrip) expect(isMainLift(closeGrip, ['push-horizontal'])).toBe(false);
  expect(lib.filter(e => isMainLift(e, ['push-horizontal'])).every(e => e.primary.includes('chest'))).toBe(true);
});
