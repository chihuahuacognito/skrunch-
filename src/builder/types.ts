import type { BudgetMuscle, Dose, Exercise, Pattern } from '../library/types';

export type Place = 'gym' | 'home';
export type SessionDose = 'full' | 'reduced' | 'minimum';
export type Chip = 'easy' | 'right' | 'hard';
export type Feedback = 'more' | 'less' | 'never';

/** One done set, shaped by the dose: reps for rep work, seconds for holds and timed work (minutes x 60). */
export interface LoggedSet { weight: number | null; reps: number | null; seconds: number | null }
export interface LoggedExercise {
  exerciseId: string;
  /** The target reps of that day (the bottom of the range before the redesign). */
  targetMin: number | null;
  targetMax: number | null;
  chip: Chip | null;
  /** Sets planned that day; null for logs written before schema v3. */
  plannedSets: number | null;
  sets: LoggedSet[];
}
/** One training day's log. New rows use focus 'free'; older rows keep the Plan 3-4 focus id. */
export interface SessionLog { date: string; focus: string; intervals: boolean; exercises: LoggedExercise[] }
export interface History {
  sessions: SessionLog[];
  feedback: Partial<Record<string, Feedback>>;
}

/** What the group, status, pick and target modules read. */
export interface GroupInput { library: Exercise[]; history: History; today: string }

export type BlockKind =
  | 'warmup' | 'main' | 'superset' | 'finisher' | 'intervals' | 'zone2' | 'core' | 'mobility' | 'stability' | 'cooldown';
export type SlotKind = 'main' | 'superset';
export interface Slot { kind: SlotKind; patterns?: Pattern[]; muscle?: BudgetMuscle; key: string }

export interface PlannedExercise {
  exerciseId: string;
  /** Null for warm-up, finisher, cool-down, mobility and stability items. */
  slot: Slot | null;
  sets: number;
  dose: Dose;
  rir: [number, number] | null;
  restSeconds: number;
  weight: number | null;
  progressed: boolean;
}
export interface Block { kind: BlockKind; items: PlannedExercise[] }
/** A built list of items; only the desk reset, warm-up and cool-down build these now. */
export interface PlannedSession {
  focus: 'desk-reset';
  dose: SessionDose;
  date: string;
  place: Place;
  deload: boolean;
  calibration: boolean;
  intervals: boolean;
  blocks: Block[];
  estimatedMinutes: number;
}
