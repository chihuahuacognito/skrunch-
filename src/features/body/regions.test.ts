import { GROUPS } from '../../builder';
import { FIGURE_HEIGHT, FIGURE_WIDTH, REGIONS } from './regions';

const sides = (g: string) => new Set(REGIONS.filter(r => r.group === g).map(r => r.side));

test('every group has at least one region', () => {
  for (const g of GROUPS) expect(REGIONS.some(r => r.group === g)).toBe(true);
});

test('calves, arms and shoulders appear on both sides', () => {
  for (const g of ['calves', 'arms', 'shoulders']) expect(sides(g)).toEqual(new Set(['front', 'back']));
});

test('glutes, hamstrings and back are back-only; chest, core and quads front-only', () => {
  for (const g of ['glutes', 'hamstrings', 'back']) expect(sides(g)).toEqual(new Set(['back']));
  for (const g of ['chest', 'core', 'quads']) expect(sides(g)).toEqual(new Set(['front']));
});

test('every region has a path and bounds inside the figure', () => {
  for (const r of REGIONS) {
    expect(r.path.startsWith('M')).toBe(true);
    expect(r.bounds.x).toBeGreaterThanOrEqual(0);
    expect(r.bounds.y).toBeGreaterThanOrEqual(0);
    expect(r.bounds.x + r.bounds.w).toBeLessThanOrEqual(FIGURE_WIDTH);
    expect(r.bounds.y + r.bounds.h).toBeLessThanOrEqual(FIGURE_HEIGHT);
  }
});
