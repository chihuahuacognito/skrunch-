// One-off: downloads the pinned free-exercise-db (public domain, Unlicense) into vendor/.
// The output is committed, so library builds never need the network.
import { writeFile } from 'node:fs/promises';

const SHA = 'f00c92c7dcf1216a928a52c3706c7ce8e2f71ed5';
const url = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/${SHA}/dist/exercises.json`;
const res = await fetch(url);
if (!res.ok) throw new Error(`fetch failed: ${res.status} ${url}`);
const data = await res.json();
await writeFile(new URL('./vendor/free-exercise-db.json', import.meta.url), JSON.stringify(data, null, 2) + '\n');
console.log(`wrote ${data.length} exercises from ${SHA}`);
