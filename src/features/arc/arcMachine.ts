// Pure gesture state for the thumb arc. No Reanimated import.
// langocard's arcMachine reduced to one level: there is no card zone. After the pan engages
// (activation, never touch-down), releasing on the arc side of cancelX selects at the release y;
// releasing inboard of it cancels. A down-up without engage is a tap: the item Pressables handle taps,
// so the machine emits cancel and never a select.
import type { ArcEdge } from './geometry';

export type { ArcEdge };
export type ArcConfig = { cancelX: number; edge: ArcEdge };
// 'cancel' is the system taking the touch (Android back gesture, app switch): it never selects.
export type ArcInput = { kind: 'down' | 'engage' | 'move' | 'up' | 'cancel'; x: number; y: number };
export type ArcState = { active: boolean; engaged: boolean; x: number; y: number };
export type ArcEvent = { type: 'select'; y: number } | { type: 'cancel' } | null;

export function initArc(): ArcState {
  return { active: false, engaged: false, x: 0, y: 0 };
}

function onArcSide(x: number, cfg: ArcConfig): boolean {
  return cfg.edge === 'right' ? x >= cfg.cancelX : x <= cfg.cancelX;
}

export function reduceArc(state: ArcState, input: ArcInput, cfg: ArcConfig): { state: ArcState; event: ArcEvent } {
  switch (input.kind) {
    case 'down':
      return { state: { active: true, engaged: false, x: input.x, y: input.y }, event: null };
    case 'engage':
      if (!state.active) return { state, event: null };
      return { state: { ...state, engaged: true, x: input.x, y: input.y }, event: null };
    case 'move':
      if (!state.active || !state.engaged) return { state, event: null };
      return { state: { ...state, x: input.x, y: input.y }, event: null };
    case 'cancel':
      if (!state.active) return { state, event: null };
      return { state: initArc(), event: { type: 'cancel' } };
    case 'up': {
      if (!state.active) return { state, event: null };
      const event: ArcEvent = state.engaged && onArcSide(input.x, cfg) ? { type: 'select', y: input.y } : { type: 'cancel' };
      return { state: initArc(), event };
    }
  }
}
