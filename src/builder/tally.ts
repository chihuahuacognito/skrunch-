import type { BudgetMuscle, Exercise } from '../library/types';
import { BUDGET_MUSCLES } from '../library/vocab';
import { BUDGET } from './budget';
import { needs, targetsFor } from './needs';
import { unrecovered } from './recovery';
import type { BuilderInput } from './types';
import { setCredit, weeklyVolume, zeroVolume } from './volume';

const MAX_DIRECT_SETS_PER_SESSION = 8;

/** Tracks tonight's planned work so the caps (8 direct sets a session, the weekly ceiling) and needs stay current. */
export class Tally {
  direct = zeroVolume();
  credit = zeroVolume();
  constructor(
    private done: Record<BudgetMuscle, number>,
    private targets: Record<BudgetMuscle, number>,
    private recovering: Set<BudgetMuscle>,
    private need: Record<BudgetMuscle, number>,
  ) {}

  static for(input: BuilderInput): Tally {
    return new Tally(
      weeklyVolume(input.library, input.history.sessions, input.today),
      targetsFor(input),
      unrecovered(input.library, input.history.sessions, input.today),
      needs(input),
    );
  }

  add(e: Exercise, sets: number) {
    for (const m of e.primary) this.direct[m] += sets;
    for (const [m, c] of Object.entries(setCredit(e)) as [BudgetMuscle, number][]) this.credit[m] += c * sets;
  }

  /** Muscles that cannot take `sets` more primary sets tonight: recovering, session cap, or weekly ceiling. */
  blocked(sets: number): Set<BudgetMuscle> {
    const out = new Set(this.recovering);
    for (const m of BUDGET_MUSCLES) {
      if (this.direct[m] + sets > MAX_DIRECT_SETS_PER_SESSION) out.add(m);
      if (this.done[m] + this.credit[m] + sets > BUDGET[m][1]) out.add(m);
    }
    return out;
  }

  /** Tonight's need (0..1) less the work already planned tonight. */
  deficit(m: BudgetMuscle): number {
    const t = this.targets[m];
    return t > 0 ? Math.max(0, this.need[m] - this.credit[m] / t) : 0;
  }
}
