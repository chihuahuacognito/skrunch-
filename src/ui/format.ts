import type { BlockKind, FocusId, FocusOption, SessionDose } from '../builder';
import type { Dose } from '../library/types';

const BLOCK_TITLE: Record<BlockKind, string> = {
  warmup: 'Warm-up',
  main: 'Main lift',
  superset: 'Superset',
  finisher: 'Finisher',
  intervals: 'Intervals',
  zone2: 'Zone 2',
  core: 'Core',
  mobility: 'Mobility',
  stability: 'Stability',
  cooldown: 'Cool-down',
};

export function blockTitle(kind: BlockKind): string {
  return BLOCK_TITLE[kind];
}

/** '3 × 6-10', '3 × 8', '2 × 30 s', '8 min'. A single set omits the count. */
export function doseText(sets: number, dose: Dose): string {
  const each =
    dose.format === 'reps' ? (dose.min === dose.max ? `${dose.max}` : `${dose.min}-${dose.max}`)
    : dose.format === 'hold' ? `${dose.seconds} s`
    : `${dose.minutes} min`;
  return sets === 1 && dose.format !== 'reps' ? each : `${sets} × ${each}`;
}

/** '60 kg', 'Bodyweight' for 0 kg, null when the weight is not known yet. */
export function weightText(weight: number | null): string | null {
  if (weight === null) return null;
  return weight === 0 ? 'Bodyweight' : `${weight} kg`;
}

/** 150 -> '2:30'. */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** 30 -> '30 s', 480 -> '8 min'; whole minutes read as minutes. */
export function secondsText(seconds: number): string {
  return seconds >= 60 && seconds % 60 === 0 ? `${seconds / 60} min` : `${seconds} s`;
}

const FOCUSES: readonly FocusId[] = ['chest-back', 'lower', 'shoulders-arms', 'full-body', 'conditioning', 'mobility', 'rest'];
const DOSES: readonly SessionDose[] = ['full', 'reduced', 'minimum'];

/** Route params to a focus option; anything unknown (or an array param) is null. */
export function parseOption(focus: unknown, dose: unknown): FocusOption | null {
  const f = FOCUSES.find(x => x === focus);
  const d = DOSES.find(x => x === dose);
  return f && d ? { focus: f, dose: d } : null;
}
