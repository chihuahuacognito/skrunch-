# Muscle-Group Redesign Implementation Plan

**Date**: 2026-11-25
**Content Type**: Implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the arc / check-in / generated-session shell with the owner's flow: a Home screen with a front-and-back body figure and a group grid, a muscle-group screen of exercise cards with photos, exact targets, set dots, Completed, Edit and Undo, plus Cardio, Stretch and History.

**Architecture:** Pure TypeScript keeps doing the thinking. `src/builder` gains group, status, pick and target modules (no React Native imports). `src/store` writes every done set straight to SQLite, and a small "tonight" UI state (rest, opened groups, frozen card lists) lives in the `active_workout` row. A `TonightProvider` at the root owns history, tonight state and serialized writes, and every screen reads from it.

**Tech Stack:** Expo SDK 58, React Native 0.88, Expo Router, expo-sqlite, Reanimated 4, react-native-svg (new), expo-notifications, Jest with jest-expo and node:sqlite.

**Spec:** `docs/superpowers/specs/2026-11-25-muscle-group-redesign-design.md`. Visual references: `docs/design/home-front-back-numbers-grid.pdf` (dark artboard) and `docs/design/muscle-screen-quads/Muscle.dc.html` (`.th-d` values).

## Global Constraints

- Branch `feat/muscle-groups` (already created from `feat/plan-4-workout`, spec committed as `f35c7c4`). Nothing merges to `main` in this plan.
- Dark theme only. The colours are the spec section 5 token table, copied verbatim into `src/theme/tokens.ts`.
- Every element sits in a card; min touch target 44; card radius 20; pills 24-28.
- `src/library` and `src/builder` import no React Native (the `purity.test.ts` and `tsc -p scripts` checks enforce it).
- Screen tests go in `src/__tests__/app`, never in `src/app`.
- "Today" comes from `useToday()` (04:00 local cutoff); never `toISOString()` for dates.
- Commands: `npx tsc --noEmit`, `npx tsc --noEmit -p scripts`, `npx jest`. Never `npm run` (it segfaults in Git Bash).
- Commit messages: conventional prefix, plain dashes, and the attribution line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>` is NOT added (owner's global rule: no agent co-author).
- Tunable constants sit at the top of their module with a one-line comment.

## Review Focus

1. **A double tap on a set dot** (or a tap racing a notification action) must log exactly one set: the dot action carries the dot index and is ignored unless it equals the next open index. Pinned in Task 4 and Task 8.
2. **"Complete set" from the notification after Android killed the app** must log the next set of the resting exercise once, and do nothing when that exercise is already complete. Pinned in Task 6.
3. **The training day rolls over at 04:00 with the app open:** Home and the group screen re-read history and tonight state for the new day; yesterday's rest and opened groups vanish. Pinned in Task 4 (store) and Task 7 (screen).
4. **A loaded exercise with no weight yet:** the first dot and Completed open Edit instead of logging `weight: null`; bodyweight exercises log 0 kg without asking. Pinned in Task 3 and Task 8.
5. **Undo or an Edit to 0 sets on the only exercise of the day** deletes the exercise row and the empty session row, so History never shows an empty day. Pinned in Task 4.

---

## File map

| Path | Status | Responsibility |
|---|---|---|
| `src/theme/tokens.ts` | rewrite | dark tokens from the spec, spacing, type, motion |
| `src/builder/types.ts` | modify | drop check-in types, `focus: string`, `plannedSets` |
| `src/builder/groups.ts` | create | the 9 groups, muscle mapping, group credit, group targets |
| `src/builder/status.ts` | create | per-group week status, cardio week, tonight summary |
| `src/builder/pick.ts` | create | tonight's cards and More list for a group |
| `src/builder/target.ts` | create | exact target per exercise (double progression, cardio) |
| `src/builder/index.ts` | modify | new public API |
| `src/store/schema.ts` | modify | migration v3 |
| `src/store/history.ts` | modify | `planned_sets`, drop check-ins |
| `src/store/log.ts` | create | set-level writes for tonight |
| `src/store/tonight.ts` | create (replaces `workout.ts`) | tonight UI state row |
| `src/tonight/` | create (replaces `src/workout/`) | pure tonight reducer and rest notice |
| `scripts/images/fetch-images.ts`, `assets/exercises/`, `src/ui/images.ts` | create | bundled photos and the require map |
| `src/features/photo/ExercisePhoto.tsx` | create | alternating two-frame photo |
| `src/features/tonight/TonightProvider.tsx` | create | history + tonight state + actions + notification wiring |
| `src/features/body/` | create | SVG figure and region data |
| `src/features/home/` | create | WeekCard, GroupGrid, ActivityCards, TonightStrip |
| `src/features/exercise/` | create | ExerciseCard, SetDots, EditSheet, DetailSheet, RestPanel, TonightBar |
| `src/app/index.tsx`, `group/[id].tsx`, `cardio.tsx`, `stretch.tsx`, `desk.tsx`, `history.tsx` | create / rewrite | screens |

---

### Task 1: Clear the old shell and reshape the types

Removes everything the spec section 11 deletes, so later tasks build on a clean, green tree.

**Files:**
- Delete: `src/features/arc/`, `src/features/workout/`, `src/app/menu.tsx`, `src/app/preview.tsx`, `src/app/workout.tsx`, `src/app/summary.tsx`, `src/workout/`, `src/store/workout.ts` (+ test), `src/ui/useOnceUntilFocus.ts`, `src/builder/rank.ts`, `main.ts`, `session.ts`, `swap.ts`, `tally.ts`, `recovery.ts` and their tests, `src/__tests__/app/{index,menu,preview,summary,workout}.test.tsx`
- Modify: `src/builder/types.ts`, `src/builder/focus.ts` (keep only `PATTERN_MUSCLES`), `src/builder/select.ts` (keep `hash01`, `isMainLift`; delete `SelectContext`, `rankCandidates`), `src/builder/block.ts`, `src/builder/needs.ts`, `src/builder/index.ts`, `src/builder/simulate.test.ts` (delete if it only drove `buildSession`), `src/store/history.ts`, `src/store/schema.ts`, `src/backup/export.ts`, `src/ui/labels.ts`, `src/ui/format.ts`, `src/theme/tokens.ts`, `src/app/index.tsx` (placeholder)
- Test: `src/store/history.test.ts`, `src/builder/block.test.ts`, `src/__tests__/app/routes.test.ts`

**Interfaces:**
- Produces:
  - `type SessionLog = { date: string; focus: string; intervals: boolean; exercises: LoggedExercise[] }` (new rows use `'free'`).
  - `LoggedExercise` gains `plannedSets: number | null`.
  - `History = { sessions: SessionLog[]; feedback: Partial<Record<string, Feedback>> }` (no `checkIns`).
  - `interface GroupInput { library: Exercise[]; history: History; today: string }` replaces `BuilderInput`.
  - `tokens.color` keys exactly as the spec table: `bg, sc, sch, schh, on, onv, ol, olv, pri, onpri, pric, onpric, just, recov, rest, empty, errc, onerrc, okc, onokc`.
  - Migration v3: `ALTER TABLE logged_exercises ADD COLUMN planned_sets INTEGER;`

- [ ] **Step 1: Write the failing tests**

In `src/store/history.test.ts` replace the check-in tests with:

```ts
test('planned sets round-trip and old rows read as null', async () => {
  await saveSession(db, { date: '2026-11-25', focus: 'free', intervals: false, exercises: [
    { exerciseId: 'Barbell_Squat', targetMin: 5, targetMax: 8, chip: null, plannedSets: 3, sets: [{ weight: 60, reps: 6, seconds: null }] },
  ] });
  await db.runAsync("INSERT INTO sessions (date, focus, intervals) VALUES ('2026-11-20', 'lower', 0)");
  const h = await loadHistory(db);
  expect(h.sessions.map(s => s.focus)).toEqual(['lower', 'free']);
  expect(h.sessions[1].exercises[0].plannedSets).toBe(3);
  expect('checkIns' in h).toBe(false);
});

