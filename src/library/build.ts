import type { Equipment, Exercise, TagMuscle } from './types';
import { validateLibrary } from './validate';

/** A record from yuhonas/free-exercise-db (dist/exercises.json). */
export interface FedbEntry {
  id: string;
  name: string;
  force: string | null;
  level: string;
  mechanic: string | null;
  equipment: string | null;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  instructions: string[];
  category: string;
  images: string[];
}

type CurationRequired = Pick<Exercise, 'type' | 'pattern' | 'primary' | 'secondary' | 'location' | 'position' | 'dose'>;

/** Picks one database entry and adds the fields the database lacks. Any Exercise field given here overrides the derived one. */
export type CurationEntry = { fedbId: string } & CurationRequired & Partial<Omit<Exercise, keyof CurationRequired>>;

/** A complete exercise the database doesn't have. */
export type CustomEntry = Exercise;

const EQUIPMENT_MAP: Record<string, Equipment[]> = {
  'barbell': ['barbell'],
  'dumbbell': ['dumbbell'],
  'cable': ['cable'],
  'machine': ['machine'],
  'kettlebells': ['kettlebell'],
  'bands': ['bands'],
  'e-z curl bar': ['barbell'],
  'body only': [],
  'exercise ball': ['other'],
  'medicine ball': ['other'],
  'foam roll': ['other'],
  'other': ['other'],
};

function mapEquipment(raw: string | null): Equipment[] {
  if (raw === null) return [];
  const mapped = EQUIPMENT_MAP[raw];
  if (!mapped) throw new Error(`unmapped fedb equipment "${raw}"`);
  return [...mapped];
}

/** Database text is third-party; the app never shows an em dash, so normalise it on import. */
const plain = (text: string) => text.replace(/\s*\u2014\s*/g, ' - ');

const CURATION_REQUIRED = ['fedbId', 'type', 'pattern', 'primary', 'secondary', 'location', 'position', 'dose'];
const CURATION_OVERRIDABLE = ['name', 'muscles', 'equipment', 'impact', 'mechanic', 'purposes', 'instructions'];
/** Identity and provenance always come from the database record. */
const CURATION_FORBIDDEN = ['id', 'source', 'images', 'sourceUrl'];

function curationProblems(cur: CurationEntry): string[] {
  const out: string[] = [];
  const keys = Object.keys(cur);
  for (const k of CURATION_REQUIRED) if (!keys.includes(k)) out.push(`curation for "${cur.fedbId}": missing key "${k}"`);
  for (const k of keys) {
    if (CURATION_FORBIDDEN.includes(k)) out.push(`curation for "${cur.fedbId}": curation key "${k}" is not allowed`);
    else if (!CURATION_REQUIRED.includes(k) && !CURATION_OVERRIDABLE.includes(k)) out.push(`curation for "${cur.fedbId}": unknown curation key "${k}"`);
  }
  return out;
}

function fromFedb(record: FedbEntry, cur: CurationEntry): Exercise {
  const { fedbId: _fedbId, ...overrides } = cur;
  const mechanic = record.mechanic === 'compound' || record.mechanic === 'isolation' ? record.mechanic : null;
  return {
    id: record.id,
    name: plain(record.name),
    source: 'fedb',
    muscles: [...new Set([...record.primaryMuscles, ...record.secondaryMuscles])] as TagMuscle[],
    equipment: mapEquipment(record.equipment),
    impact: null,
    mechanic,
    purposes: [],
    instructions: record.instructions.map(plain),
    images: [...record.images],
    sourceUrl: null,
    ...overrides,
  };
}

const byId = (a: Exercise, b: Exercise) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);

/** Combines the pinned database with the hand-authored curation and custom entries. Throws if anything is invalid. */
export function buildLibrary(fedb: FedbEntry[], curation: CurationEntry[], custom: CustomEntry[]): Exercise[] {
  const records = new Map(fedb.map(r => [r.id, r]));
  const problems: string[] = [];
  const out: Exercise[] = [];

  for (const cur of curation) {
    const keyProblems = curationProblems(cur);
    if (keyProblems.length) { problems.push(...keyProblems); continue; }
    const record = records.get(cur.fedbId);
    if (!record) { problems.push(`unknown fedb id "${cur.fedbId}"`); continue; }
    out.push(fromFedb(record, cur));
  }
  out.push(...custom.map(c => ({ ...c })));
  out.sort(byId);

  problems.push(...validateLibrary(out));
  if (problems.length) throw new Error(`Library build failed:\n${problems.join('\n')}`);
  return out;
}
