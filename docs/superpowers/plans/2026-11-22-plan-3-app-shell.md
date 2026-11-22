**Date**: 2026-11-22
**Content Type**: Implementation Plan

# Plan 3: App Shell, Thumb Arc and Evening Flow - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A phone app you can open in the evening, check in with one thumb sweep, pick tonight's focus on the thumb arc, and see the built session; plus a standalone desk reset you can run any time.

**Architecture:** Expo Router screens in `src/app/` call the pure builder only through `src/builder/index.ts`.
The thumb arc is ported from langocard's deleted arc (`F:\newprojects\langocard`, `git show 90816d2^:src/features/arc/...`) and simplified to one level: a curved column of labelled items on the right edge with fisheye magnification, selected by tap or by sweep-and-release.
History and check-ins live in expo-sqlite behind a small `SqlDb` interface, so the storage code is tested against Node's built-in `node:sqlite` with no mocks.

**Tech Stack:** Expo SDK 58, expo-router, React 19.3, RN 0.88, Reanimated 4 + react-native-worklets, react-native-gesture-handler, expo-haptics, expo-sqlite, Jest 30 / jest-expo, @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-11-22-workout-app-design.md` (main flow, desk reset, check-in effects, technical decisions).
Roadmap: `docs/superpowers/plans/2026-11-22-plan-1-scaffold-and-library.md`. Builder API: `src/builder/index.ts` (Plan 2).

## Global Constraints

- Never use the em dash, in UI copy, code comments or docs. Use a plain dash.
- UI code imports the builder only from `src/builder` (the index). Never from a builder submodule.
- "Today" is the phone's local calendar date as `YYYY-MM-DD`, from `localToday()` (Task 1). Never `toISOString()`.
- The check-in is asked once per day. Reopening the same day goes straight to the focus menu.
- Gym / Home toggle sits on the check-in screen and defaults to Gym. Home offers only mobility, stretching and the desk reset.
- Desk reset is reachable in at most 2 taps from opening the app and needs no check-in.
- From opening the app to tonight's preview: 3 taps or fewer (check-in, focus, and the preview shows).
- Reduce Motion pins every arc scale to 1 and keeps focus visible by a non-motion highlight.
- Haptics: `tick()` on each change of the item under the thumb, `impact()` on a selection.
- Touch targets are at least 44 px.
- Dark theme only (`userInterfaceStyle: "dark"`).
- New runtime dependencies are only those Task 1 installs, each via `npx expo install` so versions match SDK 58.
- Work on branch `feat/plan-3-app-shell`. Commits carry no AI co-author line.

## Review Focus

- Reopening the app just after midnight, after an evening session, must not ask for a second check-in: the training day rolls over at 04:00 local. Pinned in Task 1 (`localToday keeps 00:30 on the previous day`).
- Reopening the app later the same day skips the check-in, but the owner can still change tonight's check-in. Pinned in Task 5 (`an existing check-in goes straight to the menu`, `redo shows the check-in again`).
- A sweep released far from the arc must cancel, and one gesture must never select twice. Pinned in Task 2 (`release inboard of the cancel line cancels`) and Task 3 (`a sweep selects exactly once`).
- Home mode must never offer a lifting focus, and a Wrecked check-in leads with Rest. Pinned in Task 6 (`home menu offers mobility and desk reset only`, `wrecked leads with rest`).
- A preview opened with a bad or stale route parameter (unknown focus or dose) must go back to the menu, not crash. Pinned in Task 7 (`unknown focus returns to the menu`).

---

### Task 1: Dependencies, theme, haptics and local day

**Files:**
- Modify: `package.json` (via `npx expo install`), `app.json`, `src/app/_layout.tsx`
- Create: `jest.setup.js`, `src/theme/tokens.ts`, `src/haptics/index.ts`, `src/platform/today.ts`
- Test: `src/platform/today.test.ts`, `src/haptics/haptics.test.ts`

**Interfaces:**
- Produces: `tokens` (colors, space, font sizes, `motion.springTrack`, `motion.magnify { maxScale: 1.7, falloffPx: 170 }`, `arc { ... }`, `focusAccent: Record<SessionKind, string>`); `tick(): void`; `impact(): void`; `localToday(now?: Date, rolloverHour?: number): string` (default rollover 4).

- [ ] **Step 1: Create the branch and install**

Run: `git checkout -b feat/plan-3-app-shell && npx expo install react-native-reanimated react-native-worklets react-native-gesture-handler expo-haptics expo-sqlite`
Expected: five packages added at SDK 58 versions, `npm ls` shows no peer errors.

- [ ] **Step 2: Jest setup**

Create `jest.setup.js` with `import 'react-native-gesture-handler/jestSetup';` and the safe-area mock (`jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default)`).
Add `"setupFiles": ["./jest.setup.js"]` to the `jest` block in `package.json`.
Run: `npx jest` - Expected: 183 passed.

- [ ] **Step 3: Write the failing tests**

```ts
// src/platform/today.test.ts
import { localToday } from './today';
test('localToday uses the local calendar date', () =>
  expect(localToday(new Date(2026, 10, 22, 19, 0))).toBe('2026-11-22'));
