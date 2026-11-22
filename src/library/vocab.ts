// Fixed vocabularies for the exercise library.
// Source of truth: docs/superpowers/specs/2026-11-22-review-tool-tagging-design.md and the main design doc.

export const EXERCISE_TYPES = ['strength', 'conditioning', 'mobility', 'stretch', 'stability'] as const;

/** Target regions, any exercise type (free-exercise-db's 17 plus hip flexors and thoracic spine). */
export const TAG_MUSCLES = [
  'abdominals', 'abductors', 'adductors', 'biceps', 'calves', 'chest', 'forearms', 'glutes', 'hamstrings',
  'lats', 'lower back', 'middle back', 'neck', 'quadriceps', 'shoulders', 'traps', 'triceps',
  'hip flexors', 'thoracic spine',
] as const;

/** Weekly set budget muscles (design doc table). Only strength exercises count toward them. */
export const BUDGET_MUSCLES = [
  'chest', 'lats', 'midBack', 'quads', 'hamstrings', 'glutes',
  'sideDelts', 'rearDelts', 'frontDelts', 'biceps', 'triceps', 'core', 'calves',
] as const;

export const PURPOSES = [
  'hip flexors / sitting stiffness', 'lower back comfort', 'desk breaks', 'wrists', 'knees', 'shoulder health',
] as const;

export const PATTERNS = [
  'squat', 'hinge', 'lunge', 'push-horizontal', 'push-vertical', 'pull-horizontal', 'pull-vertical',
  'carry', 'core', 'isolation',
] as const;

export const EQUIPMENT = [
  'barbell', 'dumbbell', 'cable', 'machine', 'kettlebell', 'bands', 'bodyweight', 'bench',
  'pull-up bar', 'cardio machine', 'mat', 'other',
] as const;

export const POSITIONS = ['standing', 'seated', 'floor'] as const;
export const LOCATIONS = ['gym', 'home'] as const;