test('migration v3 leaves user_version at 3', async () => {
  expect((await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version).toBe(3);
});
```

In `src/builder/block.test.ts` delete the Wrecked-trigger cases and keep: no sessions is week 1 calibration; week 6 is the deload; a 14-day gap restarts in calibration.

In `src/__tests__/app/routes.test.ts` assert the route list is exactly `['index', 'desk']` for now (later tasks extend it).

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/store/history.test.ts src/builder/block.test.ts`
Expected: FAIL (`plannedSets` missing, user_version 2).

- [ ] **Step 3: Delete the listed files, then fix compile errors outward**

- `block.ts`: drop the Wrecked trigger (the deload is always week 6).
- `needs.ts`: `targetsFor` and `deficits` take `GroupInput`; delete `needs()` if nothing kept uses it.
- `history.ts`: drop `saveCheckIn`, `checkInFor`; read and write `planned_sets`.
- `labels.ts` / `format.ts`: drop focus, check-in, dose and guidance labels and `parseOption`; keep `doseText`, `weightText`, `clock`, `secondsText`, `FEEDBACK_LABEL`.
- `export.ts`: export `sessions` and `feedback` only, plus `plannedSets` per exercise.
- `tokens.ts`: the spec colour table, `space { xs:4, sm:8, md:12, lg:16, xl:24, xxl:40 }`, `radius { card:20, inner:14, pill:28 }`, `font.size { label:11, sub:13, body:15, name:18, target:24, title:30 }`. Delete `arc`, `focusAccent` and the langocard motion values.
- `src/app/index.tsx`: a placeholder `Home` that renders the text "Home" on `bg`, so the router keeps an index.
- Keep `migrate`'s v1 and v2 entries untouched and append v3.

- [ ] **Step 4: Verify everything is green**

Run: `npx tsc --noEmit && npx tsc --noEmit -p scripts && npx jest`
Expected: no type errors; all remaining suites pass.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove the arc, check-in and generated-session shell; schema v3 with planned sets; dark tokens from the redesign spec"
```

---

### Task 2: Groups and the week status

**Files:**
- Create: `src/builder/groups.ts`, `src/builder/status.ts`
- Test: `src/builder/groups.test.ts`, `src/builder/status.test.ts`

**Interfaces:**
- Consumes: `GroupInput`, `History`, `weeklyTargets`-style ramp logic from `budget.ts`, `blockState`, `TRAINED_CREDIT` (1.5), `daysBetween`, `isZone2` / `isInterval` from `parts.ts`.
- Produces:
  - `type GroupId = 'chest' | 'back' | 'shoulders' | 'arms' | 'core' | 'glutes' | 'quads' | 'hamstrings' | 'calves'`
  - `const GROUPS: readonly GroupId[]` in grid order (chest, back, shoulders, arms, core, glutes, quads, hamstrings, calves)
  - `const GROUP_LABEL: Record<GroupId, string>`
  - `const GROUP_MUSCLES: Record<GroupId, BudgetMuscle[]>` (spec 8.1)
  - `groupCredit(e: Exercise): Partial<Record<GroupId, number>>`
  - `groupTargets(week: number, deload: boolean): Record<GroupId, number>`
  - `type Recency = 'just' | 'recovering' | 'rested' | 'never'`
  - `interface GroupStatus { lastWorked: string | null; daysSince: number | null; recency: Recency; sets: number; target: number; behind: boolean }`
  - `groupStatus(input: GroupInput): Record<GroupId, GroupStatus>`
  - `cardioWeek(input: GroupInput): { zone2Minutes: number; zone2Target: number; intervalDays: number; intervalCap: number }`
  - `tonightSummary(input: GroupInput): { groups: GroupId[]; sets: number }`

- [ ] **Step 1: Write the failing tests**

```ts
// groups.test.ts
test('a row set counts once for Back, not once per back muscle', () => {
  const row = ex({ primary: ['midBack', 'lats'], secondary: ['biceps'] });
  expect(groupCredit(row)).toEqual({ back: 1, arms: 0.5 });
});
test('front delts as a secondary give Shoulders nothing (direct work only)', () => {
  expect(groupCredit(ex({ primary: ['chest'], secondary: ['frontDelts', 'triceps'] }))).toEqual({ chest: 1, arms: 0.5 });
});
test('conditioning and stability give no credit', () => {
  expect(groupCredit(ex({ type: 'conditioning', primary: [] }))).toEqual({});
  expect(groupCredit(ex({ type: 'stability', primary: ['core'] }))).toEqual({});
});
test('targets ramp from the low end, deload halves, calves fixed', () => {
  expect(groupTargets(1, false)).toMatchObject({ chest: 12, back: 12, shoulders: 10, arms: 10, core: 6, glutes: 6, quads: 8, hamstrings: 6, calves: 6 });
  expect(groupTargets(9, false).chest).toBe(16);
  expect(groupTargets(6, true)).toMatchObject({ chest: 6, quads: 4, calves: 3 });
});

// status.test.ts - today '2026-11-25', squat (quads primary, glutes secondary) logged 3 sets on 2026-11-20
test('recency, sets and BEHIND for quads and glutes', () => {
  const s = groupStatus(input);
  expect(s.quads).toMatchObject({ lastWorked: '2026-11-20', daysSince: 5, recency: 'rested', sets: 3, behind: true });
  expect(s.glutes).toMatchObject({ sets: 1.5, lastWorked: '2026-11-20' }); // 1.5 credit = worked
  expect(s.chest).toMatchObject({ recency: 'never', daysSince: null, sets: 0, behind: true });
  expect(s.calves.behind).toBe(false);
});
test('recency thresholds 0-1 just, 2-4 recovering, 5+ rested', () => {
  expect([0, 1, 2, 4, 5].map(d => recencyOf(d))).toEqual(['just', 'just', 'recovering', 'recovering', 'rested']);
});
test('sets older than 6 days drop out of the rolling week', () => { /* log on 2026-11-18 -> sets 0, lastWorked kept */ });
test('cardio week sums Zone 2 minutes and counts interval days', () => {
  expect(cardioWeek(input)).toEqual({ zone2Minutes: 25, zone2Target: 150, intervalDays: 1, intervalCap: 2 });
});
test('tonight summary counts logged sets today and the groups they touched', () => {
  expect(tonightSummary(inputWithTonight)).toEqual({ groups: ['quads'], sets: 2 });
});
```

`ex()` is a local helper building an `Exercise` with strength defaults; `input` uses real library ids where it needs them.

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/builder/groups.test.ts src/builder/status.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

- `GROUP_BUDGET` (top of `groups.ts`, tunable): chest [12,16], back [12,16], shoulders [10,14], arms [10,14], core [6,10], glutes [6,10], quads [8,12], hamstrings [6,10]; `CALVES_TARGET = 6`. Ramp and deload follow `weeklyTargets` (low + week - 1 capped at high; deload `Math.round(low / 2)`; calves 3 in a deload).
- `groupCredit`: strength only; 1 if any primary maps to the group, else 0.5 if any secondary does (front delts excluded as secondary, like `setCredit`).
- `status.ts` constants: `JUST_MAX_DAYS = 1`, `RECOVERING_MAX_DAYS = 4`, `BEHIND_MIN_TARGET = 6`, `BEHIND_FRACTION = 0.5`, `ZONE2_TARGET_MIN = 150`, `INTERVAL_CAP = 2`. Export `recencyOf(days: number | null): Recency`.
- A group's day counts as worked at `>= TRAINED_CREDIT` credit; `lastWorked` searches all history, `sets` only the rolling 7 days (today and 6 before).
- Zone 2 minutes: sets of `isZone2` exercises, `seconds / 60`. Interval days: distinct dates in the window with `intervals: true`.

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest src/builder`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/builder
git commit -m "feat(builder): nine muscle groups with group credit, targets, recency, BEHIND and the cardio week"
```

---

### Task 3: Tonight's cards and the exact target

**Files:**
- Create: `src/builder/pick.ts`, `src/builder/target.ts`
- Modify: `src/builder/prescribe.ts` (`prescribeReps` gains an `'accessory'` kind; `nextLoad` deleted once `target.ts` covers it), `src/builder/index.ts`
- Test: `src/builder/pick.test.ts`, `src/builder/target.test.ts`

**Interfaces:**
- Consumes: `GroupInput`, `GroupId`, `GROUP_MUSCLES`, `isMainLift`, `hash01`, `PATTERN_MUSCLES`, `INCREMENT_KG`, `blockState`, `isZone2`, `isInterval`.
- Produces:
  - `type Role = 'main' | 'accessory'`
  - `interface CardPick { exerciseId: string; role: Role }`
  - `pickGroup(input: GroupInput, group: GroupId): { cards: CardPick[]; more: string[] }`
  - `cardioPicks(input: GroupInput): { zone2: string[]; intervals: string[] }`
  - `interface Target { sets: number; reps: number | null; minutes: number | null; weight: number | null; restSeconds: number; range: [number, number] | null; needsWeight: boolean }`
  - `targetFor(e: Exercise, role: Role, history: History, today: string): Target`
  - `isHit(log: LoggedExercise): boolean`

- [ ] **Step 1: Write the failing tests**

```ts
// pick.test.ts (real LIBRARY, empty history unless stated, today '2026-11-25')
test('every group yields 3 cards and a More list; main lift first where one exists', () => {
  for (const g of GROUPS) {
    const { cards } = pickGroup(input, g);
    expect(cards).toHaveLength(3);
    expect(cards.filter(c => c.role === 'main').length).toBe(['arms', 'calves', 'core'].includes(g) ? 0 : 1);
    if (cards[0].role !== 'main') expect(cards.every(c => c.role === 'accessory')).toBe(true);
  }
});
test('arms shows a biceps and a triceps accessory', () => {
  const muscles = pickGroup(input, 'arms').cards.map(c => byId(c.exerciseId).primary[0]);
  expect(muscles).toEqual(expect.arrayContaining(['biceps', 'triceps']));
});
test('an exercise logged in the last 21 days wins its slot (continuity)', () => {
  // history: Dumbbell_Lunges on 2026-11-10 -> it is among quads cards
});
test('feedback never hides an exercise; more ranks it up', () => {});
test('cards and More never repeat an id, and More excludes non-strength items', () => {});

// target.test.ts (Barbell_Squat main: range 5-8 after clamping; Dumbbell_Lunges accessory: 10-12 after clamping to its dose)
test('first time: bottom of the range, no weight, needs weight', () => {
  expect(targetFor(squat, 'main', empty, today)).toMatchObject({ sets: 3, reps: 5, weight: null, needsWeight: true, restSeconds: 120 });
});
test('a hit adds a rep', () => {
  expect(targetFor(squat, 'main', logged([60, 6], [60, 6], [60, 6], { planned: 3, min: 6 }), today)).toMatchObject({ reps: 7, weight: 60 });
});
test('a hit at the top of the range adds the increment and resets reps', () => {
  expect(targetFor(squat, 'main', logged([60, 8], [60, 8], [60, 8], { planned: 3, min: 8 }), today)).toMatchObject({ reps: 5, weight: 62.5 });
});
test('fewer sets than planned is a miss: same target', () => {
  expect(targetFor(squat, 'main', logged([60, 6], [60, 6], { planned: 3, min: 6 }), today)).toMatchObject({ reps: 6, weight: 60 });
});
test('a short rep is a miss', () => {
  expect(targetFor(squat, 'main', logged([60, 6], [60, 5], [60, 6], { planned: 3, min: 6 }), today)).toMatchObject({ reps: 6, weight: 60 });
});
test('bodyweight climbs reps and never adds kilograms', () => {});
test('accessories use 10-15 clamped to the dose, rest 90 s', () => {
  expect(targetFor(lunges, 'accessory', empty, today)).toMatchObject({ reps: 10, range: [10, 12], restSeconds: 90 });
});
test('deload week: 2 sets, last weight and reps, no progression', () => {});
test('Zone 2 is 25 min; rep intervals 4 rounds at 60 s rest; timed intervals use the library minutes', () => {});
test('isHit needs planned sets and every set at target', () => {});
```

`logged(...sets, meta)` builds a one-session history on `2026-11-20` with `targetMin: meta.min`, `plannedSets: meta.planned`.

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/builder/pick.test.ts src/builder/target.test.ts`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

- `pick.ts` main patterns (top of file): chest `push-horizontal`; back `pull-horizontal`, `pull-vertical`; shoulders `push-vertical`; quads `squat`, `lunge`; hamstrings `hinge`; glutes `hinge`, `lunge`; arms, core, calves none.
- Candidates: `type === 'strength'`, `location` includes `'gym'`, a primary muscle in the group, feedback not `never`, purposes empty.
- Score: `+3` if logged within `CONTINUITY_DAYS = 21` (more recent wins ties), feedback `more` +2 / `less` -2, isolation +0.5 for accessories, `0.5 * hash01(today + group + id)`; ties by id. Main = best main-lift candidate; accessories = best remaining, with Arms forcing one biceps and one triceps first. `more` = all remaining candidates in score order.
- `cardioPicks`: `isZone2` items and `isInterval` items, each ordered by continuity then hash.
- `target.ts` constants: `SETS = 3`, `DELOAD_SETS = 2`, `MAIN_REST = 120`, `ACCESSORY_REST = 90`, `ACCESSORY_RANGE = [10, 15]`, `ZONE2_MINUTES = 25`, `INTERVAL_ROUNDS = 4`, `INTERVAL_REST = 60`.
- `targetMin` stored on a log is the target reps of that day; `isHit` = `sets.length >= plannedSets` and every `reps >= targetMin`.
- Rep intervals: reps = `dose.min`, no progression. `needsWeight` = no prior weight and the exercise is not bodyweight (`equipment` empty or only `bodyweight`, `pull-up bar`, `mat`; reuse the old `isBodyweight` rule from `src/workout/start.ts`, moved here).

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest src/builder && npx tsc --noEmit -p scripts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/builder
git commit -m "feat(builder): tonight's cards per group and exact double-progression targets"
```

---

### Task 4: Set-level writes, the tonight state and its reducer

**Files:**
- Create: `src/store/log.ts`, `src/store/tonight.ts`, `src/tonight/types.ts`, `src/tonight/reduce.ts`, `src/tonight/notice.ts`, `src/tonight/index.ts`
- Test: `src/store/log.test.ts`, `src/store/tonight.test.ts`, `src/tonight/reduce.test.ts`, `src/tonight/notice.test.ts`

**Interfaces:**
- Consumes: `SqlDb`, `inTransaction`, `LoggedSet`, `GroupId`, `Target`.
- Produces:
  - `interface LogMeta { plannedSets: number; targetMin: number | null; targetMax: number | null; intervals: boolean }`
  - `appendSet(db: SqlDb, date: string, exerciseId: string, set: LoggedSet, meta: LogMeta, index: number): Promise<boolean>` (false when tonight already holds a set at `index`: idempotent)
  - `replaceSets(db: SqlDb, date: string, exerciseId: string, sets: LoggedSet[], meta: LogMeta): Promise<void>` (an empty list behaves like `removeExercise`)
  - `removeExercise(db: SqlDb, date: string, exerciseId: string): Promise<void>` (deletes the session row when it becomes empty)
  - `interface Rest { endsAt: number; seconds: number; exerciseId: string; set: number; of: number }`
  - `interface TonightState { version: 2; date: string; rest: Rest | null; opened: GroupId[]; cards: Partial<Record<GroupId, CardPick[]>>; promoted: Partial<Record<GroupId, string[]>>; lastGroup: GroupId | null; lastActionAt: number | null; firstSetAt: number | null }`
  - `type TonightAction = { type: 'open'; group: GroupId; cards: CardPick[]; now: number } | { type: 'promote'; group: GroupId; exerciseId: string } | { type: 'logged'; now: number } | { type: 'restStart'; rest: Omit<Rest, 'endsAt'>; now: number } | { type: 'restPlus'; seconds: number } | { type: 'restEnd' }`
  - `emptyTonight(date: string): TonightState`, `reduceTonight(s: TonightState, a: TonightAction): TonightState`
  - `loadTonight(db: SqlDb, today: string): Promise<TonightState>` (a row for another date, or unreadable, is deleted and an empty state returned), `saveTonight(db: SqlDb, s: TonightState): Promise<void>`
  - `restNotice(s: TonightState, names: Map<string, string>, clockText: (ms: number) => string, next: { reps: number | null; weight: number | null } | null): { endsAt: number; title: string; body: string } | null` with `REST_NOTICE_MIN_SECONDS = 45`

- [ ] **Step 1: Write the failing tests**

```ts
// log.test.ts (nodeDb + migrate)
test('appendSet creates the day session as free and is idempotent per index', async () => {
  expect(await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 0)).toBe(true);
  expect(await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 0)).toBe(false);
  expect(await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 1)).toBe(true);
  const h = await loadHistory(db);
  expect(h.sessions).toHaveLength(1);
  expect(h.sessions[0]).toMatchObject({ date: D, focus: 'free' });
  expect(h.sessions[0].exercises[0]).toMatchObject({ plannedSets: 3, targetMin: 6, sets: [set60x6, set60x6] });
});
test('a second exercise joins the same day session', async () => {});
test('replaceSets swaps tonight sets; an empty list removes the exercise', async () => {});
test('removing the only exercise deletes the empty session row', async () => {
  await appendSet(db, D, 'Barbell_Squat', set60x6, meta, 0);
  await removeExercise(db, D, 'Barbell_Squat');
  expect((await loadHistory(db)).sessions).toHaveLength(0);
});
test('an interval log marks the day session intervals', async () => {});

