import type { BudgetMuscle, Pattern } from '../library/types';
import type { FocusId } from './types';

export type LiftingFocus = 'chest-back' | 'lower' | 'shoulders-arms' | 'full-body';
export interface FocusSpec { mainSlots: Pattern[][]; pool: BudgetMuscle[] }

export const FOCUS_SPECS: Record<LiftingFocus, FocusSpec> = {
  'chest-back': {
    mainSlots: [['push-horizontal'], ['pull-horizontal', 'pull-vertical']],
    pool: ['chest', 'lats', 'midBack', 'rearDelts', 'core', 'sideDelts'],
  },
  lower: {
    mainSlots: [['squat', 'lunge'], ['hinge']],
    pool: ['quads', 'hamstrings', 'glutes', 'calves', 'core'],
  },
  'shoulders-arms': {
    mainSlots: [['push-vertical'], ['pull-vertical']],
    pool: ['sideDelts', 'rearDelts', 'biceps', 'triceps'],
  },
  'full-body': {
    mainSlots: [['squat', 'hinge', 'lunge'], ['push-horizontal', 'pull-horizontal', 'pull-vertical']],
    pool: ['chest', 'lats', 'midBack', 'quads', 'hamstrings', 'glutes', 'sideDelts', 'rearDelts', 'biceps', 'triceps', 'core'],
  },
};

/** The muscle a main lift of each pattern exists to train; a main lift must have one of these as a primary. */
export const PATTERN_MUSCLES: Partial<Record<Pattern, BudgetMuscle[]>> = {
  'push-horizontal': ['chest'], 'push-vertical': ['frontDelts', 'sideDelts'], 'pull-horizontal': ['midBack', 'lats'],
  'pull-vertical': ['lats'], squat: ['quads'], lunge: ['quads', 'glutes'], hinge: ['hamstrings', 'glutes'],
};

export const LIFTING_FOCUSES: readonly LiftingFocus[] = ['chest-back', 'lower', 'shoulders-arms', 'full-body'];

export function isLifting(f: FocusId): f is LiftingFocus {
  return (LIFTING_FOCUSES as readonly string[]).includes(f);
}

/**
 * Superset partners come from different groups so they do not compete. Legs split three ways:
 * quads with hamstrings (leg extension with leg curl) is the classic non-competing pair, while hamstrings
 * and glutes share the hinge.
 */
export type MuscleGroup = 'push' | 'pull' | 'quads' | 'posterior' | 'calves' | 'core';
export const MUSCLE_GROUP: Record<BudgetMuscle, MuscleGroup> = {
  chest: 'push', frontDelts: 'push', sideDelts: 'push', triceps: 'push',
  lats: 'pull', midBack: 'pull', rearDelts: 'pull', biceps: 'pull',
  quads: 'quads', hamstrings: 'posterior', glutes: 'posterior', calves: 'calves',
  core: 'core',
};
