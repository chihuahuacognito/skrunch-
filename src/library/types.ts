import type {
  BUDGET_MUSCLES, EQUIPMENT, EXERCISE_TYPES, LOCATIONS, PATTERNS, POSITIONS, PURPOSES, TAG_MUSCLES,
} from './vocab';

export type ExerciseType = (typeof EXERCISE_TYPES)[number];
export type TagMuscle = (typeof TAG_MUSCLES)[number];
export type BudgetMuscle = (typeof BUDGET_MUSCLES)[number];
export type Purpose = (typeof PURPOSES)[number];
export type Pattern = (typeof PATTERNS)[number];
export type Equipment = (typeof EQUIPMENT)[number];
export type Position = (typeof POSITIONS)[number];
export type Location = (typeof LOCATIONS)[number];

export type Dose =
  | { format: 'reps'; min: number; max: number }
  | { format: 'hold'; seconds: number }
  | { format: 'duration'; minutes: number };

export interface Exercise {
  /** Stable slug; the free-exercise-db id for database entries. */
  id: string;
  name: string;
  source: 'fedb' | 'custom' | 'instagram';
  type: ExerciseType;
  /** null for stretch / mobility items with no loading pattern. */
  pattern: Pattern | null;
  /** Target regions, any type. */
  muscles: TagMuscle[];
  /** Strength only: counts 1.0 toward the weekly budget. */
  primary: BudgetMuscle[];
  /** Strength only: counts 0.5 toward the weekly budget. */
  secondary: BudgetMuscle[];
  /** [] means no equipment. */
  equipment: Equipment[];
  location: Location[];
  position: Position;
  dose: Dose;
  /** Conditioning only, otherwise null. */
  impact: 'jumping' | 'low' | null;
  mechanic: 'compound' | 'isolation' | null;
  purposes: Purpose[];
  instructions: string[];
  /** free-exercise-db relative image paths; not bundled yet. */
  images: string[];
  /** The Instagram post for source 'instagram'. */
  sourceUrl: string | null;
}
