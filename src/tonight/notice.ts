import type { TonightState } from './types';

/** Rests shorter than this count down in the app only. */
export const REST_NOTICE_MIN_SECONDS = 45;

/**
 * What the rest notification says: when the rest ends and what comes next. `next` is the next set's target, or null
 * when the resting exercise is done. Null when no notification is due.
 */
export function restNotice(
  s: TonightState,
  names: Map<string, string>,
  clockText: (ms: number) => string,
  next: { reps: number | null; weight: number | null } | null,
): { endsAt: number; title: string; body: string } | null {
  const { rest } = s;
  if (!rest || rest.seconds < REST_NOTICE_MIN_SECONDS) return null;
  const name = names.get(rest.exerciseId) ?? rest.exerciseId;
  let body = `${name} done`;
  if (next && rest.set < rest.of) {
    const load = next.weight ? `${next.weight} kg × ${next.reps}` : `${next.reps} reps`;
    body = `Next: ${name} · set ${rest.set + 1} · ${load}`;
  }
  return { endsAt: rest.endsAt, title: `Rest until ${clockText(rest.endsAt)}`, body };
}
