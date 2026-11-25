// One-off: downloads the free-exercise-db start/end photos for the library, resizes them and writes the require map.
// Run: npx tsx scripts/images/fetch-images.ts [longSidePx]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import sharp from 'sharp';
import { imageJobs, imageMapSource } from './plan';

const ROOT = join(__dirname, '../..');
const LONG_SIDE = Number(process.argv[2] ?? 384);

async function main(): Promise<void> {
  const lib = JSON.parse(readFileSync(join(ROOT, 'src/library/library.json'), 'utf8')) as { id: string; images: string[] }[];
  const jobs = imageJobs(lib);
  for (const job of jobs) {
    const out = join(ROOT, job.out);
    if (existsSync(out)) continue;
    const res = await fetch(job.url);
    if (!res.ok) throw new Error(`${job.url}: HTTP ${res.status}`);
    mkdirSync(dirname(out), { recursive: true });
    const image = await sharp(Buffer.from(await res.arrayBuffer()))
      .resize(LONG_SIDE, LONG_SIDE, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 78 })
      .toBuffer();
    writeFileSync(out, image);
    console.log(job.out);
  }
  const ids = [...new Set(jobs.map(j => j.id))];
  writeFileSync(join(ROOT, 'src/ui/images.ts'), imageMapSource(ids));
  console.log(`${ids.length} exercises, ${jobs.length} photos`);
}

void main().catch(e => {
  console.error(e);
  process.exit(1);
});
