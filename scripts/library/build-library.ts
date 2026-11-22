// Builds src/library/library.json from the pinned database plus curation.json and custom.json.
// Usage: npm run library
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildLibrary, type CurationEntry, type CustomEntry, type FedbEntry } from '../../src/library/build';

const here = __dirname;
const read = <T>(file: string): T => JSON.parse(readFileSync(join(here, file), 'utf8')) as T;

const library = buildLibrary(
  read<FedbEntry[]>('vendor/free-exercise-db.json'),
  read<CurationEntry[]>('curation.json'),
  read<CustomEntry[]>('custom.json'),
);
const out = join(here, '../../src/library/library.json');
writeFileSync(out, JSON.stringify(library, null, 2) + '\n');
console.log(`wrote ${library.length} exercises to src/library/library.json`);
