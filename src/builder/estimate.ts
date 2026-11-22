import type { Dose } from '../library/types';
import type { Block } from './types';

const REPS_SET_SECONDS = 45;

function workSeconds(dose: Dose): number {
  if (dose.format === 'reps') return REPS_SET_SECONDS;
  if (dose.format === 'hold') return dose.seconds;
  return dose.minutes * 60;
}

/** Rough session length in minutes. A superset round is both items back to back, then the last item's rest. */
export function estimateMinutes(blocks: Block[]): number {
  let seconds = 0;
  for (const b of blocks) {
    if (b.kind === 'superset' && b.items.length > 0) {
      const rounds = Math.max(...b.items.map(i => i.sets));
      const work = b.items.reduce((a, i) => a + workSeconds(i.dose), 0);
      seconds += rounds * (work + b.items[b.items.length - 1].restSeconds);
    } else {
      for (const i of b.items) seconds += i.sets * (workSeconds(i.dose) + i.restSeconds);
    }
  }
  return Math.round(seconds / 60);
}
