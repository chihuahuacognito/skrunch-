import type { GroupId } from '../../builder';

// The segmented front and back figure from the Home design (docs/design/home-front-back-numbers-grid.pdf), drawn in a
// 110 x 220 box per side. Each segment belongs to one group; a group may have several segments.

export const FIGURE_WIDTH = 110;
export const FIGURE_HEIGHT = 220;

export type Side = 'front' | 'back';
export interface Bounds { x: number; y: number; w: number; h: number }
export interface Region { side: Side; group: GroupId; path: string; bounds: Bounds }

/** A rounded rectangle as an SVG path. */
function rr(x: number, y: number, w: number, h: number, r: number): string {
  const q = Math.min(r, w / 2, h / 2);
  return `M${x + q} ${y}H${x + w - q}Q${x + w} ${y} ${x + w} ${y + q}V${y + h - q}Q${x + w} ${y + h} ${x + w - q} ${y + h}`
    + `H${x + q}Q${x} ${y + h} ${x} ${y + h - q}V${y + q}Q${x} ${y} ${x + q} ${y}Z`;
}

const seg = (side: Side, group: GroupId, x: number, y: number, w: number, h: number, r: number): Region =>
  ({ side, group, path: rr(x, y, w, h, r), bounds: { x, y, w, h } });

/** Both arms and both legs are mirrored around the centre line (x = 55). */
const pair = (side: Side, group: GroupId, x: number, y: number, w: number, h: number, r: number): Region[] =>
  [seg(side, group, x, y, w, h, r), seg(side, group, 110 - x - w, y, w, h, r)];

export const REGIONS: Region[] = [
  // Front
  ...pair('front', 'shoulders', 20, 32, 14, 13, 6),
  ...pair('front', 'chest', 35, 32, 19, 21, 6),
  ...pair('front', 'arms', 18, 47, 11, 30, 5),
  ...pair('front', 'arms', 16, 80, 10, 27, 5),
  seg('front', 'core', 38, 55, 34, 40, 8),
  ...pair('front', 'quads', 34, 100, 19, 56, 9),
  ...pair('front', 'calves', 36, 162, 15, 40, 7),
  // Back
  ...pair('back', 'shoulders', 20, 32, 14, 13, 6),
  seg('back', 'back', 35, 32, 40, 26, 8),
  seg('back', 'back', 37, 59, 36, 26, 8),
  ...pair('back', 'arms', 18, 47, 11, 30, 5),
  ...pair('back', 'arms', 16, 80, 10, 27, 5),
  ...pair('back', 'glutes', 34, 88, 20, 24, 9),
  ...pair('back', 'hamstrings', 34, 114, 19, 46, 9),
  ...pair('back', 'calves', 36, 164, 15, 38, 7),
];

/** Decorative parts that belong to no group: head, neck, hands and feet. */
export const DECOR: { side: Side; path: string }[] = (['front', 'back'] as const).flatMap(side => [
  { side, path: rr(45, 2, 20, 22, 10) },
  { side, path: rr(50, 24, 10, 7, 3) },
  { side, path: rr(16, 108, 9, 10, 4) },
  { side, path: rr(85, 108, 9, 10, 4) },
  { side, path: rr(36, 205, 15, 8, 4) },
  { side, path: rr(59, 205, 15, 8, 4) },
]);