// tonight.test.ts
test('a saved state reloads on the same day', async () => {});
test('a state from yesterday is dropped and an empty one returned', async () => {
  await saveTonight(db, { ...emptyTonight('2026-11-24'), opened: ['quads'] });
  expect(await loadTonight(db, '2026-11-25')).toEqual(emptyTonight('2026-11-25'));
  expect(await db.getFirstAsync('SELECT * FROM active_workout')).toBeNull();
});
test('a version 1 Plan 4 draft is dropped, never parsed as tonight', async () => {});

// reduce.test.ts
test('open records the group once, freezes its cards and sets lastGroup', () => {
  const s = reduceTonight(reduceTonight(empty, open('quads', cardsA, 1)), open('quads', cardsB, 2));
  expect(s.opened).toEqual(['quads']);
  expect(s.cards.quads).toEqual(cardsA);
  expect(s.lastGroup).toBe('quads');
});
test('logged sets firstSetAt once and lastActionAt every time', () => {});
test('restStart sets endsAt = now + seconds * 1000; restPlus adds; restEnd clears', () => {});
test('promote appends once', () => {});

// notice.test.ts
test('no notice under 45 s or without a rest', () => {});
test('title shows the end clock; body names the exercise, next set and load', () => {
  expect(restNotice(stateResting, NAMES, () => '19:42', { reps: 6, weight: 60 }))
    .toEqual({ endsAt: E, title: 'Rest until 19:42', body: 'Next: Barbell Squat · set 2 · 60 kg × 6' });
});
test('after the last set the body says the exercise is done', () => {});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/store src/tonight`
Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

- Every write in `log.ts` runs inside `inTransaction`. The day session is the row with `date = ? AND focus = 'free'`, created on demand. `appendSet` checks the current set count of that exercise's row: insert only when it equals `index`.
- The `logged_sets` position equals the set index.
- `tonight.ts` reuses the `active_workout` row (`id = 1`) and stores `version: 2` JSON.

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest src/store src/tonight && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/store src/tonight
git commit -m "feat(store): set-level logging into a free day session; tonight UI state, reducer and rest notice"
```