test('localToday keeps 00:30 on the previous day', () =>
  expect(localToday(new Date(2026, 10, 23, 0, 30))).toBe('2026-11-22'));
test('localToday starts the new day at 04:00', () =>
  expect(localToday(new Date(2026, 10, 23, 4, 0))).toBe('2026-11-23'));
test('localToday crosses month and year ends', () =>
  expect(localToday(new Date(2027, 0, 1, 1, 0))).toBe('2026-12-31'));
```

```ts
// src/haptics/haptics.test.ts - mock expo-haptics; tick() calls impactAsync(Light) on android, impact() calls impactAsync(Medium).
```

- [ ] **Step 4: Run to verify they fail**

Run: `npx jest src/platform src/haptics` - Expected: FAIL, modules not found.

- [ ] **Step 5: Implement**

- `localToday`: subtract `rolloverHour` hours from `now` in local time, then format `getFullYear()-getMonth()+1-getDate()` zero-padded.
- `src/haptics/index.ts`: copy langocard's `90816d2^:src/haptics/index.ts` verbatim.
- `src/theme/tokens.ts`: port langocard's `color`, `space`, `motion` and `arc` groups (drop `widget`, `card`, `emergency`, `layout`, the Japanese fonts and the per-category accents). Font sizes keep langocard's `size` scale with the system font (no custom fonts). Arc values: `itemHeight: 56`, `bandFraction: 0.8`, `arcDepth: 26`, `restOpacity: 0.55`, `cancelFraction: 0.3`, `bubbleWidth: 150`, `bubbleGap: 8`. Add `focusAccent` with one distinct color per `SessionKind`.
- `app.json`: `"userInterfaceStyle": "dark"`.
- `_layout.tsx`: wrap the `Stack` in `GestureHandlerRootView` (flex 1) and `SafeAreaProvider`; stack `contentStyle` background `tokens.color.bg`.

- [ ] **Step 6: Run tests and typecheck**

Run: `npx jest && npm run -s typecheck` - Expected: all pass, clean.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "feat(app): reanimated, gestures, haptics, sqlite; dark theme tokens and the 04:00 local training day"
```

---

### Task 2: Arc geometry and gesture machine (pure)

**Files:**
- Create: `src/features/arc/geometry.ts`, `src/features/arc/arcMachine.ts`
- Test: `src/features/arc/geometry.test.ts`, `src/features/arc/arcMachine.test.ts`

