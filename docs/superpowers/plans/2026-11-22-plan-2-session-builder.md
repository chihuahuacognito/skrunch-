**Date**: 2026-11-22
**Content Type**: Implementation Plan

# Plan 2 - Session Builder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A pure TypeScript session builder that turns (library, history, check-in, location, date) into ranked focus options, a full ~60 minute session, and a desk reset.

**Architecture:** Plain functions in `src/builder/`, no React Native, no clock, no randomness: the date is an input and variety comes from a stable string hash of the date.
History is a plain data type defined here; Plan 4 persists it in expo-sqlite and Plan 3 calls `rankFocuses` and `buildSession` from the UI.
The library is passed in, so tests can inject fixture exercises (for example a purpose-tagged strength item).

**Tech Stack:** TypeScript 6 (strict), Jest 30 via jest-expo. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-11-22-workout-app-design.md` (approved). Classification rules: `docs/superpowers/specs/2026-11-22-review-tool-tagging-design.md`.

## Global Constraints

- Branch `feat/plan-2-builder`. Commits carry no AI co-author line (owner's global rule).
- `src/builder/` and `src/library/` never import `react`, `react-native` or any `expo*` package.
- No `Date.now()`, `new Date()` without an argument, or `Math.random()` in `src/builder/`. Same input, same output.
- Dates are `YYYY-MM-DD` strings, compared as UTC calendar days.
- Weights are kilograms.
- Weekly set budget, exactly (low-high): chest 12-16, lats 8-10, midBack 8-10, quads 8-12, hamstrings 6-10, glutes 6-10, sideDelts 8-12, rearDelts 6-10, frontDelts 0-4, biceps 6-10, triceps 6-10, core 6-10, calves 0-8.
- A set counts 1.0 for each primary muscle and 0.5 for each secondary, strength items only. Exception (Plan 1 ruling): frontDelts counts only as a primary, secondary frontDelts credit is 0.
- Recovery: a muscle is not trained again within 48 hours, or 72 hours for quads, hamstrings, glutes and calves after a Lower session.
- No more than 8 direct (primary) sets of one muscle in one session.
- Session template (lifting focus): warm-up 6-8 min, 2 compound main lifts at 5-12 reps with 2-3 min rest, 2-3 superset pairs of non-competing muscles at 10-20 reps with 60-90 s rest, finisher 6-10 min, cool-down 5-7 min always including lower back and hip flexors.
- Check-in: Good = full session, main lifts 1-3 RIR, progression allowed. OK = about 75% of sets, 2-3 RIR, no progression, intervals become Zone 2. Wrecked = options lead with Rest and Mobility, plus a minimum dose of 6-8 sets at 3-4 RIR.
- Never two Lower days in a row. Suggest Rest after 6 training days running. Mobility + Zone 2 is always offered.
- Intervals: at most 2 per rolling 7 days, never on a Lower day or the day before one, always after lifting.
- Block: starts at the low end of each range, +1 set per muscle per week, deload every 5-6 weeks (about half the sets, 3-4 RIR). Three Wrecked check-ins within 7 days bring the deload forward. First week is calibration: low budget, main lifts at 3 RIR.
- Purpose-tagged items fill only warm-up, cool-down, desk reset and Mobility focus, never main lifts or supersets.
- Home location: mobility and stretch items with no equipment only. Stability items are gym-only.
- Desk reset: 5-10 minutes, standing or seated items with no equipment, covering lower back, thoracic spine, hip flexors, hamstrings and glutes.
- Progression: double progression; every set at the top of the rep range and last-set chip not "hard" adds the smallest increment; "hard" holds; "easy" twice in a row may progress.
- Never use the em dash in code, copy or docs.

## Review Focus

- A history that references an exercise id no longer in the library (renamed or removed after an Instagram merge) must be ignored, not crash or count. Pinned in Task 1 (`unknown exercise ids in history are ignored`).
- First launch with empty history must give options and a complete calibration session. Pinned in Task 2 (`empty history gives four options, mobility last`) and Task 4 (`empty history builds a calibration session`).
- Coming back after a long break must not resume a late-block ramp. Pinned in Task 1 (`a 14 day gap restarts the block in calibration`).
- A slot whose every candidate is excluded (all marked "never", or nothing recovered) must be skipped cleanly, never yield `undefined` items. Pinned in Task 4 (`slots with no candidate are skipped, never undefined`).
- Reopening the app after already training today must treat today's session as done. Pinned in Task 2 (`a session logged today blocks the same muscles`).

---

### Task 1: Types, dates, budget, weekly volume and block state

**Files:**
- Create: `src/builder/types.ts`, `src/builder/dates.ts`, `src/builder/budget.ts`, `src/builder/volume.ts`, `src/builder/block.ts`, `src/builder/test-utils/fixtures.ts`
- Test: `src/builder/dates.test.ts`, `src/builder/volume.test.ts`, `src/builder/block.test.ts`, `src/builder/purity.test.ts`

**Interfaces:**
- Consumes: `Exercise`, `Dose`, `BudgetMuscle` from `src/library/types.ts`; `BUDGET_MUSCLES` from `src/library/vocab.ts`.
- Produces (`types.ts`):
  ```ts
  export type CheckIn = 'good' | 'ok' | 'wrecked';
  export type Place = 'gym' | 'home';
  export type FocusId = 'chest-back' | 'lower' | 'shoulders-arms' | 'full-body' | 'conditioning' | 'mobility' | 'rest';
  export type SessionKind = FocusId | 'desk-reset';
  export type SessionDose = 'full' | 'reduced' | 'minimum';
  export type Chip = 'easy' | 'right' | 'hard';
  export type Feedback = 'more' | 'less' | 'never';
  export interface LoggedSet { weight: number | null; reps: number }
  export interface LoggedExercise { exerciseId: string; targetMin: number | null; targetMax: number | null; chip: Chip | null; sets: LoggedSet[] }
  export interface SessionLog { date: string; focus: FocusId; intervals: boolean; exercises: LoggedExercise[] }
  export interface History { sessions: SessionLog[]; checkIns: { date: string; value: CheckIn }[]; feedback: Partial<Record<string, Feedback>> }
  export interface BuilderInput { library: Exercise[]; history: History; today: string; checkIn: CheckIn; place: Place }
  export interface FocusOption { focus: FocusId; dose: SessionDose }
  export type BlockKind = 'warmup' | 'main' | 'superset' | 'finisher' | 'intervals' | 'zone2' | 'core' | 'mobility' | 'stability' | 'cooldown';
  export interface PlannedExercise { exerciseId: string; sets: number; dose: Dose; rir: [number, number] | null; restSeconds: number; weight: number | null; progressed: boolean }
  export interface Block { kind: BlockKind; items: PlannedExercise[] }
  export interface PlannedSession { focus: SessionKind; dose: SessionDose; date: string; place: Place; deload: boolean; calibration: boolean; intervals: boolean; blocks: Block[]; estimatedMinutes: number }
  ```
- Produces (functions):
  - `dates.ts`: `daysBetween(from: string, to: string): number` (to minus from, whole days), `addDays(date: string, n: number): string`.
  - `budget.ts`: `BUDGET: Record<BudgetMuscle, readonly [number, number]>`, `LEGS: readonly BudgetMuscle[]` (quads, hamstrings, glutes, calves), `weeklyTargets(week: number, deload: boolean): Record<BudgetMuscle, number>` = `min(low + week - 1, high)`, or `round(low / 2)` when deloading.
  - `volume.ts`: `setCredit(e: Exercise): Partial<Record<BudgetMuscle, number>>` (the per-set credit with the frontDelts rule), `weeklyVolume(lib: Exercise[], sessions: SessionLog[], today: string): Record<BudgetMuscle, number>` over sessions with `daysBetween(date, today)` in 0..6, counting logged sets of strength items only.
  - `block.ts`: `blockState(history: History, today: string): { week: number; deload: boolean; calibration: boolean }`.
  - `test-utils/fixtures.ts` (test helper, not shipped code): `emptyHistory(): History`, `logged(date: string, focus: FocusId, items: [exerciseId: string, sets: number][], opts?: { intervals?: boolean; reps?: number; weight?: number | null }): SessionLog`.

`blockState` rules (the spec leaves the exact window open; these are the decisions):
- No sessions: week 1, calibration, no deload.
- The block starts at the first session. A gap of 14 or more days between sessions, or between the last session and `today`, starts a new block in calibration at the session after the gap (or at `today`).
- Block weeks are 7-day windows from the block start. Week 6 is the deload. If any block week `w` holds 3 or more Wrecked check-ins, week `w + 1` is the deload instead.
- The week after a deload starts a new block, week 1, not calibration.

- [ ] **Step 1: Write the failing tests**

```ts
// dates.test.ts
test('daysBetween crosses month and year ends', () => {
  expect(daysBetween('2026-12-31', '2027-01-01')).toBe(1);
  expect(daysBetween('2026-11-22', '2026-11-15')).toBe(-7);
  expect(addDays('2026-02-27', 2)).toBe('2026-03-01');
});

