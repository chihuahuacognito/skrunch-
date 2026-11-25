import type { BudgetMuscle, Pattern } from '../library/types';

/** The muscle a main lift of each pattern exists to train; a main lift must have one of these as a primary. */
export const PATTERN_MUSCLES: Partial<Record<Pattern, BudgetMuscle[]>> = {
  'push-horizontal': ['chest'], 'push-vertical': ['frontDelts', 'sideDelts'], 'pull-horizontal': ['midBack', 'lats'],
  'pull-vertical': ['lats'], squat: ['quads'], lunge: ['quads', 'glutes'], hinge: ['hamstrings', 'glutes'],
};
