import type { Exercise } from './types';
import {
  BUDGET_MUSCLES, EQUIPMENT, EXERCISE_TYPES, LOCATIONS, PATTERNS, POSITIONS, PURPOSES, TAG_MUSCLES,
} from './vocab';

const EM_DASH = '\u2014';

const FIELDS: readonly (keyof Exercise)[] = [
  'id', 'name', 'source', 'type', 'pattern', 'muscles', 'primary', 'secondary', 'equipment', 'location',
  'position', 'dose', 'impact', 'mechanic', 'purposes', 'instructions', 'images', 'sourceUrl',
];
const SOURCES = ['fedb', 'custom', 'instagram'];
const DOSE_FORMATS = ['reps', 'hold', 'duration'];

/** Every field present, nothing extra, and the tagged values known. Content rules are checked only after this passes. */
function shapeProblems(e: Exercise): string[] {
  const out: string[] = [];
  const record = e as unknown as Record<string, unknown>;
  for (const f of FIELDS) if (!(f in record)) out.push(`missing field "${f}"`);
  for (const k of Object.keys(record)) if (!(FIELDS as readonly string[]).includes(k)) out.push(`unknown field "${k}"`);
  if (out.length) return out;
  if (!SOURCES.includes(e.source)) out.push(`unknown source "${e.source}"`);
  const format = (e.dose as { format?: unknown } | null)?.format;
  if (!DOSE_FORMATS.includes(String(format))) out.push(`unknown dose format "${String(format)}"`);
  return out;
}

/** Returns human-readable problems; an empty array means the library is valid. */
export function validateLibrary(list: Exercise[]): string[] {
  const problems: string[] = [];
  const seen = new Set<string>();

  for (const e of list) {
    const p = (msg: string) => problems.push(`${e.id}: ${msg}`);
    const checkAll = (label: string, values: readonly string[], allowed: readonly string[]) => {
      for (const v of values) if (!allowed.includes(v)) p(`unknown ${label} "${v}"`);
    };

    if (seen.has(e.id)) p('duplicate id');
    seen.add(e.id);

    const shape = shapeProblems(e);
    if (shape.length) { shape.forEach(p); continue; }

    if (!e.name.trim()) p('empty name');
    if (!(EXERCISE_TYPES as readonly string[]).includes(e.type)) p(`unknown type "${e.type}"`);
    if (e.pattern !== null && !(PATTERNS as readonly string[]).includes(e.pattern)) p(`unknown pattern "${e.pattern}"`);
    if (!(POSITIONS as readonly string[]).includes(e.position)) p(`unknown position "${e.position}"`);
    checkAll('muscle', e.muscles, TAG_MUSCLES);
    checkAll('budget muscle', [...e.primary, ...e.secondary], BUDGET_MUSCLES);
    checkAll('equipment', e.equipment, EQUIPMENT);
    checkAll('location', e.location, LOCATIONS);
    checkAll('purpose', e.purposes, PURPOSES);
    if (e.location.length === 0) p('needs at least one location');

    const hasBudget = e.primary.length + e.secondary.length > 0;
    if (e.type === 'strength') {
      if (e.primary.length === 0) p('strength needs a primary budget muscle');
      if (e.dose.format !== 'reps') p('strength needs a reps dose');
    } else if (hasBudget) {
      p('budget muscles are only allowed on strength (they count toward weekly volume)');
    }

    if (e.impact !== null && e.type !== 'conditioning') p('impact is only for conditioning');
    if (e.dose.format === 'reps' && !(e.dose.min > 0 && e.dose.min <= e.dose.max)) p('reps range must be positive and ordered');
    if (e.dose.format === 'hold' && !(e.dose.seconds > 0)) p('hold seconds must be positive');
    if (e.dose.format === 'duration' && !(e.dose.minutes > 0)) p('duration minutes must be positive');

    if ([e.name, ...e.instructions].some(t => t.includes(EM_DASH))) p('contains an em dash');
  }
  return problems;
}
