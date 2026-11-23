import { secondsText, weightText } from '../ui/format';
import { nextOpenSet } from './reduce';
import type { WorkoutState } from './types';

/** Rests shorter than this (warm-up flows, stability holds) count down in the app only. */
export const REST_NOTICE_MIN_SECONDS = 45;

/** What the rest notification says: when the rest ends and what comes next. Null when no notification is due. */
export function restNotice(
  state: WorkoutState,
  names: Map<string, string>,
  clockText: (ms: number) => string,
): { endsAt: number; title: string; body: string } | null {
  const { rest } = state;
  if (!rest || rest.seconds < REST_NOTICE_MIN_SECONDS) return null;
  const next = nextOpenSet(state);
  let body = 'Last set done';
  if (next) {
    const item = state.session.blocks[next.ref.block].items[next.ref.item];
    const set = state.logs[next.ref.block][next.ref.item].sets[next.set];
    const amount = set.reps !== null ? `${set.reps}` : secondsText(set.seconds ?? 0);
    const load = set.weight !== null ? `${weightText(set.weight)} × ${amount}` : set.reps !== null ? `${set.reps} reps` : amount;
    body = `Next: ${names.get(item.exerciseId) ?? item.exerciseId} · set ${next.set + 1} · ${load}`;
  }
  return { endsAt: rest.endsAt, title: `Rest until ${clockText(rest.endsAt)}`, body };
}