**Interfaces:**
- Produces: `scaleFor(distancePx, maxScale, windowPx): number` (worklet), `nearestIndex(centers: number[], y: number): number`, `layoutCenters(count, top, height): number[]`, `bowX(centerY, railTop, railHeight, arcDepth, edge): number` - all ported verbatim from langocard (`90816d2^:src/features/home/magnify.ts` and `90816d2^:src/features/arc/arc.ts`) into one file.
- Produces: `ArcEdge = 'left' | 'right'`; `ArcConfig = { cancelX: number; edge: ArcEdge }`; `ArcInput = { kind: 'down' | 'engage' | 'move' | 'up'; x: number; y: number }`; `ArcState = { active: boolean; engaged: boolean; x: number; y: number }`; `ArcEvent = { type: 'select'; y: number } | { type: 'cancel' } | null`; `initArc(): ArcState`; `reduceArc(state, input, cfg): { state: ArcState; event: ArcEvent }`.

The machine is langocard's `arcMachine` reduced to one level: there is no card zone. After engage, releasing on the arc side of `cancelX` selects at the release y; releasing past it (inboard) cancels. A down-up with no engage is a tap and emits `cancel` (taps are handled by the item Pressables).

- [ ] **Step 1: Write the failing tests**

Port langocard's `arc.test.ts` and the magnify tests as they were (`git show 90816d2^:src/features/arc/arc.test.ts`, `90816d2^:src/features/home/magnify.test.ts` if present; otherwise write: `scaleFor(0, 1.7, 170) === 1.7`, `scaleFor(170, 1.7, 170) === 1`, `nearestIndex([0, 100, 200], 140) === 1`, `layoutCenters(3, 10, 200)` equals `[10, 110, 210]`, `bowX` is 0 at the band ends and `-26` at the middle for `right`).

```ts
// arcMachine.test.ts - cfg = { cancelX: 120, edge: 'right' } (arc side is x >= 120)
test('a stationary tap cancels', () => expect(run([d(300, 200), u(300, 200)])).toEqual({ type: 'cancel' }));
test('engage then release on the arc side selects at the release y', () =>
  expect(run([d(300, 200), e(300, 200), m(310, 260), u(310, 260)])).toEqual({ type: 'select', y: 260 }));
test('release inboard of the cancel line cancels', () =>
  expect(run([d(300, 200), e(300, 200), m(60, 220), u(60, 220)])).toEqual({ type: 'cancel' }));
test('left edge mirrors the cancel side', () =>
  expect(run([d(20, 200), e(20, 200), u(30, 240)], { cancelX: 250, edge: 'left' })).toEqual({ type: 'select', y: 240 }));
test('move before engage is ignored and up without down does nothing', () => { /* reduceArc(initArc(), up) -> event null */ });
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/features/arc` - Expected: FAIL, modules not found.

- [ ] **Step 3: Implement both files**

- [ ] **Step 4: Run to verify they pass**

