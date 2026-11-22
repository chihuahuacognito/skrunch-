import type { BudgetMuscle, Pattern } from '../library/types';
import type { FocusId } from './types';

export type LiftingFocus = 'chest-back' | 'lower' | 'shoulders-arms' | 'full-body';
export interface FocusSpec { mainSlots: Pattern[][]; pool: BudgetMuscle[] }

export const FOCUS_SPECS: Record<LiftingFocus, FocusSpec> = {
  'chest-back': {
    mainSlots: [['push-horizontal'], ['pull-horizontal', 'pull-vertical']],
    pool: ['chest', 'lats', 'midBack', 'rearDelts', 'core'],
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
    pool: ['chest', 'lats', 'midBack', 'quads', 'hamstrings', 'glutes', 'sideDelts', 'rearDelts', 'biceps', 'triceps', 'core', 'calves'],
  },
};

export const LIFTING_FOCUSES: readonly LiftingFocus[] = ['chest-back', 'lower', 'shoulders-arms', 'full-body'];

export function isLifting(f: FocusId): f is LiftingFocus {
  return (LIFTING_FOCUSES as readonly string[]).includes(f);
}

export type MuscleGroup = 'push' | 'pull' | 'legs' | 'core';
export const MUSCLE_GROUP: Record<BudgetMuscle, MuscleGroup> = {
  chest: 'push', frontDelts: 'push', sideDelts: 'push', triceps: 'push',
  lats: 'pull', midBack: 'pull', rearDelts: 'pull', biceps: 'pull',
  quads: 'legs', hamstrings: 'legs', glutes: 'legs', calves: 'legs',
  core: 'core',
};
