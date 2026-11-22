// Pure arc geometry, ported from langocard (git 90816d2^: src/features/home/magnify.ts and src/features/arc/arc.ts).
// No Reanimated import, so it stays testable on the JS thread; scaleFor is marked as a worklet for the UI thread.

export type ArcEdge = 'left' | 'right';

/** Raised-cosine fisheye: maxScale at distance 0, exactly 1 at and beyond windowPx. */
export function scaleFor(distancePx: number, maxScale: number, windowPx: number): number {
  'worklet';
  if (windowPx <= 0) return 1;
  const a = Math.min(Math.abs(distancePx), windowPx);
  return 1 + ((maxScale - 1) * (1 + Math.cos((Math.PI * a) / windowPx))) / 2;
}

export function nearestIndex(centers: number[], y: number): number {
  let bestIndex = 0;
  let bestDist = Infinity;
  for (let i = 0; i < centers.length; i++) {
    const d = Math.abs(centers[i] - y);
    if (d < bestDist) {
      bestDist = d;
      bestIndex = i;
    }
  }
  return bestIndex;
}

/** Evenly spaced item centers from `top` across `height`; a single item sits in the middle. */
export function layoutCenters(count: number, top: number, height: number): number[] {
  if (count <= 0) return [];
  if (count === 1) return [top + height / 2];
  const gap = height / (count - 1);
  return Array.from({ length: count }, (_, i) => top + gap * i);
}

/**
 * Inward horizontal offset for an item centered at `centerY` within the band [railTop, railTop + railHeight].
 * Magnitude arcDepth * (1 - t^2): largest at the band middle, 0 at the ends. A right edge bows left (negative).
 */
export function bowX(centerY: number, railTop: number, railHeight: number, arcDepth: number, edge: ArcEdge): number {
  if (railHeight <= 0) return 0;
  const half = railHeight / 2;
  const t = Math.max(-1, Math.min(1, (centerY - (railTop + half)) / half));
  const mag = arcDepth * (1 - t * t);
  return edge === 'right' ? -mag : mag;
}