Run: `npx jest src/features/arc` - Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/arc && git commit -m "feat(arc): port langocard arc geometry; one-level select/cancel gesture machine"
```

---

### Task 3: ThumbArc component

**Files:**
- Create: `src/features/arc/ThumbArc.tsx`
- Test: `src/features/arc/ThumbArc.test.tsx`

**Interfaces:**
- Consumes: Task 1 `tokens`, `tick`, `impact`; Task 2 geometry and machine.
- Produces: `ArcItem = { id: string; label: string; hint?: string; accent: string }`; `ThumbArc(props: { items: ArcItem[]; onSelect: (id: string) => void; edge?: ArcEdge; header?: ReactNode }): JSX.Element`. The pan gesture carries `.withTestId('thumb-arc-pan')`.

Behaviour (from langocard's `ArcNav` / `ArcRail` / `ArcBubble`, minus the category/card split):
- One root `View` fills the screen area it is given; it owns the `GestureDetector` and its `onLayout` gives width and height. The item column is laid out by the component itself: centers = `layoutCenters(n, bandTop, bandH)` with the band filling the lower `bandFraction` of the height (thumb reach), `bowX` for the inward bow. Gesture y and item centers share the root's coordinate space, so no per-item `onLayout` is needed.
- Each item is a `Pressable` row anchored to the edge: an accent dot and the label, `accessibilityRole="button"`, `accessibilityLabel={label}`, `accessibilityHint={hint}`. Tapping it calls `onSelect(id)` and `impact()`.
- While a sweep is engaged: the item nearest the thumb is the focused item; each change fires `tick()`. Fisheye scale from `scaleFor(center - thumbY, maxScale, falloffPx)` on the UI thread; opacity ramps from `restOpacity` to 1 with scale. A bubble beside the column shows the focused item's label and hint, follows the thumb, and is hidden from accessibility.
- Release goes through `reduceArc` with `cancelX = width * cancelFraction` (right edge) or `width * (1 - cancelFraction)` (left). `select` maps the release y to `nearestIndex` and calls `onSelect` once, with `impact()`.
- `header` renders at the top of the root, above the band (the check-in screen puts its Gym / Home toggle there).
- Reduce Motion (`useReducedMotion()`): scale pinned to 1; the focused item gets a solid highlight background instead.

- [ ] **Step 1: Write the failing tests**

```tsx
const items = [{ id: 'a', label: 'Alpha', hint: 'first', accent: '#f00' }, { id: 'b', label: 'Beta', accent: '#0f0' }, { id: 'c', label: 'Gamma', accent: '#00f' }];
test('renders one labelled button per item', ...);          // getByLabelText('Alpha'|'Beta'|'Gamma')
test('tapping an item selects it', ...);                     // fireEvent.press(getByLabelText('Beta')) -> onSelect('b')
test('a sweep selects exactly once', ...);
// fire the root layout { width: 400, height: 800 }, then fireGestureHandler(getByGestureTestId('thumb-arc-pan'),
// [{ state: BEGAN, x: 380, y: c0 }, { state: ACTIVE, x: 380, y: c0 }, { x: 380, y: c2 }, { state: END, x: 380, y: c2 }])
// where c0/c2 = layoutCenters(3, 800 * 0.2, 800 * 0.8)[0|2] -> onSelect called once, with 'c'.
test('a sweep released inboard selects nothing', ...);       // END at x: 40 -> onSelect not called
test('renders the header', ...);
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/features/arc/ThumbArc` - Expected: FAIL, module not found.

- [ ] **Step 3: Implement `ThumbArc`**

Follow langocard's stable-forwarder pattern (refs plus `useCallback` forwarders, gesture built once in `useMemo`, `runOnJS` from worklets) so the gesture never re-attaches.

- [ ] **Step 4: Run tests and typecheck**

Run: `npx jest src/features/arc && npm run -s typecheck` - Expected: PASS, clean.
If `fireGestureHandler` cannot drive the Reanimated worklet callbacks under jest, keep the sweep tests at the `reduceArc` level (Task 2 already covers them), keep the tap tests here, and ledger a ruling.

- [ ] **Step 5: Commit**

```bash
git add src/features/arc && git commit -m "feat(arc): ThumbArc - labelled right-edge arc with fisheye, sweep-to-select and tap"
```

---

### Task 4: Storage - schema, check-ins, history

**Files:**
- Create: `src/store/sql.ts`, `src/store/schema.ts`, `src/store/history.ts`, `src/store/DbContext.tsx`, `src/store/test-utils/nodeDb.ts`
- Test: `src/store/history.test.ts`

**Interfaces:**
- Consumes: `CheckIn`, `Place`, `Feedback`, `History`, `SessionLog` from `src/builder`.
- Produces:
  - `SqlParam = string | number | null`; `interface SqlDb { execAsync(sql): Promise<void>; runAsync(sql, ...params: SqlParam[]): Promise<{ lastInsertRowId: number; changes: number }>; getAllAsync<T>(sql, ...params): Promise<T[]>; getFirstAsync<T>(sql, ...params): Promise<T | null> }` - the subset of expo-sqlite's `SQLiteDatabase` the app uses.
  - `migrate(db: SqlDb): Promise<void>` - idempotent, versioned by `PRAGMA user_version` (version 1).
  - `saveCheckIn(db, date: string, value: CheckIn, place: Place): Promise<void>` (upsert by date); `checkInFor(db, date): Promise<{ value: CheckIn; place: Place } | null>`.
  - `saveSession(db, log: SessionLog): Promise<void>` (one transaction); `setFeedback(db, exerciseId: string, value: Feedback | null): Promise<void>` (null clears).
  - `loadHistory(db): Promise<History>` - sessions ordered by date then insertion; exercises and sets in their logged order; booleans and nulls restored exactly.
  - `DbContext`, `DbProvider({ db, children })`, `useDb(): SqlDb` (throws outside a provider).
  - Test util `nodeDb(): SqlDb` over `node:sqlite` `DatabaseSync(':memory:')`, rows copied into plain objects (`/// <reference types="node" />` at the top, as in `src/builder/purity.test.ts`).

