**Date**: 2026-11-22
**Content Type**: Implementation Plan

# Plan 1 - App Scaffold and Exercise Library

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A fresh Expo SDK 58 TypeScript app in the repo root with Jest working, plus the bundled, validated exercise library (`src/library/library.json`) that later plans' session builder consumes.

**Architecture:** The library is generated, not hand-maintained: a pure function `buildLibrary(fedb, curation, custom)` combines a pinned copy of free-exercise-db with two hand-authored files (`curation.json` picks about 150 database entries and adds the fields the database lacks; `custom.json` adds about 20 exercises the database is missing). A small CLI writes the result to `src/library/library.json`. Tests validate every entry against the vocabularies and assert coverage rules the session builder depends on.

**Tech Stack:** Expo SDK 58 (`expo@58.0.x`), TypeScript (strict), jest-expo, tsx (runs the build CLI).

**Spec:** `docs/superpowers/specs/2026-11-22-workout-app-design.md`, with vocabularies from `docs/superpowers/specs/2026-11-22-review-tool-tagging-design.md`.

## Roadmap (this plan is 1 of 4)

1. **Scaffold and exercise library** (this plan).
2. **Session builder:** pure TypeScript. Check-in, focus ranking, weekly set budget, session templates, progression, desk reset generator. Consumes the `Exercise` type and `library.json` from this plan.
3. **App shell and evening flow:** port langocard's radial arc from its git history (`F:\newprojects\langocard`, deleted in commit `90816d2`; the last version is at `90816d2^:src/features/arc/`, plus `src/theme/tokens.ts`, `src/motion/`, `src/haptics/`), then the check-in, radial focus menu, session preview and desk reset screens.
4. **Workout and history:** workout screen, one-tap set logging into expo-sqlite, progression inputs, the rest-timer notification, swaps and "more / less / never" feedback, JSON backup to Downloads and Android Auto Backup.

Each plan gets its own spec check, plan and review cycle. The Instagram exercises merge into the library later, via `custom.json`-style entries with `source: "instagram"`.

## Global Constraints

