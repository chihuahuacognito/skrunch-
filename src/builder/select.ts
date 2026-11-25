import type { Exercise, Pattern } from '../library/types';
import { PATTERN_MUSCLES } from './focus';

/** FNV-1a 32-bit hash scaled to [0, 1): stable variety without randomness. */
export function hash01(key: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0) / 2 ** 32;
}

/** Compound lift in one of the patterns that trains that pattern's own muscle (so close-grip bench is not a chest main). */
export function isMainLift(e: Exercise, patterns: Pattern[]): boolean {
  if (e.mechanic !== 'compound' || e.pattern === null || !patterns.includes(e.pattern)) return false;
  const native = PATTERN_MUSCLES[e.pattern] ?? [];
  return e.primary.some(m => native.includes(m));
}