Schema v1: `check_ins(date TEXT PRIMARY KEY, value TEXT, place TEXT)`, `feedback(exercise_id TEXT PRIMARY KEY, value TEXT)`, `sessions(id INTEGER PRIMARY KEY, date TEXT, focus TEXT, intervals INTEGER)`, `logged_exercises(id INTEGER PRIMARY KEY, session_id INTEGER REFERENCES sessions(id), position INTEGER, exercise_id TEXT, target_min INTEGER, target_max INTEGER, chip TEXT)`, `logged_sets(logged_exercise_id INTEGER REFERENCES logged_exercises(id), position INTEGER, weight REAL, reps INTEGER, seconds INTEGER)`.

- [ ] **Step 1: Write the failing tests**

```ts
let db: SqlDb; beforeEach(async () => { db = nodeDb(); await migrate(db); });
test('migrate twice is a no-op', async () => { await migrate(db); expect(await loadHistory(db)).toEqual({ sessions: [], checkIns: [], feedback: {} }); });
test('a check-in saved today is read back, and saving again replaces it', ...);   // good/gym then wrecked/home -> { value: 'wrecked', place: 'home' }
test('no check-in for a day reads as null', ...);
test('loadHistory lists check-ins by date', ...);                                 // two dates saved out of order -> ascending, { date, value } only
test('a saved session round-trips through loadHistory exactly', ...);
// SessionLog with intervals true, two exercises, sets mixing { weight: 60, reps: 8, seconds: null } and { weight: null, reps: null, seconds: 30 }, chip null and 'hard'
test('sessions come back in date order, same-date ones in save order', ...);
test('feedback is set, replaced and cleared', ...);                               // more -> never -> null -> {}
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/store` - Expected: FAIL, modules not found.

- [ ] **Step 3: Implement**

`saveSession` wraps its inserts in `BEGIN` / `COMMIT` (rolling back on error) through `execAsync`, so a half-written session never appears.

- [ ] **Step 4: Run tests and typecheck**

Run: `npx jest src/store && npm run -s typecheck` - Expected: PASS, clean.
Confirm `SQLiteDatabase` from expo-sqlite is assignable to `SqlDb` with a type-only line in `DbContext.tsx` (`const _check: (d: SQLiteDatabase) => SqlDb = d => d;`). If it is not, narrow `SqlDb` to what both satisfy and ledger a ruling.

- [ ] **Step 5: Commit**

```bash
git add src/store && git commit -m "feat(store): sqlite schema v1, check-ins, sessions and feedback with a node:sqlite-tested repository"
```

---

### Task 5: Check-in screen

**Files:**
- Modify: `src/app/_layout.tsx`, `src/app/index.tsx`, `src/app/index.test.tsx`
- Create: `src/ui/labels.ts`, `src/ui/useLoad.ts`, `src/test-utils/renderApp.tsx`