// volume.test.ts (uses the real library)
test('bench press credits chest 1 and triceps 0.5, never frontDelts', () =>
  expect(setCredit(byId('Barbell_Bench_Press'))).toEqual({ chest: 1, triceps: 0.5 }));
test('overhead press credits frontDelts as primary', () =>
  expect(setCredit(byId('Standing_Military_Press')).frontDelts).toBe(1));
test('weekly volume counts the last 7 days including today', () => {
  const s = [logged('2026-11-15', 'chest-back', [['Barbell_Bench_Press', 3]]), logged('2026-11-16', 'chest-back', [['Barbell_Bench_Press', 3]]), logged('2026-11-22', 'chest-back', [['Barbell_Bench_Press', 2]])];
  expect(weeklyVolume(lib, s, '2026-11-22').chest).toBe(5);
});
test('stretch and stability sets never count', () =>
  expect(weeklyVolume(lib, [logged('2026-11-22', 'mobility', [['Plank', 3], ['couch-stretch', 2]])], '2026-11-22').core).toBe(0));
test('unknown exercise ids in history are ignored', () =>
  expect(weeklyVolume(lib, [logged('2026-11-22', 'lower', [['Deleted_Lift', 4]])], '2026-11-22')).toEqual(weeklyVolume(lib, [], '2026-11-22')));

