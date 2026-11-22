import type { BudgetMuscle, Dose, Exercise, Pattern } from '../library/types';

export type CheckIn = 'good' | 'ok' | 'wrecked';
export type Place = 'gym' | 'home';
export type FocusId = 'chest-back' | 'lower' | 'shoulders-arms' | 'full-body' | 'conditioning' | 'mobility' | 'rest';
export type SessionKind = FocusId | 'desk-reset';
export type SessionDose = 'full' | 'reduced' | 'minimum';
export type Chip = 'easy' | 'right' | 'hard';
export type Feedback = 'more' | 'less' | 'never';

/** One done set, shaped by the dose: reps for rep work, seconds for holds and timed work (minutes x 60). */
export interface LoggedSet { weight: number | null; reps: number | null; seconds: number | null }
export interface LoggedExercise {
  exerciseId: string;
  targetMin: number | null;
  targetMax: number | null;
  chip: Chip | null;
  sets: LoggedSet[];
}
export interface SessionLog { date: string; focus: FocusId; intervals: boolean; exercises: LoggedExercise[] }
export interface History {
  sessions: SessionLog[];
  checkIns: { date: string; value: CheckIn }[];
  feedback: Partial<Record<string, Feedback>>;
}

export interface BuilderInput { library: Exercise[]; history: History; today: string; checkIn: CheckIn; place: Place }
export interface FocusOption { focus: FocusId; dose: SessionDose }

export type BlockKind =
  | 'warmup' | 'main' | 'superset' | 'finisher' | 'intervals' | 'zone2' | 'core' | 'mobility' | 'stability' | 'cooldown';
export type SlotKind = 'main' | 'superset';
/** The selection a strength item filled: Plan 4 rebuilds its swap list from this. */
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
export interface PlannedSession {
  focus: SessionKind;
  dose: SessionDose;
  date: string;
  place: Place;
  deload: boolean;
  calibration: boolean;
  intervals: boolean;
  blocks: Block[];
  estimatedMinutes: number;
}