**Interfaces:**
- Consumes: Task 3 `ThumbArc`; Task 4 `useDb`, `checkInFor`, `saveCheckIn`, `migrate`; Task 1 `localToday`.
- Produces:
  - `FOCUS_LABEL: Record<SessionKind, string>` = chest-back "Chest / Back", lower "Lower", shoulders-arms "Shoulders / Arms", full-body "Full Body", conditioning "Conditioning", mobility "Mobility + Zone 2", rest "Rest", desk-reset "Desk reset". `CHECKIN_LABEL: Record<CheckIn, string>` = "Good", "OK", "Wrecked". `CHECKIN_HINT` = "Full session", "Fewer sets, hold weights", "Rest, mobility or a minimum dose". `DOSE_LABEL: Record<SessionDose, string>` = full "Full", reduced "Reduced", minimum "Minimum dose".
  - `useLoad<T>(load: () => Promise<T>, deps): T | undefined` - runs once per deps, ignores results after unmount.
  - `renderApp(routes, { initialUrl, db })` - wraps `expo-router/testing-library`'s `renderRouter` in `DbProvider` with the given `SqlDb`.
- `_layout.tsx`: `SQLiteProvider databaseName="workout.db" onInit={migrate}` around a bridge that passes `useSQLiteContext()` into `DbProvider`.

Screen (`/`): if today's check-in exists and the URL has no `redo=1`, `Redirect` to `/menu`.
Otherwise a `ThumbArc` with items Good, OK, Wrecked, Desk reset (accents from tokens; hints from `CHECKIN_HINT`, desk reset "5-10 min stretch, no check-in"), and a header with the date and a two-segment Gym / Home toggle (default Gym; if redoing, starts at the saved place).
Selecting a check-in saves it with the toggle's place and `router.replace('/menu')`. Selecting Desk reset `router.push('/desk')` and saves nothing.

- [ ] **Step 1: Write the failing tests**

```tsx
test('first open shows the check-in', ...);                          // labels Good, OK, Wrecked, Desk reset; Gym selected
test('picking a check-in saves it with the place and opens the menu', ...);  // press Home, press OK -> checkInFor(today) = { value: 'ok', place: 'home' }; pathname '/menu'
test('an existing check-in goes straight to the menu', ...);         // saveCheckIn(today) first -> pathname '/menu'
test('redo shows the check-in again', ...);                          // initialUrl '/?redo=1' with a saved check-in -> Good visible
test('desk reset opens without a check-in', ...);                    // press Desk reset -> pathname '/desk'; checkInFor(today) null
```

Use `jest.useFakeTimers({ now: new Date(2026, 10, 22, 19, 0) })` (or a fixed `Date` mock) so `localToday()` is `2026-11-22`. Routes are stub components for `/menu` and `/desk`.

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/app/index` - Expected: FAIL.

- [ ] **Step 3: Implement the screen, labels, `useLoad`, `renderApp` and the layout bridge**

- [ ] **Step 4: Run tests and typecheck**

Run: `npx jest && npm run -s typecheck` - Expected: all pass, clean.
If `renderRouter` does not accept a wrapper, provide the `DbProvider` from a test-only `_layout` route passed in `routes`, and ledger it.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(app): check-in on the thumb arc with the Gym/Home toggle; once per day, redo allowed"
```

---

### Task 6: Focus menu

**Files:**
- Create: `src/app/menu.tsx`, `src/app/menu.test.tsx`, `src/ui/library.ts`

**Interfaces:**
- Consumes: `rankFocuses`, `buildSession`, `BuilderInput`, `FocusOption` from `src/builder`; Task 4 `loadHistory`, `checkInFor`; Task 5 labels, `useLoad`, `renderApp`.
- Produces: `LIBRARY: Exercise[]` (the bundled `src/library/library.json`, typed once); `menuItems(input: BuilderInput): ArcItem[]` in `menu.tsx` (exported for tests).

