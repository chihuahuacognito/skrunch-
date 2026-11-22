import type { Exercise } from '../library/types';
import { needs } from './needs';
import { rankCandidates } from './select';
import { Tally } from './tally';
import type { BuilderInput, PlannedSession } from './types';

/**
 * Alternatives for one planned strength item, best first: same slot (pattern or muscle), recovered, under the caps
 * once the rest of tonight's session is counted, and not already in the session. Items without a slot return [].
 */
export function swapCandidates(input: BuilderInput, session: PlannedSession, blockIndex: number, itemIndex: number): Exercise[] {
  const item = session.blocks[blockIndex]?.items[itemIndex];
  if (!item?.slot || session.focus === 'desk-reset') return [];
  const byId = new Map(input.library.map(e => [e.id, e]));
  const tally = Tally.for(input);
  session.blocks.forEach((b, bi) => b.items.forEach((x, xi) => {
    const e = byId.get(x.exerciseId);
    if (e && x.slot && !(bi === blockIndex && xi === itemIndex)) tally.add(e, x.sets);
  }));
  const used = new Set(session.blocks.flatMap(b => b.items.map(x => x.exerciseId)));
  return rankCandidates(
    { lib: input.library, history: input.history, today: input.today, focus: session.focus, place: input.place, used, blocked: tally.blocked(item.sets), deficit: needs(input) },
    item.slot,
  );
}
