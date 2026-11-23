import type { Chip, PlannedExercise, PlannedSession } from '../builder';

/** One set as shown on the workout screen: pre-filled values plus whether it was done. */
export interface SetEntry { weight: number | null; reps: number | null; seconds: number | null; done: boolean }
export interface ItemLog { sets: SetEntry[]; chip: Chip | null }
/** An item of the session, by block index and item index. */
export interface ItemRef { block: number; item: number }
/** One screen of the workout: a superset block shows all its items together, anything else one item. */
export interface Step { block: number; items: number[] }
/** A running rest. endsAt is a wall-clock time in ms; from is the item whose tick started it. */
export interface Rest { endsAt: number; seconds: number; from: ItemRef }

export interface WorkoutState {
  version: 1;
  session: PlannedSession;
  startedAt: number;
  /** logs[block][item], parallel to session.blocks. */
  logs: ItemLog[][];
  step: number;
  rest: Rest | null;
}

export type WorkoutAction =
  | { type: 'tick'; ref: ItemRef; set: number; now: number }
  | { type: 'untick'; ref: ItemRef; set: number }
  | { type: 'edit'; ref: ItemRef; set: number; field: 'weight' | 'reps' | 'seconds'; value: number | null }
  | { type: 'chip'; ref: ItemRef; chip: Chip | null }
  | { type: 'go'; step: number }
  | { type: 'completeNext'; now: number }
  | { type: 'restPlus'; seconds: number }
  | { type: 'restEnd' }
  | { type: 'swap'; ref: ItemRef; item: PlannedExercise; sets: SetEntry[] };