`menuItems`: one item per `rankFocuses(input)` option, in its order, `id` = `"<focus>:<dose>"`, label from `FOCUS_LABEL`, hint = dose label (omitted for `full`) and `~N min` from `buildSession(input, option).estimatedMinutes` (Rest's hint is "Walk, stretch, sleep"). Desk reset is always the last item.
Screen (`/menu`): loads today's check-in (none: `Redirect` to `/`) and history, renders `ThumbArc`, and a small header line "Good · Gym" that is a link to `/?redo=1`.
Selecting a focus pushes `/preview?focus=<focus>&dose=<dose>`; Desk reset pushes `/desk`.

- [ ] **Step 1: Write the failing tests**

```tsx
test('first evening offers lifting focuses, mobility and the desk reset', ...);  // empty history, good, gym: >= 3 focus items, then 'Mobility + Zone 2', last 'Desk reset'
test('home menu offers mobility and desk reset only', ...);                      // ids ['mobility:full'?, 'desk-reset'] - assert no id starts with a lifting focus or conditioning
test('wrecked leads with rest', ...);                                            // first label 'Rest'
test('hints show the dose and the estimated minutes', ...);                      // reduced option hint matches /^Reduced · ~\d+ min$/
test('without a check-in today the menu sends you to check in', ...);            // pathname '/'
test('picking a focus opens its preview', ...);                                  // press first item -> pathname '/preview', params focus/dose
```

The first four test `menuItems` directly with `{ library: LIBRARY, history: emptyHistory(), today: '2026-11-22', ... }`; the last two render the screen.

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/app/menu` - Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run tests and typecheck**

Run: `npx jest && npm run -s typecheck` - Expected: all pass, clean.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(app): focus menu on the thumb arc from rankFocuses, with dose and time hints"
```

---

### Task 7: Session preview

**Files:**
- Create: `src/app/preview.tsx`, `src/app/preview.test.tsx`, `src/ui/format.ts`, `src/ui/format.test.ts`

**Interfaces:**
- Consumes: `buildSession`, `PlannedSession`, `Block`, `PlannedExercise`, `FocusId`, `SessionDose` from `src/builder`; Task 6 `LIBRARY`.
- Produces: `blockTitle(kind: BlockKind): string`; `doseText(sets: number, dose: Dose): string`; `parseOption(focus: unknown, dose: unknown): FocusOption | null`.

Copy (exact):
- `blockTitle`: warmup "Warm-up", main "Main lift", superset "Superset", finisher "Finisher", intervals "Intervals", zone2 "Zone 2", core "Core", mobility "Mobility", stability "Stability", cooldown "Cool-down".
- `doseText`: reps `"3 × 6-10"` (or `"3 × 8"` when min equals max), hold `"2 × 30 s"`, duration `"8 min"` (sets of 1 omit the count; `"2 × 4 min"` otherwise).

Screen (`/preview?focus&dose`): `parseOption` the params (invalid: `Redirect` to `/menu`), rebuild the session with the same inputs as the menu (the builder is deterministic, so this is the session the menu estimated).
Header: focus label, `~N min`, and tags when true: "Deload week", "Calibration week", and the main-lift RIR as "RIR 1-3".
Body: a scroll list of blocks with their titles; each item shows the exercise name, `doseText`, and the weight when known (`"60 kg"`; 0 kg shows "Bodyweight"). Superset items are labelled A1/A2, B1/B2 by superset order.
Rest shows a single calm line: "Rest tonight. Walk, stretch, sleep." and a button back to the menu.
Footer: a disabled Start button with the caption "Logging arrives in the next update" (Plan 4 enables it).

- [ ] **Step 1: Write the failing tests**

```ts
// format.test.ts
test('reps dose text', () => { expect(doseText(3, { format: 'reps', min: 6, max: 10 })).toBe('3 × 6-10'); expect(doseText(3, { format: 'reps', min: 8, max: 8 })).toBe('3 × 8'); });
test('hold and duration dose text', () => { expect(doseText(2, { format: 'hold', seconds: 30 })).toBe('2 × 30 s'); expect(doseText(1, { format: 'duration', minutes: 8 })).toBe('8 min'); expect(doseText(2, { format: 'duration', minutes: 4 })).toBe('2 × 4 min'); });
test('parseOption accepts known focus and dose only', () => { expect(parseOption('lower', 'full')).toEqual({ focus: 'lower', dose: 'full' }); expect(parseOption('legs', 'full')).toBeNull(); expect(parseOption('lower', 'max')).toBeNull(); expect(parseOption(['lower'], 'full')).toBeNull(); });
```

```tsx
// preview.test.tsx (check-in good/gym saved for today, empty history)
test('a chest/back preview lists its blocks and minutes', ...);     // 'Chest / Back', /~\d+ min/, 'Warm-up', 'Main lift', 'Superset', 'Cool-down', 'Calibration week'
test('superset items are labelled A1 and A2', ...);
test('unknown focus returns to the menu', ...);                      // '/preview?focus=legs&dose=full' -> pathname '/menu'
test('rest shows the rest message', ...);                            // '/preview?focus=rest&dose=full'
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/ui/format src/app/preview` - Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run tests and typecheck**

Run: `npx jest && npm run -s typecheck` - Expected: all pass, clean.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(app): session preview with blocks, doses, known weights and week tags"
```

---

### Task 8: Desk reset player

**Files:**
- Create: `src/app/desk.tsx`, `src/app/desk.test.tsx`, `src/ui/useCountdown.ts`, `src/ui/useCountdown.test.ts`

**Interfaces:**
- Consumes: `buildDeskReset` from `src/builder`; Task 6 `LIBRARY`; Task 7 `doseText`; Task 1 `localToday`, `impact`.
- Produces: `useCountdown(): { remaining: number | null; start(seconds: number): void; stop(): void }` - ticks once a second, stops at 0, calls an `onDone` passed as `useCountdown(onDone)`.

Screen (`/desk`): `buildDeskReset(LIBRARY, localToday())`, one item at a time: "3 / 7", name, `doseText`, the first two instruction lines, and Back / Next.
Hold items show a "Start 30 s" button that runs the countdown; at 0 it fires `impact()` and moves to the next item.
Rep and duration items have no timer. The last item's Next reads "Done" and goes back (`router.back()`, or `router.replace('/')` when there is no history).
Nothing is saved: the desk reset is not a training session.

- [ ] **Step 1: Write the failing tests**

```ts
test('countdown ticks down and calls onDone once at zero', ...);   // fake timers: start(3), advance 1 s -> 2, advance 2 s -> null, onDone called once
test('stop cancels the countdown', ...);
```

```tsx
test('desk reset steps through every item', ...);          // shows '1 / 7'; press Next six times -> '7 / 7' and 'Done'
test('a hold counts down and advances by itself', ...);    // first hold item: press 'Start 30 s', advance 30 s -> next item shown
test('done leaves the desk reset', ...);                   // pathname changes away from '/desk'
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/ui/useCountdown src/app/desk` - Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run tests and typecheck**

Run: `npx jest && npm run -s typecheck` - Expected: all pass, clean.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(app): desk reset player with hold timers"
```

---

## After the final review: on-device check (owner)

Jest cannot prove the feel of the arc.
After the branch review, the owner runs `npx expo start` and opens it in Expo Go (or a dev build) on the phone, and checks: the arc follows the thumb smoothly, ticks on each item, selects on release, cancels when dragged far left; check-in to preview in 3 taps; desk reset in 1 tap from opening; reopening the same evening skips the check-in.
Feel values live in `tokens.arc` and `tokens.motion` and are tuned from that session.
