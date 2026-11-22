// Ported from langocard (git 90816d2^: src/features/arc/arc.test.ts, src/features/home/magnify.test.ts).
import { bowX, layoutCenters, nearestIndex, scaleFor } from './geometry';

describe('bowX', () => {
  // band spans y in [100, 300], middle 200, arcDepth 30
  it('peaks at the band middle, inward (negative) for a right edge', () =>
    expect(bowX(200, 100, 200, 30, 'right')).toBeCloseTo(-30, 5));
  it('peaks positive for a left edge', () => expect(bowX(200, 100, 200, 30, 'left')).toBeCloseTo(30, 5));
  it('is 0 at both ends of the band', () => {
    expect(bowX(100, 100, 200, 30, 'right')).toBeCloseTo(0, 5);
    expect(bowX(300, 100, 200, 30, 'right')).toBeCloseTo(0, 5);
  });
  it('is a parabola: 0.75 of the depth at the quarter point', () =>
    expect(bowX(150, 100, 200, 30, 'right')).toBeCloseTo(-22.5, 5));
  it('clamps outside the band to 0', () => expect(bowX(500, 100, 200, 30, 'right')).toBeCloseTo(0, 5));
  it('returns 0 for a non-positive band height', () => expect(bowX(200, 100, 0, 30, 'right')).toBe(0));
});

describe('scaleFor (raised cosine)', () => {
  it('peaks at distance 0', () => expect(scaleFor(0, 1.7, 150)).toBeCloseTo(1.7, 5));
  it('is exactly 1 at and beyond the window edge', () => {
    expect(scaleFor(150, 1.7, 150)).toBeCloseTo(1, 5);
    expect(scaleFor(400, 1.7, 150)).toBeCloseTo(1, 5);
  });
  it('is the midpoint at half the window', () => expect(scaleFor(75, 1.7, 150)).toBeCloseTo(1.35, 5));
  it('is symmetric for negative distance', () => expect(scaleFor(-75, 1.7, 150)).toBeCloseTo(scaleFor(75, 1.7, 150), 5));
});

describe('nearestIndex', () => {
  it('finds the closest center', () => {
    expect(nearestIndex([0, 100, 200], 130)).toBe(1);
    expect(nearestIndex([0, 100, 200], 170)).toBe(2);
  });
});

describe('layoutCenters', () => {
  it('spreads items across the height from the top', () => expect(layoutCenters(3, 10, 200)).toEqual([10, 110, 210]));
  it('centers a single item', () => expect(layoutCenters(1, 10, 200)).toEqual([110]));
  it('returns [] for zero items', () => expect(layoutCenters(0, 0, 200)).toEqual([]));
});