// block.test.ts (first session 2026-11-01, one session per listed date)
test('empty history is week 1 calibration', () => expect(blockState(emptyHistory(), '2026-11-22')).toEqual({ week: 1, deload: false, calibration: true }));
test('day 10 of a block is week 2', () => expect(blockState(h(['2026-11-01', '2026-11-09']), '2026-11-11')).toMatchObject({ week: 2, calibration: false }));
test('week 6 is the deload', () => expect(blockState(weekly('2026-11-01', 6), '2026-12-06').deload).toBe(true));
test('the week after a deload is week 1 of a new block, not calibration', () =>
  expect(blockState(weekly('2026-11-01', 7), '2026-12-13')).toEqual({ week: 1, deload: false, calibration: false }));
test('three wrecked check-ins in week 2 make week 3 the deload', () => { /* checkIns wrecked on 11-08, 11-10, 11-12 */ expect(blockState(hw, '2026-11-16')).toMatchObject({ week: 3, deload: true }); });
test('a 14 day gap restarts the block in calibration', () =>
  expect(blockState(weekly('2026-09-01', 5), '2026-11-22')).toEqual({ week: 1, deload: false, calibration: true }));
test('weeklyTargets ramps from the low end and caps at the high end', () => {
  expect(weeklyTargets(1, false).chest).toBe(12);
  expect(weeklyTargets(5, false).lats).toBe(10);
  expect(weeklyTargets(3, true).chest).toBe(6);
  expect(weeklyTargets(5, false).frontDelts).toBe(4);
});

