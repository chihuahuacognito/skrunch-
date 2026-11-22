import type { Exercise } from '../library/types';
import { FOCUS_SPECS, type LiftingFocus } from './focus';
import { needs } from './needs';
import { rankCandidates } from './select';
import { Tally } from './tally';
import type { BuilderInput, Slot } from './types';

/**
 * Tonight's main lifts for a focus, slot by slot, counting each pick before the next (a squat's glute credit can
 * block a glute hinge). The menu offers a focus only when this fills every slot, and the builder uses the same picks.
 */
export function pickMainLifts(input: BuilderInput, focus: LiftingFocus, sets: number): { e: Exercise; slot: Slot }[] {
  const tally = Tally.for(input);
  const used = new Set<string>();
  const deficit = needs(input);
  const out: { e: Exercise; slot: Slot }[] = [];
  FOCUS_SPECS[focus].mainSlots.forEach((patterns, i) => {
    const slot: Slot = { kind: 'main', patterns, key: `main${i}` };
    const e = rankCandidates(
      { lib: input.library, history: input.history, today: input.today, focus, place: input.place, used, blocked: tally.blocked(sets), deficit },
      slot,
    )[0];
    if (!e) return;
    used.add(e.id);
    tally.add(e, sets);
    out.push({ e, slot });
  });
  return out;
}