- Expo SDK 58 (`expo` 58.0.x, the npm `latest` tag on 2026-11-22). Android is the only target. Package manager: npm.
- TypeScript `strict: true`. No `any` in `src/library/`.
- Exercise type values, exactly: strength, conditioning, mobility, stretch, stability.
- Tag muscles (region vocabulary), exactly: abdominals, abductors, adductors, biceps, calves, chest, forearms, glutes, hamstrings, lats, lower back, middle back, neck, quadriceps, shoulders, traps, triceps, hip flexors, thoracic spine.
- Budget muscles (weekly set budget vocabulary), exactly as the design doc's table: chest, lats, midBack, quads, hamstrings, glutes, sideDelts, rearDelts, frontDelts, biceps, triceps, core, calves.
- Purposes, exactly: hip flexors / sitting stiffness, lower back comfort, desk breaks, wrists, knees, shoulder health.
- Only `type: "strength"` entries may have non-empty `primary` / `secondary` budget muscles (the strength-only volume rule). Stability entries never list `core` as a budget muscle.
- Purpose-tagged entries are never used for main lifts or supersets; that is enforced by the builder (Plan 2), but this plan's data must carry `purposes` so it can be.
- free-exercise-db is pinned to commit `f00c92c7dcf1` (2026-09-27). It is public domain (Unlicense).
- No exercise images are bundled in this plan. Entries keep the database's relative `images` paths; Plan 3 decides whether to bundle them.
- Never use the em dash in UI copy, docs or data.
- Commits carry no AI co-author line (owner's global rule). Work on a feature branch, `feat/plan-1-library`.

## Review Focus

- A curation entry referencing a free-exercise-db id that does not exist must fail the build loudly, not be skipped. Pinned in Task 3 (`buildLibrary throws on unknown fedb id`).
- Two entries producing the same `id` (a custom entry colliding with a database id) must fail validation. Pinned in Task 2 (`validateLibrary flags duplicate ids`).
- A stretch or mobility entry accidentally given budget muscles would silently inflate weekly volume. Pinned in Task 2 (`validateLibrary flags budget muscles on non-strength`).
- Rebuilding must be deterministic (same inputs, byte-identical `library.json`), so diffs stay reviewable. Pinned in Task 3 (`build output is deterministic`).
- The desk reset needs enough standing or seated, no-equipment entries covering back, thoracic spine, hip flexors, hamstrings and glutes. Pinned in Task 4 (`desk reset coverage`).

---

### Task 1: Expo scaffold with a passing Jest smoke test

**Files:**
- Create (via the Expo CLI): `package.json`, `app.json`, `tsconfig.json`, `index.ts`, `src/app/_layout.tsx`, `src/app/index.tsx`, `jest.setup.js`
- Modify: `.gitignore` (append the Expo template's entries; keep the existing `saved/` rules)
- Test: `src/app/index.test.tsx`

**Interfaces:**
- Produces: `npm test` runs Jest with the `jest-expo` preset over `src/**` and `scripts/**`. Later tasks and plans add tests under the same config.

- [ ] **Step 1: Create the app in a temp folder and move it into the repo root**

Run `npx create-expo-app@latest <tmp>/wa --template blank-typescript --yes` (with the SDK 58 template), then move its files into `F:\newprojects\workout-app`, leaving existing `docs/` and `saved/` untouched. Use expo-router with the `src/app/` layout, as langocard does. App name "Workout", slug `workout-app`, Android package `com.owner.workout` (rename later if the owner wants).

- [ ] **Step 2: Write the smoke test**

```tsx
// src/app/index.test.tsx
import { render, screen } from '@testing-library/react-native';
import Home from './index';
test('home renders', () => {
  render(<Home />);
  expect(screen.getByText('Workout')).toBeTruthy();
});
```

- [ ] **Step 3: Run it and watch it fail**

Run: `npm test -- src/app/index.test.tsx`
Expected: FAIL (the template home does not say "Workout", or the test libraries aren't installed yet).

- [ ] **Step 4: Make it pass**

Install `jest-expo`, `jest`, `@testing-library/react-native`, `@types/jest` at the versions `npx expo install` picks for SDK 58. Set `"test": "jest"` and the `jest-expo` preset in `package.json`, with `testPathIgnorePatterns` covering `/node_modules/` and `/saved/` (the review tool has its own Python and node tests). Set `strict: true` in `tsconfig.json`, and exclude `saved/` from it. Make `src/app/index.tsx` render a centered "Workout" title.

- [ ] **Step 5: Verify**

Run: `npm test` then `npx tsc --noEmit`
Expected: 1 passed; tsc exits 0.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: scaffold Expo SDK 58 app with jest"
```

---

### Task 2: Library types, vocabularies and validator

**Files:**
- Create: `src/library/vocab.ts`, `src/library/types.ts`, `src/library/validate.ts`
- Test: `src/library/validate.test.ts`

**Interfaces:**
- Produces in `src/library/vocab.ts` (each a readonly tuple, with a matching union type exported from `types.ts`):
  `EXERCISE_TYPES`, `TAG_MUSCLES`, `BUDGET_MUSCLES`, `PURPOSES` (values per Global Constraints),
  `PATTERNS = ['squat','hinge','lunge','push-horizontal','push-vertical','pull-horizontal','pull-vertical','carry','core','isolation']`,
  `EQUIPMENT = ['barbell','dumbbell','cable','machine','kettlebell','bands','bodyweight','bench','pull-up bar','cardio machine','mat','other']`,
  `POSITIONS = ['standing','seated','floor']`, `LOCATIONS = ['gym','home']`.
- Produces in `src/library/types.ts`:

```ts
export type Dose =
  | { format: 'reps'; min: number; max: number }
  | { format: 'hold'; seconds: number }
  | { format: 'duration'; minutes: number };

export interface Exercise {
  id: string;                  // stable slug; fedb id for database entries
  name: string;
  source: 'fedb' | 'custom' | 'instagram';
  type: ExerciseType;
  pattern: Pattern | null;     // null for stretch/mobility items with no loading pattern
  muscles: TagMuscle[];        // target regions, any type
  primary: BudgetMuscle[];     // strength only: counts 1.0 toward the weekly budget
  secondary: BudgetMuscle[];   // strength only: counts 0.5
  equipment: Equipment[];      // [] = no equipment
  location: Location[];
  position: Position;
  dose: Dose;
  impact: 'jumping' | 'low' | null;   // conditioning only, else null
  mechanic: 'compound' | 'isolation' | null;
  purposes: Purpose[];
  instructions: string[];
  images: string[];            // fedb-relative paths, not bundled yet
  sourceUrl: string | null;    // Instagram post for source 'instagram'
}
```

- Produces in `src/library/validate.ts`: `validateLibrary(list: Exercise[]): string[]` returning human-readable problems (empty array = valid).

- [ ] **Step 1: Write the failing tests**

A local `ok()` helper returns one fully valid strength `Exercise` (barbell bench press: pattern push-horizontal, primary `['chest']`, secondary `['triceps','frontDelts']`, dose reps 6-10, location `['gym']`).

```ts
test('valid exercise passes', () => expect(validateLibrary([ok()])).toEqual([]));
test('validateLibrary flags duplicate ids', () =>
  expect(validateLibrary([ok(), ok()]).join()).toMatch(/duplicate id/));
test('validateLibrary flags budget muscles on non-strength', () =>
  expect(validateLibrary([{ ...ok(), type: 'stretch' }]).join()).toMatch(/budget muscles.*strength/));
test('stability never counts toward core', () =>
  expect(validateLibrary([{ ...ok(), type: 'stability', primary: [], secondary: ['core'] }]).join()).toMatch(/budget muscles/));
test('unknown vocabulary values are flagged', () => {
  const bad = { ...ok(), muscles: ['pecs'] } as unknown as Exercise;
  expect(validateLibrary([bad]).join()).toMatch(/unknown muscle "pecs"/);
});
test('strength needs a primary muscle and a reps dose', () => {
  expect(validateLibrary([{ ...ok(), primary: [] }]).join()).toMatch(/primary/);
  expect(validateLibrary([{ ...ok(), dose: { format: 'hold', seconds: 30 } }]).join()).toMatch(/reps/);
});
test('impact only on conditioning', () =>
  expect(validateLibrary([{ ...ok(), impact: 'low' }]).join()).toMatch(/impact/));
test('reps range must be ordered and positive', () =>
  expect(validateLibrary([{ ...ok(), dose: { format: 'reps', min: 12, max: 8 } }]).join()).toMatch(/reps range/));
test('no em dash anywhere in text fields', () =>
  expect(validateLibrary([{ ...ok(), name: 'Bench \u2014 flat' }]).join()).toMatch(/em dash/));
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test -- src/library/validate.test.ts`
Expected: FAIL (modules don't exist).

- [ ] **Step 3: Implement `vocab.ts`, `types.ts`, `validate.ts`**

Each problem string starts with the entry id, e.g. `bench-press: budget muscles are only allowed on strength`.

- [ ] **Step 4: Run to verify they pass**

Run: `npm test -- src/library/validate.test.ts`
Expected: 9 passed.

- [ ] **Step 5: Commit**

```bash
git add src/library
git commit -m "feat(library): exercise types, vocabularies and validator"
```

---

### Task 3: Library build pipeline

**Files:**
- Create: `scripts/library/fetch-fedb.mjs`, `scripts/library/vendor/free-exercise-db.json` (fetched output, committed), `src/library/build.ts`, `scripts/library/build-library.ts`
- Create (empty starters, filled in Task 4): `scripts/library/curation.json` = `[]`, `scripts/library/custom.json` = `[]`
- Test: `src/library/build.test.ts`

**Interfaces:**
- Consumes: `Exercise`, `validateLibrary` from Task 2.
- Produces in `src/library/build.ts`:
  - `FedbEntry` type mirroring the database record (`id, name, force, level, mechanic, equipment, primaryMuscles, secondaryMuscles, instructions, category, images`).
  - `CurationEntry = { fedbId: string } & Partial<Exercise>` with required keys `type, pattern, primary, secondary, location, position, dose` (fields not given are derived from the database record).
  - `CustomEntry = Exercise` (complete, `source: 'custom'`).
  - `buildLibrary(fedb: FedbEntry[], curation: CurationEntry[], custom: CustomEntry[]): Exercise[]`: maps each curation entry onto its database record, appends custom entries, sorts by `id`, runs `validateLibrary`, and throws `Error` listing every problem if any.
  - Derivation rules: `name` and `instructions` from the record; `muscles` from the record's primary + secondary muscles (already region vocabulary); `equipment` mapped (`body only`/null to `[]` or `bodyweight`, `kettlebells` to `kettlebell`, `e-z curl bar` to `barbell`, `exercise ball`/`medicine ball`/`foam roll` to `other`); `mechanic` from the record; `images` from the record; `source: 'fedb'`; `impact`, `purposes`, `sourceUrl` default to `null`/`[]`/`null` unless the curation entry sets them.
- Produces CLI `npm run library` = `tsx scripts/library/build-library.ts`, which reads the three JSON files and writes `src/library/library.json` (2-space indent, trailing newline).
- `fetch-fedb.mjs` downloads `https://raw.githubusercontent.com/yuhonas/free-exercise-db/f00c92c7dcf1/dist/exercises.json` (use the full commit sha resolved from that prefix) into `vendor/`. It is run once; the file is committed so builds never need the network.

- [ ] **Step 1: Write the failing tests** (fixtures inline: two small `FedbEntry` records)

```ts
test('buildLibrary maps a curation entry onto its fedb record', () => {
  const [ex] = buildLibrary([fedbBench], [curBench], []);
  expect(ex).toMatchObject({ id: 'Barbell_Bench_Press', name: fedbBench.name, source: 'fedb', equipment: ['barbell'], muscles: ['chest', 'triceps'] });
});
test('buildLibrary throws on unknown fedb id', () =>
  expect(() => buildLibrary([fedbBench], [{ ...curBench, fedbId: 'Nope' }], [])).toThrow(/unknown fedb id "Nope"/));
test('custom entries are appended and output is sorted by id', () =>
  expect(buildLibrary([fedbBench], [curBench], [customBirdDog]).map(e => e.id)).toEqual(['Barbell_Bench_Press', 'bird-dog']));
test('invalid result throws with every problem', () =>
  expect(() => buildLibrary([fedbBench], [{ ...curBench, type: 'stretch' }], [])).toThrow(/budget muscles/));
test('build output is deterministic', () => {
  const a = JSON.stringify(buildLibrary([fedbBench], [curBench], [customBirdDog]));
  const b = JSON.stringify(buildLibrary([fedbBench], [curBench], [customBirdDog]));
  expect(a).toBe(b);
});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test -- src/library/build.test.ts`
Expected: FAIL (`build.ts` missing).

- [ ] **Step 3: Implement `build.ts`, the CLI and the fetch script; run the fetch once**

Run: `node scripts/library/fetch-fedb.mjs`
Expected: `vendor/free-exercise-db.json` with 876 entries.

- [ ] **Step 4: Run to verify they pass, and that the CLI runs on the empty starters**

Run: `npm test -- src/library/build.test.ts && npm run library`
Expected: 5 passed; `src/library/library.json` written as `[]`.

- [ ] **Step 5: Commit**

```bash
git add scripts/library src/library/build.ts src/library/build.test.ts src/library/library.json package.json package-lock.json
git commit -m "feat(library): pinned free-exercise-db and deterministic build pipeline"
```

---

### Task 4: Curate the library

This task is mostly authoring data: Claude picks the database entries and writes the custom ones, using the design doc's session template and weekly budget as the brief.

**Files:**
- Modify: `scripts/library/curation.json`, `scripts/library/custom.json`
- Generated: `src/library/library.json`
- Test: `src/library/library.test.ts`

**Interfaces:**
- Consumes: `buildLibrary` CLI from Task 3, vocab from Task 2.
- Produces: the committed `src/library/library.json`, imported by Plan 2 as `import library from '@/library/library.json'` (typed via `as Exercise[]` after `validateLibrary` passes in a test).

- [ ] **Step 1: Write the coverage tests against the real `library.json`**

```ts
const lib = library as Exercise[];
const gymStrength = lib.filter(e => e.type === 'strength' && e.location.includes('gym') && e.purposes.length === 0);
test('library validates', () => expect(validateLibrary(lib)).toEqual([]));
test('size is in range', () => { expect(lib.length).toBeGreaterThanOrEqual(150); expect(lib.length).toBeLessThanOrEqual(200); });
test.each(BUDGET_MUSCLES)('at least 3 gym strength options with %s as primary', m =>
  expect(gymStrength.filter(e => e.primary.includes(m)).length).toBeGreaterThanOrEqual(3));
test.each(['squat','hinge','lunge','push-horizontal','push-vertical','pull-horizontal','pull-vertical'] as const)(
  'at least 2 compound main-lift options for %s', p =>
  expect(gymStrength.filter(e => e.pattern === p && e.mechanic === 'compound').length).toBeGreaterThanOrEqual(2));
test('at least 10 mobility warm-up items', () => expect(lib.filter(e => e.type === 'mobility').length).toBeGreaterThanOrEqual(10));
test.each(['lower back','thoracic spine','hip flexors','hamstrings','glutes'] as const)('at least 2 stretches for %s', m =>
  expect(lib.filter(e => e.type === 'stretch' && e.muscles.includes(m)).length).toBeGreaterThanOrEqual(2));
test('desk reset coverage', () => {
  const desk = lib.filter(e => (e.type === 'stretch' || e.type === 'mobility') && e.position !== 'floor' && e.equipment.length === 0);
  expect(desk.length).toBeGreaterThanOrEqual(8);
  for (const m of ['lower back','thoracic spine','hip flexors','hamstrings','glutes'] as const)
    expect(desk.some(e => e.muscles.includes(m))).toBe(true);
});
test('conditioning has at least 6 options, 3 of them low-impact', () => {
  const c = lib.filter(e => e.type === 'conditioning');
  expect(c.length).toBeGreaterThanOrEqual(6);
  expect(c.filter(e => e.impact === 'low').length).toBeGreaterThanOrEqual(3);
});
test('at least 5 stability items', () => expect(lib.filter(e => e.type === 'stability').length).toBeGreaterThanOrEqual(5));
test('home location only on mobility, stretch and stability', () =>
  expect(lib.filter(e => e.location.includes('home') && !['mobility','stretch','stability'].includes(e.type))).toEqual([]));
```

- [ ] **Step 2: Run to verify they fail**

Run: `npm test -- src/library/library.test.ts`
Expected: FAIL (library is `[]`).

- [ ] **Step 3: Author `curation.json` and `custom.json`, then rebuild**

Selection rules (designer's call, from the design doc):
- Prefer standard commercial-gym movements a beginner-to-intermediate lifter can do safely. Skip olympic lifts, strongman and most powerlifting variants, plus near-duplicate variants (keep at most 3 per movement).
- Delts: `shoulders` in the database becomes `sideDelts`, `rearDelts` or `frontDelts` in `primary`/`secondary`, decided per exercise (lateral raise = side; reverse fly / face pull = rear; overhead press = front primary, side secondary). Rotator cuff drills are `stability`, with no budget muscles.
- `abdominals` strength work (cable crunch, hanging leg raise, ab wheel) gets budget muscle `core`; planks, dead bugs, bird dogs and Pallof presses are `stability` with none.
- Rep ranges: compounds 5-10 or 6-12, isolation 10-15 or 12-20, stretch holds 30 s, mobility reps 6-10 or 5-8 per side.
- `location: ['gym','home']` only for mobility, stretch and stability items that need no gym equipment.
- `purposes` stay empty on database and custom entries unless the item exists specifically for a purpose (for example a wrist drill gets `wrists`). Purpose-tagged items are kept out of main slots by Plan 2, so tag sparingly.
- Custom entries (about 20) fill the gaps found on 2026-11-22: bird dog, side plank, thread the needle, open book, couch stretch, pigeon stretch, cobra / sphinx, cat-cow, seated figure-4 stretch, standing hamstring hinge at a desk, seated thoracic rotation, doorway pec stretch, chin tucks, rowing machine, assault/air bike intervals, incline treadmill walk, jump rope, burpees, kettlebell swing (two-hand), farmer carry. Write short, plain instructions (3-5 steps). `images: []`.

Run: `npm run library`
Expected: exits 0 and writes `src/library/library.json`.

- [ ] **Step 4: Run all tests**

Run: `npm test && npx tsc --noEmit`
Expected: all pass, tsc exits 0.

- [ ] **Step 5: Write a readable list for the owner**

Create `docs/library/2026-11-22-curated-library.md` (header: Date, Content Type: Reference) with one table per type: name, primary muscles, equipment, dose. The owner may skim it; it is not a required review.

- [ ] **Step 6: Commit**

```bash
git add scripts/library src/library docs/library
git commit -m "feat(library): curated base library of gym, mobility, stretch and conditioning exercises"
```