// purity.test.ts: read every non-test .ts file under src/builder and src/library with fs
test('builder and library never import React Native or Expo', () => expect(offenders(/from ['"](react|react-native|expo[^'"]*)['"]/)).toEqual([]));
test('builder never reads the clock or randomness', () => expect(offenders(/Date\.now\(|new Date\(\)|Math\.random\(/)).toEqual([]));
```

`h`, `weekly(start, n)` (one session every 7 days for n weeks) and `byId` are small local helpers in the test files.

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/builder`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `types.ts`, `dates.ts`, `budget.ts`, `volume.ts`, `block.ts`, `test-utils/fixtures.ts` with the signatures above**

`dates.ts` parses with `Date.UTC(y, m - 1, d)`; it is the only place that touches `Date`, and always with arguments.

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest && npm run -s typecheck`
Expected: all suites PASS, typecheck clean.

- [ ] **Step 5: Commit**

```bash
git add src/builder
git commit -m "feat(builder): history types, weekly volume, budget targets and block state"
```

---

### Task 2: Recovery, focus specs and focus ranking

**Files:**
- Create: `src/builder/recovery.ts`, `src/builder/focus.ts`, `src/builder/rank.ts`
- Test: `src/builder/recovery.test.ts`, `src/builder/rank.test.ts`

**Interfaces:**
- Consumes: Task 1 types, `daysBetween`, `weeklyVolume`, `weeklyTargets`, `blockState`, `LEGS`, `BUDGET`.
- Produces:
  - `recovery.ts`: `unrecovered(lib: Exercise[], sessions: SessionLog[], today: string): Set<BudgetMuscle>`. A muscle is unrecovered if it got at least one primary set on a session with `daysBetween(date, today)` of 0 or 1, or 0 to 2 for `LEGS` when that session's focus was `lower`.
  - `focus.ts`:
    ```ts
    export interface FocusSpec { mainSlots: Pattern[][]; pool: BudgetMuscle[] }
    export const FOCUS_SPECS: Record<'chest-back' | 'lower' | 'shoulders-arms' | 'full-body', FocusSpec>;
    export const LIFTING_FOCUSES: readonly FocusId[]; // the four keys above
    export type MuscleGroup = 'push' | 'pull' | 'legs' | 'core';
    export const MUSCLE_GROUP: Record<BudgetMuscle, MuscleGroup>;
    ```
    Values:
    - chest-back: mainSlots `[['push-horizontal'], ['pull-horizontal', 'pull-vertical']]`, pool `chest, lats, midBack, rearDelts, core`.
    - lower: mainSlots `[['squat', 'lunge'], ['hinge']]`, pool `quads, hamstrings, glutes, calves, core`.
    - shoulders-arms: mainSlots `[['push-vertical'], ['pull-vertical']]`, pool `sideDelts, rearDelts, biceps, triceps`.
    - full-body: mainSlots `[['squat', 'hinge', 'lunge'], ['push-horizontal', 'pull-horizontal', 'pull-vertical']]`, pool all budget muscles except frontDelts.
    - MUSCLE_GROUP: push = chest, frontDelts, sideDelts, triceps; pull = lats, midBack, rearDelts, biceps; legs = quads, hamstrings, glutes, calves; core = core.
  - `rank.ts`: `rankFocuses(input: BuilderInput): FocusOption[]` and `intervalsAllowed(input: BuilderInput, focus: FocusId): boolean` (Good check-in, fewer than 2 interval sessions in the rolling 7 days, focus is not `lower`).

Ranking rules (the spec marks these thresholds as tunable defaults):
- Home: `[{ focus: 'mobility', dose: 'full' }]` only.
- A lifting focus is eligible when every main slot has at least one gym strength candidate (compound, no purposes, pattern in the slot) whose primary muscles are all recovered. Lower is also ineligible the day after a session with `intervals: true`.
- Lifting score = mean over the focus pool of `clamp((target - done) / target, 0, 1)`, skipping muscles whose target is 0 and unrecovered muscles. Full body's score is multiplied by 0.9 so a specific focus wins a tie.
- Conditioning score = `0.6 * min(1, daysSinceLastConditioning / 4)` (4 when never done).
- Good: the top 3 eligible of lifting plus conditioning by score, then mobility. OK: the same order, all `dose: 'reduced'`. Ties keep `LIFTING_FOCUSES` order, conditioning after.
- Wrecked: `rest` (full), `mobility` (full), then the best eligible lifting focus at `dose: 'minimum'` when one exists.
- Rest first: when each of the 6 days before today has a session whose focus is not `mobility`, prepend `rest` and keep 4 options in total (rest, top 2, mobility).
- Mobility always appears exactly once.

- [ ] **Step 1: Write the failing tests**

```ts
// recovery.test.ts
test('chest trained yesterday is unrecovered, two days ago is recovered', () => {
  expect(unrecovered(lib, [logged('2026-11-21', 'chest-back', [['Barbell_Bench_Press', 3]])], '2026-11-22').has('chest')).toBe(true);
  expect(unrecovered(lib, [logged('2026-11-20', 'chest-back', [['Barbell_Bench_Press', 3]])], '2026-11-22').has('chest')).toBe(false);
});
test('legs need 72 hours after a Lower session but 48 after Full Body', () => {
  expect(unrecovered(lib, [logged('2026-11-20', 'lower', [['Barbell_Squat', 3]])], '2026-11-22').has('quads')).toBe(true);
  expect(unrecovered(lib, [logged('2026-11-20', 'full-body', [['Barbell_Squat', 3]])], '2026-11-22').has('quads')).toBe(false);
});
test('a session logged today blocks the same muscles', () =>
  expect(unrecovered(lib, [logged('2026-11-22', 'chest-back', [['Barbell_Bench_Press', 3]])], '2026-11-22').has('chest')).toBe(true));

// rank.test.ts
const input = (over: Partial<BuilderInput> = {}): BuilderInput => ({ library: lib, history: emptyHistory(), today: '2026-11-22', checkIn: 'good', place: 'gym', ...over });
test('empty history gives four options, mobility last', () => {
  const r = rankFocuses(input());
  expect(r).toHaveLength(4);
  expect(r[3]).toEqual({ focus: 'mobility', dose: 'full' });
});
test('never two Lower days in a row', () => expect(focuses(input({ history: hist([logged('2026-11-21', 'lower', [['Barbell_Squat', 3]])]) }))).not.toContain('lower'));
test('no Lower the day after intervals', () => expect(focuses(input({ history: hist([logged('2026-11-21', 'conditioning', [], { intervals: true })]) }))).not.toContain('lower'));
test('the most under-budget focus ranks first', () => {
  // chest and back trained hard on 11-19, legs untouched all week
  expect(rankFocuses(input({ history: hist([logged('2026-11-19', 'chest-back', [['Barbell_Bench_Press', 6], ['Bent_Over_Barbell_Row', 6], ['Wide-Grip_Lat_Pulldown', 6]])]) }))[0].focus).toBe('lower');
});
test('OK reduces every option', () => expect(rankFocuses(input({ checkIn: 'ok' })).filter(o => o.focus !== 'mobility').every(o => o.dose === 'reduced')).toBe(true));
test('wrecked leads with rest and mobility, then a minimum dose', () => {
  const r = rankFocuses(input({ checkIn: 'wrecked' }));
  expect(r.slice(0, 2).map(o => o.focus)).toEqual(['rest', 'mobility']);
  expect(r[2].dose).toBe('minimum');
});
test('six training days running puts rest first', () => expect(rankFocuses(input({ history: sixDays() }))[0].focus).toBe('rest'));
test('home offers only mobility', () => expect(rankFocuses(input({ place: 'home' }))).toEqual([{ focus: 'mobility', dose: 'full' }]));
test('intervals are capped at two per rolling week and never on Lower', () => {
  const two = hist([logged('2026-11-18', 'conditioning', [], { intervals: true }), logged('2026-11-20', 'conditioning', [], { intervals: true })]);
  expect(intervalsAllowed(input({ history: two }), 'conditioning')).toBe(false);
  expect(intervalsAllowed(input(), 'lower')).toBe(false);
  expect(intervalsAllowed(input({ checkIn: 'ok' }), 'conditioning')).toBe(false);
});
```

Executor: confirm each id used in tests exists in `library.json` before running; substitute a same-pattern id if not, and ledger it.

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/builder/recovery src/builder/rank`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `recovery.ts`, `focus.ts`, `rank.ts`**

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest && npm run -s typecheck`
Expected: PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add src/builder
git commit -m "feat(builder): recovery windows and focus ranking"
```

---

### Task 3: Candidate selection and prescription

**Files:**
- Create: `src/builder/select.ts`, `src/builder/prescribe.ts`
- Test: `src/builder/select.test.ts`, `src/builder/prescribe.test.ts`

**Interfaces:**
- Consumes: Task 1 and 2 outputs.
- Produces:
  - `select.ts`:
    - `hash01(key: string): number`: FNV-1a 32-bit of the string, divided by 2^32, so in [0, 1).
    - `type SlotKind = 'main' | 'superset'`
    - `interface SelectContext { lib: Exercise[]; history: History; today: string; focus: FocusId; place: Place; used: Set<string>; blocked: Set<BudgetMuscle>; deficit: Record<BudgetMuscle, number> }` where `deficit` is the clamped 0..1 fraction from Task 2.
    - `rankCandidates(ctx: SelectContext, slot: { kind: SlotKind; patterns?: Pattern[]; muscle?: BudgetMuscle; key: string }): Exercise[]`, best first. Plan 4's swap list reuses it.
  - `prescribe.ts`:
    - `prescribeReps(dose: Dose, kind: SlotKind): Dose`: main clamps both bounds into 5-12, superset clamps min into 10-20 and max into 12-20, then `min <= max`. Non-reps doses pass through.
    - `rirFor(dose: SessionDose, calibration: boolean, deload: boolean): [number, number]`: deload or minimum `[3, 4]`, calibration `[3, 3]`, reduced `[2, 3]`, full `[1, 3]`.
    - `INCREMENT_KG: Record<Equipment, number>`: barbell 2.5, dumbbell 2.5, cable 2.5, machine 5, kettlebell 4, all others 2.5.
    - `nextLoad(e: Exercise, history: History, allowProgression: boolean): { weight: number | null; progressed: boolean }`.

Selection rules:
- Filter: strength, `purposes` empty, `location` includes the place, `feedback !== 'never'`, not in `used`, no primary muscle in `blocked`. Main slots also need `mechanic === 'compound'` and a pattern in `slot.patterns`. Superset slots need `primary` to include `slot.muscle`.
- Score: `+2` for feedback `more`, `-2` for `less`; mean `deficit` of the primary muscles; main: `+1` if logged in this focus within the last 14 days (keeps lifts stable so progression works); superset: `-1` if logged in either of the last 2 sessions (variety), `+0.5` if `mechanic === 'isolation'`; plus `0.5 * hash01(today + slot.key + id)`. Sort by score, then id.

`nextLoad` rules: take the most recent `LoggedExercise` for the id (by session date). None, or its first set's weight is null: `{ weight: null, progressed: false }`. Progress by `INCREMENT_KG[e.equipment[0]]` (2.5 when equipment is empty) when `allowProgression` and either (every set's reps >= `targetMax` and `chip !== 'hard'`) or (this and the previous log both have `chip === 'easy'`). Otherwise keep the first set's weight.

- [ ] **Step 1: Write the failing tests**

```ts
// prescribe.test.ts
test('main reps clamp into 5-12, supersets into 10-20', () => {
  expect(prescribeReps({ format: 'reps', min: 4, max: 8 }, 'main')).toEqual({ format: 'reps', min: 5, max: 8 });
  expect(prescribeReps({ format: 'reps', min: 6, max: 10 }, 'superset')).toEqual({ format: 'reps', min: 10, max: 12 });
  expect(prescribeReps({ format: 'hold', seconds: 30 }, 'main')).toEqual({ format: 'hold', seconds: 30 });
});
test('rir by dose', () => {
  expect(rirFor('full', false, false)).toEqual([1, 3]);
  expect(rirFor('full', true, false)).toEqual([3, 3]);
  expect(rirFor('reduced', false, false)).toEqual([2, 3]);
  expect(rirFor('full', false, true)).toEqual([3, 4]);
  expect(rirFor('minimum', false, false)).toEqual([3, 4]);
});
test('first appearance has a blank weight', () => expect(nextLoad(bench, emptyHistory(), true)).toEqual({ weight: null, progressed: false }));
test('top of range on every set adds the smallest increment', () => expect(nextLoad(bench, histWith(bench, { reps: 10, targetMax: 10, weight: 60, chip: null }), true)).toEqual({ weight: 62.5, progressed: true }));
test('hard holds the weight', () => expect(nextLoad(bench, histWith(bench, { reps: 10, targetMax: 10, weight: 60, chip: 'hard' }), true).weight).toBe(60));
test('easy twice in a row progresses below the top of the range', () => expect(nextLoad(bench, twoEasy(bench, { reps: 8, targetMax: 10, weight: 60 }), true).progressed).toBe(true));
test('no progression when not allowed', () => expect(nextLoad(bench, histWith(bench, { reps: 10, targetMax: 10, weight: 60, chip: null }), false)).toEqual({ weight: 60, progressed: false }));
test('machines step by 5 kg', () => expect(nextLoad(legPress, histWith(legPress, { reps: 12, targetMax: 12, weight: 100, chip: null }), true).weight).toBe(105));

// select.test.ts
test('hash01 is stable and in range', () => { expect(hash01('a')).toBe(hash01('a')); expect(hash01('a')).toBeGreaterThanOrEqual(0); expect(hash01('a')).toBeLessThan(1); });
test('purpose-tagged strength items never fill a main or superset slot', () => {
  const tagged = { ...byId('Barbell_Bench_Press'), id: 'ig-bench', purposes: ['shoulder health'] } as Exercise;
  const ids = rankCandidates(ctx({ lib: [...lib, tagged] }), { kind: 'main', patterns: ['push-horizontal'], key: 'm1' }).map(e => e.id);
  expect(ids).not.toContain('ig-bench');
});
test('never-feedback excludes, more-feedback promotes', () => {
  const r = rankCandidates(ctx({ feedback: { Barbell_Bench_Press: 'never', Dumbbell_Bench_Press: 'more' } }), { kind: 'main', patterns: ['push-horizontal'], key: 'm1' });
  expect(r.map(e => e.id)).not.toContain('Barbell_Bench_Press');
  expect(r[0].id).toBe('Dumbbell_Bench_Press');
});
test('candidates hitting a blocked muscle are excluded', () =>
  expect(rankCandidates(ctx({ blocked: new Set(['chest']) }), { kind: 'main', patterns: ['push-horizontal'], key: 'm1' }).every(e => !e.primary.includes('chest'))).toBe(true));
test('the same date gives the same order, a different date can differ', () => {
  const a = rankCandidates(ctx(), { kind: 'superset', muscle: 'biceps', key: 's1' });
  expect(rankCandidates(ctx(), { kind: 'superset', muscle: 'biceps', key: 's1' })).toEqual(a);
});
```

`ctx(over)` builds a `SelectContext` for focus `chest-back`, place gym, today `2026-11-22`, empty sets, all deficits 1.

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/builder/select src/builder/prescribe`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `select.ts` and `prescribe.ts`**

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest && npm run -s typecheck`
Expected: PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add src/builder
git commit -m "feat(builder): candidate scoring, rep and RIR prescription, double progression"
```

---

### Task 4: Lifting session assembly and time estimate

**Files:**
- Create: `src/builder/estimate.ts`, `src/builder/session.ts`, `src/builder/parts.ts`
- Test: `src/builder/estimate.test.ts`, `src/builder/session.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `estimate.ts`: `estimateMinutes(blocks: Block[]): number`, rounded to the nearest minute. Work per set: reps 45 s, hold `seconds`, duration `minutes * 60`. A non-superset item takes `sets * (work + restSeconds)`. A superset block takes `rounds * (sum of item work + rest of the last item)`, where rounds is the item's `sets`.
  - `parts.ts` (shared by Task 5): `warmup(ctx, regions: TagMuscle[]): Block` (one low-impact Zone 2 machine at 3 minutes plus 3 mobility items targeting `regions`, rest 15 s), `cooldown(ctx, regions: TagMuscle[]): Block` (4 stretches: the first includes `lower back`, the second `hip flexors`, two more matching `regions`; sets `ceil(60 / seconds)`, rest 15 s), `finisher(ctx, intervals: boolean): Block`, `BUDGET_TO_REGION: Record<BudgetMuscle, TagMuscle>` (chest->chest, lats->lats, midBack->middle back, quads->quadriceps, hamstrings->hamstrings, glutes->glutes, the three delts->shoulders, biceps->biceps, triceps->triceps, core->abdominals, calves->calves).
  - `session.ts`: `buildSession(input: BuilderInput, option: FocusOption): PlannedSession`. Task 5 adds the non-lifting branches; this task handles the four lifting focuses.

Conditioning items split by data, no schema change: Zone 2 = conditioning with a `duration` dose of 10 minutes or more; intervals = every other conditioning item.
The finisher is a Zone 2 machine at 8 minutes, or, when intervals are allowed, one interval item: duration items get `sets = max(1, round(8 / minutes))`, reps items get 4 sets, rest 45 s.
Warm-up and finisher machines are chosen by `hash01`, and purpose-tagged mobility and stretch items are allowed there.

Lifting session shape:

| Dose | Main | Supersets | RIR | Progression | Finisher |
|---|---|---|---|---|---|
| full | 2 lifts x 3 sets, rest 150 s | 2 pairs x 3 sets, rest 75 s | `rirFor` | yes | intervals if `intervalsAllowed`, else Zone 2 |
| reduced | 2 lifts x 3 sets | 2 pairs x 2 sets | [2, 3] | no | Zone 2 |
| minimum, or any deload | 2 lifts x 2 sets | 1 pair x 2 sets | [3, 4] | no | none |

- Main slots fill in `FOCUS_SPECS` order with `rankCandidates`. Full body's second slot first tries the pattern list's first pattern with the most-under-budget muscle (ties by list order); the plain list is the fallback.
- Superset muscles: the pool sorted by deficit (descending, ties by pool order), skipping blocked muscles, muscles whose target is 0, muscles where this session's primary sets plus the new sets would pass 8, and muscles whose weekly done plus the new sets would pass the range high (the frontDelts 0-4 ceiling falls out of this). Pair the first muscle with the next one from a different `MUSCLE_GROUP`. A muscle with no partner forms a one-item block.
- `blocked` passed to `rankCandidates` is the unrecovered set plus every muscle whose weekly done plus this slot's sets would pass its range high. This applies to main slots too, so the frontDelts 0-4 ceiling holds for overhead presses.
- A slot with no candidate is skipped. If a main slot is skipped, add one more superset pair when the pool still has unused muscles.
- Warm-up regions: the tag regions of the main lifts' primary muscles, plus `hip flexors` for lower and full body and `thoracic spine` for the others. Cool-down regions: the session's trained primary regions.
- `weight` and `progressed` come from `nextLoad`, with progression allowed only when the dose is full, the check-in is good and it is not a deload. The reps dose comes from `prescribeReps`.
- `intervals` is true only when the finisher holds an interval item.

- [ ] **Step 1: Write the failing tests**

```ts
// estimate.test.ts
test('estimate sums sets, work and rest, supersets per round', () =>
  expect(estimateMinutes([
    { kind: 'main', items: [item({ sets: 3, dose: reps(6, 10), restSeconds: 150 })] },        // 3 * 195 = 585 s
    { kind: 'superset', items: [item({ sets: 3, dose: reps(10, 15), restSeconds: 75 }), item({ sets: 3, dose: reps(10, 15), restSeconds: 75 })] }, // 3 * 165 = 495 s
  ])).toBe(18));

// session.test.ts
const good = (focus: FocusId, over = {}) => buildSession(input(over), { focus, dose: 'full' });
test.each(['chest-back', 'lower', 'shoulders-arms', 'full-body'] as const)('%s follows the template order and fits the hour', f => {
  const s = good(f);
  expect(s.blocks.map(b => b.kind)).toEqual(['warmup', 'main', 'superset', 'superset', 'finisher', 'cooldown']);
  expect(s.estimatedMinutes).toBeGreaterThanOrEqual(45);
  expect(s.estimatedMinutes).toBeLessThanOrEqual(65);
});
test('main lifts are compound and 5-12 reps, superset items 10-20', () => { /* every main item: mechanic compound, dose within 5-12; every superset item within 10-20 */ });
test('superset pairs never pair muscles from the same group', () => { /* MUSCLE_GROUP of each pair's first primary differs */ });
test('cool-down always covers lower back and hip flexors', () => { /* regions of cooldown items include both */ });
test('no muscle gets more than 8 direct sets in one session', () => { /* sum primary sets per muscle <= 8, for every lifting focus */ });
test('front delts never pass 4 direct sets in the rolling week', () => {
  const s = good('shoulders-arms', { history: hist([logged('2026-11-19', 'shoulders-arms', [['Standing_Military_Press', 3]])]) });
  expect(directSets(s, 'frontDelts')).toBe(0);
});
test('OK has about 75% of the sets of Good', () => {
  const ratio = totalSets(buildSession(input({ checkIn: 'ok' }), { focus: 'chest-back', dose: 'reduced' }), ['main', 'superset']) / totalSets(good('chest-back'), ['main', 'superset']);
  expect(ratio).toBeGreaterThanOrEqual(0.7);
  expect(ratio).toBeLessThanOrEqual(0.8);
});
test('minimum dose is 6-8 sets at 3-4 RIR with no finisher', () => { /* 6 <= lifting sets <= 8, every rir [3,4], no 'finisher' block */ });
test('a Lower session never gets an interval finisher', () => expect(good('lower').intervals).toBe(false));
test('empty history builds a calibration session', () => {
  const s = good('chest-back');
  expect(s.calibration).toBe(true);
  expect(s.blocks.find(b => b.kind === 'main')!.items.every(i => i.weight === null && i.rir![0] === 3)).toBe(true);
});
test('slots with no candidate are skipped, never undefined', () => {
  const never = Object.fromEntries(lib.filter(e => e.pattern === 'push-vertical').map(e => [e.id, 'never' as const]));
  const s = good('shoulders-arms', { history: { ...emptyHistory(), feedback: never } });
  expect(s.blocks.flatMap(b => b.items).every(Boolean)).toBe(true);
  expect(s.blocks.find(b => b.kind === 'main')!.items).toHaveLength(1);
  expect(s.blocks.filter(b => b.kind === 'superset').length).toBeGreaterThanOrEqual(2);
});
test('buildSession is deterministic', () => expect(good('full-body')).toEqual(good('full-body')));
```

The commented tests are written out in full by the executor; their assertion is the comment.

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/builder/estimate src/builder/session`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `estimate.ts`, `parts.ts`, `session.ts`**

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest && npm run -s typecheck`
Expected: PASS, clean. If a time-window test fails, change only the counts in the shape table (not the window) and ledger a ruling.

- [ ] **Step 5: Commit**

```bash
git add src/builder
git commit -m "feat(builder): lifting session assembly with warm-up, supersets, finisher and cool-down"
```

---

### Task 5: Conditioning, mobility, rest, home, desk reset and a 4-week simulation

**Files:**
- Modify: `src/builder/session.ts`
- Create: `src/builder/desk.ts`, `src/builder/index.ts`, `src/builder/test-utils/simulate.ts`
- Test: `src/builder/templates.test.ts`, `src/builder/desk.test.ts`, `src/builder/simulate.test.ts`

**Interfaces:**
- Consumes: everything above.
- Produces:
  - `buildSession` now handles every `FocusId`:
    - `rest`: no blocks, 0 minutes.
    - `conditioning` (gym): warm-up; then either an `intervals` block (2 interval items, about 20 minutes, when `intervalsAllowed`) or a `zone2` block (one Zone 2 machine at 30 minutes, 20 at reduced dose); then a `core` block (2 core-primary strength items x 3 sets at 10-15 reps, they count toward the core budget) and a `stability` block (1 item); cool-down.
    - `mobility` (gym): a `zone2` block (20 minutes, a treadmill walk when the check-in is wrecked), a `mobility` block (6 items), a `stability` block (2 items), cool-down with 5 stretches. Purpose-tagged items are allowed in every block except `zone2`.
    - `mobility` (home): a `mobility` block (8 items) and a cool-down (6 stretches), no-equipment mobility and stretch items only.
  - `desk.ts`: `buildDeskReset(lib: Exercise[], today: string): PlannedSession` with focus `desk-reset`, 6 to 8 items in one `mobility` block, standing or seated, no equipment, together covering lower back, thoracic spine, hip flexors, hamstrings and glutes, 5-10 estimated minutes, varied by `hash01(today + id)`.
  - `index.ts` re-exports: `rankFocuses`, `buildSession`, `buildDeskReset`, `rankCandidates`, `nextLoad`, `weeklyVolume`, `blockState`, and every type in `types.ts`.
  - `test-utils/simulate.ts`: `simulate(lib: Exercise[], start: string, days: number, pattern: CheckIn[]): { sessions: PlannedSession[]; history: History }`. Each day it ranks with the check-in from `pattern[day % pattern.length]`, picks the first option, and logs the built session as done (every set at `targetMax` reps, weight 20 where null, no chip). Rest logs nothing.

- [ ] **Step 1: Write the failing tests**

```ts
// templates.test.ts
test('rest has no blocks', () => expect(buildSession(input(), { focus: 'rest', dose: 'full' })).toMatchObject({ blocks: [], estimatedMinutes: 0 }));
test('conditioning with intervals allowed uses an interval block, OK uses Zone 2', () => {
  expect(kinds(buildSession(input(), { focus: 'conditioning', dose: 'full' }))).toEqual(['warmup', 'intervals', 'core', 'stability', 'cooldown']);
  expect(kinds(buildSession(input({ checkIn: 'ok' }), { focus: 'conditioning', dose: 'reduced' }))).toContain('zone2');
});
test('home mobility uses only no-equipment mobility and stretch items', () => {
  const ids = allItems(buildSession(input({ place: 'home' }), { focus: 'mobility', dose: 'full' }));
  expect(ids.every(e => ['mobility', 'stretch'].includes(e.type) && e.equipment.length === 0)).toBe(true);
});
test('stability items never appear at home', () => { /* no item of type stability in home mobility */ });
test('every session fits the hour', () => { /* every FocusId x check-in combination: estimatedMinutes <= 65 */ });

// desk.test.ts
test('desk reset covers the five regions with standing or seated no-equipment items in 5-10 minutes', () => {
  const d = buildDeskReset(lib, '2026-11-22');
  const items = d.blocks[0].items.map(i => byId(i.exerciseId));
  expect(items.length).toBeGreaterThanOrEqual(6);
  expect(items.every(e => e.position !== 'floor' && e.equipment.length === 0)).toBe(true);
  for (const r of ['lower back', 'thoracic spine', 'hip flexors', 'hamstrings', 'glutes']) expect(items.some(e => e.muscles.includes(r))).toBe(true);
  expect(d.estimatedMinutes).toBeGreaterThanOrEqual(5);
  expect(d.estimatedMinutes).toBeLessThanOrEqual(10);
});
test('desk reset varies across days', () => { /* item lists for 7 consecutive dates are not all identical */ });

// simulate.test.ts: 28 days of Good check-ins from 2026-11-01
const run = simulate(lib, '2026-11-01', 28, ['good']);
test('at least one rest day in every 7', () => { /* each 7-day window of the run has a day with no logged session or focus mobility */ });
test('lower body is never the largest share of sets', () => { /* sets by group: chest+back vs legs vs shoulders+arms; legs < max of the other two; each between 20% and 40% */ });
test('every muscle with a non-zero budget is trained at least twice in each full week', () => { /* weeks 2-4: primary sets on >= 2 distinct days, for every muscle with low > 0 */ });
test('intervals stay within two per rolling week', () => { /* count sessions with intervals in each 7-day window */ });
test('a mixed week of check-ins still respects recovery', () => { /* simulate with ['good','ok','wrecked','good'], no muscle trained on consecutive days, legs 72 h after lower */ });
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/builder/templates src/builder/desk src/builder/simulate`
Expected: FAIL.

- [ ] **Step 3: Implement the new `buildSession` branches, `desk.ts`, `index.ts` and `test-utils/simulate.ts`**

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest && npm run -s typecheck`
Expected: PASS, clean.
If a simulation property fails, tune only the Task 2 scoring constants (the 0.9 full body factor, the 0.6 and 4-day conditioning curve) or the focus pools, never the property, and ledger the ruling with the before and after numbers.

- [ ] **Step 5: Commit**

```bash
git add src/builder
git commit -m "feat(builder): conditioning, mobility, rest and home templates, desk reset, 4-week simulation"
```
