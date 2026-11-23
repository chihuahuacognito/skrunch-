import type { Exercise } from '../library/types';
import { estimateMinutes } from './estimate';
import { needs } from './needs';
import { nextLoad, prescribeReps } from './prescribe';
import { rankCandidates } from './select';
import { Tally } from './tally';
import type { BuilderInput, PlannedExercise, PlannedSession } from './types';

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

/**
 * Tonight's session with one strength item replaced by another exercise. Slot, sets, RIR and rest stay; the dose
 * and weight are worked out for the new exercise by the same rules buildSession uses. The input session is untouched.
 */
export function replaceItem(input: BuilderInput, session: PlannedSession, blockIndex: number, itemIndex: number, exerciseId: string): PlannedSession {
  const item = session.blocks[blockIndex]?.items[itemIndex];
  if (!item?.slot) throw new Error(`item ${blockIndex}/${itemIndex} has no slot to swap`);
  const e = input.library.find(x => x.id === exerciseId);
  if (!e) throw new Error(`unknown exercise ${exerciseId}`);
  const allowProgression = input.checkIn === 'good' && session.dose === 'full' && !session.deload;
  const load = nextLoad(e, input.history, allowProgression);
  const next: PlannedExercise = { ...item, exerciseId: e.id, dose: prescribeReps(e.dose, item.slot.kind), weight: load.weight, progressed: load.progressed };
  const blocks = session.blocks.map((b, bi) =>
    bi === blockIndex ? { ...b, items: b.items.map((x, xi) => (xi === itemIndex ? next : x)) } : b);
  return { ...session, blocks, estimatedMinutes: estimateMinutes(blocks) };
}