---

### Task 5: Bundled exercise photos

**Files:**
- Create: `scripts/images/fetch-images.ts`, `assets/exercises/<id>/0.jpg|1.jpg`, `src/ui/images.ts` (generated), `src/features/photo/ExercisePhoto.tsx`
- Test: `scripts/images/fetch-images.test.ts` (pure parts), `src/ui/images.test.ts`, `src/__tests__/app/photo.test.tsx`

**Interfaces:**
- Produces:
  - `EXERCISE_IMAGES: Record<string, [number, number]>` (Metro asset ids) in `src/ui/images.ts`
  - `<ExercisePhoto exerciseId: string; size: number; group: GroupId; animate?: boolean />`: frame 0 and 1 alternate every `FRAME_MS = 1200` with a cross-fade under 150 ms; static frame 0 when `animate` is false, Reduce Motion is on (`AccessibilityInfo.isReduceMotionEnabled`) or the app is in the background; a placeholder (the group's initial letter in a circle on `sch`) when there are no images.

- [ ] **Step 1: Write the failing tests**

```ts
// src/ui/images.test.ts
test('every library exercise with images has both frames mapped, and nothing else is mapped', () => {
  const withImages = LIBRARY.filter(e => e.images.length >= 2).map(e => e.id).sort();
  expect(Object.keys(EXERCISE_IMAGES).sort()).toEqual(withImages);
  expect(withImages).toHaveLength(173);
});
// photo.test.tsx
test('alternates frames on a timer and shows a placeholder without images', () => {});
test('stays on frame 0 when reduce motion is on', () => {});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/ui/images.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Write and run the fetch script**

`scripts/images/fetch-images.ts`: for each library entry with `images`, download `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/<path>` (sequential, skip files already present), resize to 384 px on the long side (use `sharp` as a dev dependency), write `assets/exercises/<id>/0.jpg` and `1.jpg`, then generate `src/ui/images.ts` with literal `require()` calls (Metro needs static requires). Run it with `npx tsx scripts/images/fetch-images.ts`. Report the total size of `assets/exercises` in the commit message body. If it is over 20 MB, drop the long side to 320 px and rerun.

- [ ] **Step 4: Implement `ExercisePhoto` and run the tests**

Run: `npx jest src/ui src/__tests__/app/photo.test.tsx && npx tsc --noEmit -p scripts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/images assets/exercises src/ui/images.ts src/ui/images.test.ts src/features/photo src/__tests__/app/photo.test.tsx package.json package-lock.json
git commit -m "feat(photos): bundle the free-exercise-db start and end photos and show them as a two-frame loop"
```

---

### Task 6: TonightProvider

The one place that loads history and tonight state, performs writes in order, and wires the rest notification.

**Files:**
- Create: `src/features/tonight/TonightProvider.tsx`, `src/features/tonight/useTonight.ts`
- Modify: `src/app/_layout.tsx` (wrap the Stack in `TonightProvider` inside `ExpoDb`)
- Test: `src/__tests__/app/tonight.test.tsx`

**Interfaces:**
- Consumes: Tasks 2-4 APIs, `showRest`, `clearRest`, `onRestAction`, `useToday`, `impact`, `tick`.
- Produces `useTonight()` returning:
  - `today: string; history: History; state: TonightState; input: GroupInput; ready: boolean`
  - `openGroup(group: GroupId): CardPick[]` (picks and freezes on first open tonight, returns the frozen cards)
  - `promote(group: GroupId, exerciseId: string): void`
  - `logDot(exerciseId: string, index: number, target: Target, intervals: boolean): Promise<void>` (appends one set at target, then the last dot also counts as complete, and starts a rest of `target.restSeconds`)
  - `complete(exerciseId: string, target: Target, intervals: boolean): Promise<void>` (fills the remaining sets; no rest)
  - `edit(exerciseId: string, sets: LoggedSet[], target: Target, intervals: boolean): Promise<void>` (`replaceSets`)
  - `undo(exerciseId: string): Promise<void>`
  - `restPlus(seconds: number): void; restSkip(): void`
  - `doneSets(exerciseId: string): LoggedSet[]` (tonight's sets from history)
- Behaviour pinned:
  - Writes are chained in one promise queue, so they land in order. After each write, history is reloaded from SQLite.
  - Tonight state is saved after every change.
  - On a `today` change both are reloaded.
  - The notification follows `state.rest` (show or replace, clear on end).
  - The `complete` action logs the next dot of `state.rest.exerciseId` through `logDot` with that exercise's current target. It is a no-op when the exercise already has `plannedSets` sets.
  - `plus15` calls `restPlus(15)` and `skip` calls `restSkip()`.

- [ ] **Step 1: Write the failing tests** (render a probe component inside the provider with `renderApp`, real nodeDb)

```ts
test('logDot writes a set, starts a 120 s rest and a double call writes once', async () => {});
test('the last dot completes and still rests; complete fills the rest without a rest', async () => {});
test('notification Complete set after a reload logs the next set once and no-ops when complete', async () => {});
test('undo removes tonight sets; history reloads', async () => {});
test('a day rollover reloads an empty tonight state', async () => {});
test('openGroup freezes cards: a second call after logging returns the same list', async () => {});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/__tests__/app/tonight.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement the provider and wrap the layout**

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/tonight src/app/_layout.tsx src/__tests__/app/tonight.test.tsx
git commit -m "feat(app): TonightProvider - ordered set writes, frozen cards, rest notification and its actions"
```

---

### Task 7: Body figure and Home

**Files:**
- Create: `src/features/body/regions.ts`, `src/features/body/BodyFigure.tsx`, `src/features/home/WeekCard.tsx`, `GroupGrid.tsx`, `ActivityCards.tsx`, `TonightStrip.tsx`
- Rewrite: `src/app/index.tsx` (Home)
- Test: `src/features/body/regions.test.ts`, `src/__tests__/app/home.test.tsx`
- Dependency: `npx expo install react-native-svg`

**Interfaces:**
- Consumes: `useTonight`, `groupStatus`, `cardioWeek`, `tonightSummary`, `GROUPS`, `GROUP_LABEL`, `blockState`.
- Produces:
  - `REGIONS: { side: 'front' | 'back'; group: GroupId; path: string; bounds: { x: number; y: number; w: number; h: number } }[]` in a `viewBox="0 0 110 220"` per figure
  - `<BodyFigure status: Record<GroupId, GroupStatus>; selected: GroupId | null; onSelect(g: GroupId): void />`
- Pinned visuals (PDF, dark):
  - Fill colour comes from recency: `just`, `recov`, `rest`; never-trained regions use a dashed `ol` outline on `empty`.
  - Fill height = `min(1, sets / target)`, rising from the bottom of each region's bounds through a `ClipPath` rect.
  - `selected` (the `state.lastGroup` tonight) gets a 2 px `on` stroke on the figure and the matching grid card gets a 2 px `pri` outline.
  - Each region has a transparent hit `Rect` of at least 44 x 44 px at render scale, centred on its bounds.
- Home order: WeekCard ("Last 7 days", the range like "Thu 19 - Wed 25 Nov", the legend, "Fill height = sets vs target", plus "Lighter week: 2 sets per exercise" in a deload; tap opens `/history`), figure card, GroupGrid card, ActivityCards (Cardio "Zone 2 · 40/150 min", Stretch "Desk & back routine"), and TonightStrip pinned at the bottom (hidden with 0 sets).
- Reopen rule: on mount, when `state.rest` is running or `now - state.lastActionAt < REOPEN_MS = 45 * 60 * 1000` and `state.lastGroup` is set, `router.push('/group/' + lastGroup)` once per app launch.

- [ ] **Step 1: Write the failing tests**

```ts
// regions.test.ts
test('every group has at least one region and calves and arms appear on both sides', () => {});
test('glutes and hamstrings are back-only; chest and quads front-only', () => {});
// home.test.tsx (seed sessions through saveSession; today 2026-11-25)
test('grid shows recency, sets/target and BEHIND per group', async () => {
  // quads 3/8 BEHIND "5d ago"; calves "Never" 0/6 without BEHIND
});
test('tapping a grid card and a figure region both open the group screen', async () => {});
test('Cardio, Stretch and the week card navigate to their screens', async () => {});
test('the Tonight strip appears after the first set and counts sets and groups', async () => {});
test('a running rest reopens the last group on launch', async () => {});
test('after the 04:00 rollover the strip disappears and status refreshes', async () => {});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/features/body src/__tests__/app/home.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

Draw the segmented figure by hand to match the PDF's style (rounded segments, head, dashed calves when never trained). Group stubs for `/group/[id]`, `/cardio`, `/stretch`, `/history` render their title only, so navigation tests pass. Task 8-10 replace them.

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(home): front and back body figure, group grid with BEHIND, cardio and stretch cards, tonight strip"
```

---

### Task 8: Muscle-group screen

**Files:**
- Create: `src/app/group/[id].tsx`, `src/features/exercise/ExerciseCard.tsx`, `SetDots.tsx`, `EditSheet.tsx`, `DetailSheet.tsx`, `RestPanel.tsx`, `TonightBar.tsx`, `WarmupCard.tsx`, `EnoughCard.tsx`, `MoreList.tsx`
- Test: `src/__tests__/app/group.test.tsx`

**Interfaces:**
- Consumes: `useTonight`, `targetFor`, `isHit`, `groupStatus`, `ExercisePhoto`, `warmup` from `parts.ts` (regions from `BUDGET_TO_REGION` of the group's muscles), `FEEDBACK_LABEL`, `setFeedback`, `useRemaining`, `useKeepAwake`.
- Pinned behaviour (spec 6.2, mockup values):
  - Header card: name at 30 px, recency dot and "Rested · last worked 5 days ago", "**3/8** sets this week" with BEHIND, and a bar.
  - The WarmupCard shows only while `tonightSummary.sets === 0`: collapsed, "Warm-up · 3 moves · ~5 min".
  - ExerciseCard, top to bottom:
    - role label "MAIN LIFT" or "ACCESSORY";
    - photo 96 px, which opens DetailSheet;
    - name at 18 px;
    - target at 24 px bold: "3 × 6 @ 60 kg", "3 × 12" (bodyweight) or "3 × 5 · set weight";
    - last line: "Last: 9 days ago · 60 kg × 8" or "Never done";
    - SetDots with 28 px dots and 44 px hit areas, "tap = start rest" and Edit;
    - the Completed pill (56 px, `pri`), or the `okc` row "✓ Completed · 3 × 6 @ 60 kg" with Undo.
  - Dot tap: when `target.needsWeight`, open EditSheet first. Otherwise `logDot(id, doneSets.length, …)`; a dot index other than `doneSets.length` is ignored.
  - Completed: also opens EditSheet first when weight is needed.
  - EditSheet:
    - weight stepper using `INCREMENT_KG[equipment[0]]` (typed value allowed, decimal);
    - reps stepper;
    - sets stepper from 0 to `target.sets`;
    - Save calls `edit`.
  - EnoughCard: "About 8 sets is enough for tonight" / "Quads tonight: N sets. Anything past here is a bonus.", turning `okc` at `ENOUGH_SETS = 8` direct sets tonight for the group.
  - MoreList: collapsed "More exercises"; tapping a row calls `promote`.
  - The bottom bar holds the RestPanel while resting ("REST", "<name> · set 1 of 3 done", countdown at 44 px, bar, +15 s and Skip; screen kept awake) and the TonightBar (Home chip, chips for the groups opened tonight with the current one selected, "N sets · M min").
  - DetailSheet: large photos, instructions, the last 5 logs, More/Less/Never feedback, and a post link when `sourceUrl` is set.
  - An unknown `id` param redirects to Home.

- [ ] **Step 1: Write the failing tests**

```ts
test('renders header, 3 cards with targets and last lines for quads', async () => {});
test('first time a loaded lift: dot opens Edit; saving 60 kg logs and shows the green row when sets reach 3', async () => {});
test('dot logs one set and shows the rest panel at 2:00; a double tap logs once', async () => {});
test('third dot completes and rests; Completed fills remaining sets without a rest', async () => {});
test('Undo empties the dots and removes the sets from history', async () => {});
test('Edit to 2 sets keeps dots at 2 and the next target repeats (miss)', async () => {});
test('warm-up card disappears after the first set of the evening', async () => {});
test('enough card turns complete at 8 sets', async () => {});
test('More promotes an exercise to a full card; cards stay frozen after logging', async () => {});
test('Back via the Home chip and the hardware back both return Home', async () => {});
test('an unknown group id redirects Home', async () => {});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/__tests__/app/group.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(group): exercise cards with photos, exact targets, set dots, Completed, Edit, Undo, rest panel and tonight bar"
```

---

### Task 9: Cardio, Stretch and the desk reset restyle

**Files:**
- Create: `src/app/cardio.tsx`, `src/app/stretch.tsx`
- Rewrite: `src/app/desk.tsx` (new tokens and cards; behaviour unchanged)
- Test: `src/__tests__/app/cardio.test.tsx`, `src/__tests__/app/stretch.test.tsx`, `src/__tests__/app/desk.test.tsx` (update)

**Interfaces:**
- Consumes: `useTonight`, `cardioPicks`, `cardioWeek`, `targetFor`, `ExerciseCard` (reused, with a `timer` variant for duration doses), `buildDeskReset`, `cooldown` from `parts.ts`, `useCountdown`.
- Pinned:
  - Cardio header: "Zone 2 · 40/150 min" with a bar, and "Intervals · 1/2 this week".
  - Zone 2 section: cards with "25 min", an optional Start timer that shows elapsed `m:ss` in the card (no notification), Completed logging one set with `seconds = minutes * 60`, and Edit changing the minutes.
  - Intervals section:
    - timed items use the same timer card with the library minutes;
    - rep items get 4 dots at 60 s rest;
    - every interval log passes `intervals: true`;
    - at 2 interval days a quiet note "2 of 2 done this week" appears, never a block.
  - Stretch: a Desk reset card (to `/desk`) and a Cool-down card listing `cooldown(...)` items for the regions of tonight's groups (all regions when none). Each item shows its photo, name and dose; nothing is logged.

- [ ] **Step 1: Write the failing tests**

```ts
test('cardio shows the week numbers and 25 min Zone 2 targets', async () => {});
test('Completed on Zone 2 logs 25 min and the header becomes 25/150', async () => {});
test('a rep interval logs through 4 dots and marks the day as an interval day', async () => {});
test('the cap note appears at 2 interval days', async () => {});
test('stretch lists cool-down items for tonight\'s groups and opens the desk reset', async () => {});
test('desk reset still steps through every item with hold timers', async () => {});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/__tests__/app/cardio.test.tsx src/__tests__/app/stretch.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest && npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(app): cardio with Zone 2 minutes and interval cap note; stretch with desk reset and cool-down"
```

---

### Task 10: History and export

**Files:**
- Create: `src/app/history.tsx`, `src/builder/days.ts`
- Test: `src/builder/days.test.ts`, `src/__tests__/app/history.test.tsx`

**Interfaces:**
- Consumes: `history`, `groupCredit`, `TRAINED_CREDIT`, `historyExport`, `exportFileName`, `saveToFolder`.
- Produces: `trainingDaysList(input: GroupInput): { date: string; groups: GroupId[]; sets: number; exercises: { exerciseId: string; sets: LoggedSet[] }[] }[]`, newest first, merging all session rows of one date and leaving out days with no sets.
- Pinned:
  - Rows read "Wed 25 Nov · Quads, Glutes · 9 sets"; tapping a row expands its exercises ("Barbell Squat · 60 kg × 6, 6, 6").
  - "Export history" at the bottom shows the same saved / failed status text as Plan 4's summary had: "Saved <file>" or "Export failed. Try again."
  - Read-only.

- [ ] **Step 1: Write the failing tests**

```ts
test('days merge old focus rows with the free row and skip empty days', () => {});
test('history lists days newest first and expands a day', async () => {});
test('export saves through the remembered folder and shows the file name', async () => {});
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/builder/days.test.ts src/__tests__/app/history.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Verify the whole tree**

Run: `npx tsc --noEmit && npx tsc --noEmit -p scripts && npx jest`
Expected: all green; the routes test lists exactly `['index', 'group/[id]', 'cardio', 'stretch', 'desk', 'history']`.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(history): training days with their exercises and the one-tap export"
```

---

## After the tasks

- Run one whole-branch review (fresh reviewer, most capable model) against the spec and this plan.
- Start Expo (`npx expo start`) and hand the owner the on-device checklist from spec section 12: readability in the gym, figure taps including calves, photos offline, rest notification and its actions, and reopening after a kill landing in the group.
- Merge only after the owner signs off on the device check. Plans 3-4 and this branch land on `main` together.
