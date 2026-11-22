import type { SessionKind } from '../builder';

// Single source of design tokens. Motion and arc values are ported from langocard
// (git 90816d2^:src/theme/tokens.ts) and tuned on the phone.
// Rule: never linear tweens for tracking - drive transforms from the thumb position.
export const tokens = {
  color: {
    bg: '#0a0b0d',
    bgElevated: '#14171d',
    line: '#22262f',
    ink: '#f2f5f9',
    inkDim: '#7c828c',
    accent: '#FFB454',
  },
  space: { xs: 4, sm: 8, md: 12, lg: 18, xl: 28, xxl: 44 },
  font: { size: { sub: 13, body: 15, lead: 23, title: 34, hero: 40 } },
  motion: {
    springTrack: { mass: 0.1, stiffness: 170, damping: 12 },
    springSnap: { mass: 0.8, stiffness: 220, damping: 20 },
    magnify: { maxScale: 1.7, falloffPx: 170 },
  },
  arc: {
    itemHeight: 56, // tap target height of one arc item
    bandFraction: 0.8, // the item band fills the lower 80% of the arc area (thumb reach)
    arcDepth: 26, // inward bow (px) at the band middle
    restOpacity: 0.55, // resting item opacity (focused -> 1)
    cancelFraction: 0.3, // releasing inboard of this fraction of the width cancels a sweep
    bubbleWidth: 150, // read-out beside the arc
    bubbleGap: 8,
  },
  focusAccent: {
    'chest-back': '#FF6B6B',
    lower: '#34C759',
    'shoulders-arms': '#AF87FF',
    'full-body': '#FFB454',
    conditioning: '#FF9F0A',
    mobility: '#5AC8FA',
    rest: '#7c828c',
    'desk-reset': '#2DD4BF',
  } satisfies Record<SessionKind, string>,
} as const;

export type Tokens = typeof tokens;
