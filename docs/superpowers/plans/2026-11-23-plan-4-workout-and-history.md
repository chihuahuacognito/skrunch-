**Date**: 2026-11-23
**Content Type**: Implementation Plan

# Plan 4: Workout and History - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tap Start on tonight's preview and train: one exercise at a time with pre-filled sets, one tap to log a set, an automatic rest timer with an Android notification, swaps and more / less / never feedback, then a one-line summary. Logged sessions feed the builder's progression, and the history can be backed up.

**Architecture:** The workout is a pure state machine in `src/workout/` (no React Native imports): `startWorkout` turns a `PlannedSession` into pre-filled sets, `reduceWorkout` applies ticks, edits, swaps and rest changes, and `toSessionLog` turns the result into the builder's `SessionLog`.
The in-progress workout is saved as a JSON draft in sqlite after every change, so Android killing the app mid-rest loses nothing, and the app reopens straight into it.
Screens and side effects (notifications, file export) are thin adapters around that core.

**Tech Stack:** Expo SDK 58, expo-router, React 19.3, RN 0.88, expo-sqlite, expo-notifications (new), expo-file-system (new), expo-keep-awake, Jest 30 / jest-expo, @testing-library/react-native.

**Spec:** `docs/superpowers/specs/2026-11-22-workout-app-design.md` (main flow, effort logging, progression, first run, workout screen, out-of-app guidance, technical decisions: storage, backup, rest-timer notification).
Roadmap: `docs/superpowers/plans/2026-11-22-plan-1-scaffold-and-library.md`. Builder API: `src/builder/index.ts`. Previous plan: `docs/superpowers/plans/2026-11-22-plan-3-app-shell.md`.

## Decisions this plan makes (owner may overrule)

The spec leaves these to the builder. Each is a reasoned default.

1. **Supersets show as one step.** A superset pair is one screen with both exercises; every other item is its own step. Rest follows each item's `restSeconds`, which the builder already sets to 0 for A1 and 75 s for A2, so rest starts after each round.
2. **Rep pre-fill.** Weight is the builder's planned weight. Reps are last time's reps for that set (clamped to the range); on first appearance, or after the weight went up, they start at the bottom of the range. To earn progression the owner bumps reps when he beats them. Ticking still means "done as planned".
3. **Bodyweight lifts pre-fill 0 kg** (no equipment, or only pull-up bar / bench / mat / bodyweight). A loaded lift with no known weight cannot be ticked: the tick opens the weight editor instead.
4. **Ticking is idempotent.** A tap on a done set does nothing. Long-press undoes it. A double tap never unticks.
5. **The last-set chip** (easy / right / hard) appears on the rest banner right after an exercise's last set, and stays on that exercise's card. Only strength items (with a slot) get it.
6. **Swaps only before the first set** of that exercise is ticked. "Never" records feedback only; the same sheet offers Swap.
7. **System rest notification only for rests of 45 s or more.** Shorter rests (warm-up flows at 15 s, stability at 30 s) count down in the app only.
8. **A draft from an earlier training day** is saved under its own date if it has any done sets, otherwise dropped. The app never resumes yesterday's workout.
9. **Export** asks for a folder once (Android's folder picker, pointed at Downloads), remembers it, and from then on is one tap. It lives on the summary screen. The one remembered setting goes in a sqlite `settings` table instead of adding AsyncStorage for one value.
10. **No history browsing screen.** The roadmap's "history" is persistence, progression inputs and backup. A history view is not in the spec.

## Global Constraints

- Never use the em dash, in UI copy, code comments or docs. Use a plain dash.
- UI code imports the builder only from `src/builder` (the index).
- `src/workout/` has no React Native or Expo imports; it is tested as plain TypeScript.
- Tests live outside `src/app` (`src/__tests__/app` for screens), because Expo Router bundles every file in `src/app` as a route.
- "Today" is `useToday()` / `localToday()` (04:00 rollover). Never `toISOString()` for dates.
- Logging a set is one tap, pre-filled. No forms mid-workout. No streaks or nagging notifications.
- `LoggedSet` is `{ weight, reps | null, seconds | null }`; holds and timed work log `seconds` (minutes x 60). Bodyweight lifts log 0 kg.
- Only done sets are saved. An exercise with no done sets is not in the `SessionLog`.
- Rest timer actions, exactly: "Complete set", "+15 s", "Skip".
- Touch targets at least 44 px. Dark theme tokens from `src/theme/tokens.ts`. Haptics: `tick()` on a set tick, `impact()` when a rest or hold timer ends.
- New runtime dependencies are only `expo-notifications` (Task 7) and `expo-file-system` (Task 8), each via `npx expo install`.
- Work on branch `feat/plan-4-workout`, created from `feat/plan-3-app-shell` (Plan 3 is not merged yet; rebase onto main once it is). Commits carry no AI co-author line.

## Review Focus

- Android kills the app during a rest (normal when the phone is locked). Reopening must land back in the same workout, same step, same ticks, with the rest timer still counting against the clock. Pinned in Task 3 (`a draft round-trips exactly`) and Task 4 (`reopening the app resumes the workout`).
- Last night's workout was never finished. Today the app must not resume it, and its done sets must still count as last night's session. Pinned in Task 3 (`a stale draft is saved under its own date and cleared`).
- A double tap on a set's tick, or on Finish, must log once. Pinned in Task 2 (`ticking a done set changes nothing`) and Task 5 (`finishing twice saves one session`).
- First appearance of a loaded lift (blank weight). Ticking must never save a null weight for it. Pinned in Task 2 (`a loaded set with no weight cannot be ticked`) and Task 4 (`ticking a blank loaded set opens the weight editor`).
- A rest notification outliving the workout. Finishing or discarding must cancel it, so no "Rest over" fires after the session ends. Pinned in Task 7 (`finishing cancels the rest notifications`).

---

### Task 1: Builder additions - last log, replace item

**Files:**
- Modify: `src/builder/prescribe.ts`, `src/builder/swap.ts`, `src/builder/index.ts`
- Test: `src/builder/prescribe.test.ts`, `src/builder/swap.test.ts`

**Interfaces:**
- Produces (all exported from `src/builder/index.ts`):
  - `lastLog(exerciseId: string, history: History): LoggedExercise | null` - the most recent logged entry of that exercise with at least one set (what `nextLoad` already reads as `last`; refactor `nextLoad` to use it).
  - `INCREMENT_KG` (already defined in `prescribe.ts`; now exported from the index too).
  - `replaceItem(input: BuilderInput, session: PlannedSession, blockIndex: number, itemIndex: number, exerciseId: string): PlannedSession` - a new session with that item replaced. It keeps `slot`, `sets`, `rir` and `restSeconds`, and recomputes `dose = prescribeReps(e.dose, slot.kind)` and `weight` / `progressed` from `nextLoad(e, input.history, input.checkIn === 'good' && session.dose === 'full' && !session.deload)`, the same rule `buildSession` uses. `estimatedMinutes` is recomputed with `estimateMinutes`. Throws on an item without a slot or an unknown id. Does not mutate `session`.

- [ ] **Step 1: Create the branch**

Run: `git checkout feat/plan-3-app-shell && git checkout -b feat/plan-4-workout`
Expected: on `feat/plan-4-workout`, clean tree.

- [ ] **Step 2: Write the failing tests**

```ts
// prescribe.test.ts
test('lastLog returns the most recent logged entry with sets', () => {
  const h = hist([logged('2026-11-10', 'chest-back', [[BENCH, 3]], { weight: 50 }), logged('2026-11-14', 'chest-back', [[BENCH, 3]], { weight: 55 })]);
  expect(lastLog(BENCH, h)?.sets[0].weight).toBe(55);
  expect(lastLog('nope', h)).toBeNull();
});
```

```ts
// swap.test.ts
test('replaceItem swaps in the candidate with its own rep range and last weight, progressed on a good full night', () => {
  // s = buildSession(input(), chest-back full); m = main block index; pick = swapCandidates(input(), s, m, 0)[0]
  // history: one earlier session logging pick at 40 kg, every set at its targetMax
  // replaceItem(input({ history }), s, m, 0, pick.id).blocks[m].items[0] ->
  //   exerciseId pick.id, slot/sets/rir/restSeconds equal to the old item's, weight 40 + INCREMENT_KG[pick.equipment[0]], progressed true
});
test('replaceItem holds the weight on an OK night', ...);                      // checkIn 'ok' -> weight 40, progressed false
test('replaceItem leaves the original session untouched', ...);                // s.blocks[m].items[0].exerciseId unchanged
test('replaceItem refuses items without a slot', ...);                         // warm-up item -> toThrow
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx jest src/builder/prescribe src/builder/swap` - Expected: FAIL, `lastLog` / `replaceItem` not exported.

- [ ] **Step 4: Implement `lastLog`, `replaceItem` and the index exports**

- [ ] **Step 5: Run the builder suite and typecheck**

Run: `npx jest src/builder && npm run -s typecheck` - Expected: PASS (all existing builder tests still green), clean.

- [ ] **Step 6: Commit**

```bash
git add src/builder && git commit -m "feat(builder): lastLog and replaceItem for the workout screen's pre-fill and swaps"
```

---

### Task 2: Workout state machine (pure)

**Files:**
- Create: `src/workout/types.ts`, `src/workout/start.ts`, `src/workout/reduce.ts`, `src/workout/log.ts`, `src/workout/index.ts`
- Test: `src/workout/start.test.ts`, `src/workout/reduce.test.ts`, `src/workout/log.test.ts`

**Interfaces:**
- Consumes: `PlannedSession`, `PlannedExercise`, `History`, `Chip`, `SessionLog`, `lastLog` from `src/builder`; `Exercise` from `src/library/types`.
- Produces (re-exported from `src/workout/index.ts`):
  ```ts
  export interface SetEntry { weight: number | null; reps: number | null; seconds: number | null; done: boolean }
  export interface ItemLog { sets: SetEntry[]; chip: Chip | null }
  export interface ItemRef { block: number; item: number }
  export interface Step { block: number; items: number[] }
  export interface Rest { endsAt: number; seconds: number; from: ItemRef }
  export interface WorkoutState { version: 1; session: PlannedSession; startedAt: number; logs: ItemLog[][]; step: number; rest: Rest | null }
  export type WorkoutAction =
    | { type: 'tick'; ref: ItemRef; set: number; now: number }
    | { type: 'untick'; ref: ItemRef; set: number }
    | { type: 'edit'; ref: ItemRef; set: number; field: 'weight' | 'reps' | 'seconds'; value: number | null }
    | { type: 'chip'; ref: ItemRef; chip: Chip | null }
    | { type: 'go'; step: number }
    | { type: 'completeNext'; now: number }
    | { type: 'restPlus'; seconds: number }
    | { type: 'restEnd' }
    | { type: 'swap'; ref: ItemRef; item: PlannedExercise; sets: SetEntry[] };
  ```
  - `isBodyweight(e: Exercise): boolean` - equipment empty or only `bodyweight`, `pull-up bar`, `bench`, `mat`.
  - `prefillSets(item: PlannedExercise, e: Exercise, history: History): SetEntry[]` - decision 2 and 3. `weight` = `item.weight`, else 0 for a slotted bodyweight item, else null (non-slot items are always null). Reps dose: `dose.min` when `item.progressed` or no `lastLog`, else last time's reps at the same set index (falling back to its last set), clamped to `[min, max]`. Hold: `seconds = dose.seconds`. Duration: `seconds = minutes * 60`. All `done: false`.
  - `stepsOf(session: PlannedSession): Step[]` - a superset block is one step with all its items; every other block gives one step per item. Order follows blocks then items.
  - `startWorkout(session: PlannedSession, library: Exercise[], history: History, now: number): WorkoutState` - `step: 0`, `rest: null`, chips null.
  - `canTick(state, ref, set): boolean` - false when the item has a slot and the set's weight is null (decision 3).
  - `nextOpenSet(state): { ref: ItemRef; set: number } | null` - in the current step, the not-done set with the lowest index, items in step order (A1 s1, A2 s1, A1 s2...); if the step is complete, the first open set of the following steps.
  - `reduceWorkout(state: WorkoutState, action: WorkoutAction): WorkoutState` - pure, returns the same object when nothing changes:
    - `tick`: no-op if already done or `!canTick`. Marks done. If the item's `restSeconds > 0`, `rest = { endsAt: now + restSeconds * 1000, seconds: restSeconds, from: ref }`. If every set of every item in the current step is now done and it is not the last step, `step += 1`.
    - `untick`: marks not done; rest and step unchanged.
    - `edit`: sets the field. A weight edit also copies the value to the later not-done sets of the same item.
    - `chip`: sets the item's chip (null clears).
    - `go`: clamps to `[0, steps - 1]`.
    - `completeNext`: `tick` on `nextOpenSet` (no-op if none or it cannot be ticked).
    - `restPlus`: `endsAt += seconds * 1000`, `seconds += seconds`; no-op without a rest. `restEnd`: `rest = null`.
    - `swap`: no-op if any set of that item is done; replaces `session.blocks[b].items[i]` and its log (chip null).
  - `toSessionLog(state: WorkoutState): SessionLog | null` (in `log.ts`) - `date = session.date`, `focus = session.focus`, exercises in block then item order with only done sets (`{ weight, reps, seconds }`), skipping exercises with none; `targetMin` / `targetMax` from a reps dose, else null; `intervals = session.intervals && ` some done set in an `intervals` or `finisher` block. Returns null when nothing is done, or when `session.focus` is `desk-reset` or `rest`.
  - `summaryOf(state, now: number): { minutes: number; sets: number; exercises: number }` - minutes rounded from `startedAt`, counts of done sets and of exercises with a done set.

- [ ] **Step 1: Write the failing tests**

Build sessions with the real builder (`buildSession` with `lib` and `emptyHistory()` from `src/builder/test-utils/fixtures`, chest-back full, gym, good, `2026-11-22`) so the tests exercise real shapes.

```ts
// start.test.ts
test('steps: a superset is one step, other items one step each', ...);   // stepsOf(s): every superset block appears once with items [0, 1]; warm-up items one per step
test('first appearance: loaded lifts are blank, bodyweight lifts 0 kg, reps at the bottom of the range', ...);
//   prefillSets(item for BENCH, byId(BENCH), emptyHistory()) -> 3 sets { weight: null, reps: dose.min }
//   prefillSets(slotted item for 'Pushups', ...) -> weight 0
test('reps follow last time per set, clamped to the range', ...);         // last logged reps [10, 9, 7] with dose 6-10 -> [10, 9, 7]; [12, 12, 12] -> [10, 10, 10]
test('after a weight increase reps restart at the bottom', ...);          // item.progressed true -> reps all dose.min
test('holds and timed work pre-fill seconds', ...);                       // hold 30 s -> seconds 30, reps null; duration 8 min -> seconds 480
```

```ts
// reduce.test.ts - s0 = startWorkout(...), with the main lift's weight edited to 60 before ticking
test('ticking logs the set and starts the item rest', ...);                // tick main s1 at now 1000 -> done, rest { endsAt: 1000 + 150_000, seconds: 150 }
test('ticking a done set changes nothing', ...);                           // second identical tick returns the same object (toBe)
test('a loaded set with no weight cannot be ticked', ...);                 // blank BENCH set -> state unchanged; canTick false
test('a weight edit fills the later open sets of that exercise', ...);     // edit set 0 to 60 -> sets 1, 2 weight 60; a done set keeps its own weight
test('finishing a step moves to the next one', ...);                       // tick every set of step 0 -> step 1; ticking the last step's sets leaves step at the end
test('a superset rests only after the second exercise', ...);              // tick A1 s1 -> rest null; tick A2 s1 -> rest.seconds 75
test('complete set from the notification ticks the next open set in round order', ...);  // superset step: A1 s1, A2 s1, A1 s2
test('+15 s extends the rest and the rest can end', ...);
test('swap replaces an untouched item and refuses a started one', ...);
test('untick reopens a set', ...);
```

```ts
// log.test.ts
test('only done sets are logged, skipped exercises are left out', ...);
test('targets come from the reps dose; holds log seconds with null targets', ...);
test('chips are carried to the log', ...);
test('intervals is set only when an interval set was done', ...);         // conditioning full session with intervals: none done -> false; one done -> true
test('nothing done logs nothing', ...);                                    // toSessionLog(start) === null
test('summary counts minutes, sets and exercises', ...);                   // startedAt 0, now 54 * 60_000 -> minutes 54
test('a logged workout feeds progression', ...);
// tick every main-lift set at the top of its range with chip 'right', toSessionLog, then buildSession for the same focus
// 3 days later with that history -> the main lift's weight is 60 + increment and progressed is true
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/workout` - Expected: FAIL, modules not found.

- [ ] **Step 3: Implement `types.ts`, `start.ts`, `reduce.ts`, `log.ts`, `index.ts`**

- [ ] **Step 4: Run tests and typecheck**

Run: `npx jest src/workout && npm run -s typecheck` - Expected: PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add src/workout && git commit -m "feat(workout): pure workout state - pre-filled sets, idempotent ticks, rest, swaps and the session log"
```

---

### Task 3: Storage - transactions, drafts, settings (schema v2)

**Files:**
- Modify: `src/store/sql.ts`, `src/store/schema.ts`, `src/store/history.ts`, `src/store/DbContext.tsx`
- Create: `src/store/workout.ts`, `src/store/settings.ts`
- Test: `src/store/history.test.ts`, `src/store/workout.test.ts`

**Interfaces:**
- Consumes: Task 2 `WorkoutState`, `toSessionLog`.
- Produces:
  - `SqlDb` gains an optional `withExclusiveTransactionAsync?(task: (txn: SqlDb) => Promise<void>): Promise<void>` (expo-sqlite has it; `nodeDb` does not).
  - `inTransaction(db: SqlDb, task: (tx: SqlDb) => Promise<void>): Promise<void>` in `sql.ts` - uses `withExclusiveTransactionAsync` when present, else `BEGIN` / `COMMIT` / `ROLLBACK` through `execAsync`. `saveSession` moves onto it, through an internal `insertSession(tx, log)`.
  - `MIGRATIONS` is exported (for the upgrade test). Schema v2 (its second entry): `active_workout (id INTEGER PRIMARY KEY CHECK (id = 1), date TEXT NOT NULL, state TEXT NOT NULL)`, `settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL)`.
  - `saveDraft(db, state: WorkoutState): Promise<void>` - upsert row 1 with `JSON.stringify(state)` and `state.session.date`.
  - `loadDraft(db, today: string): Promise<WorkoutState | null>` - the draft for `today`. A draft from another date is settled first (decision 8): in one transaction its `toSessionLog` (if any) is inserted and the row deleted; then null. Unparseable JSON or `version !== 1` is deleted and reads as null.
  - `completeWorkout(db, state: WorkoutState): Promise<boolean>` - one transaction: insert `toSessionLog(state)` if not null, delete the draft. Returns whether a session was saved. A second call finds no draft and saves nothing (returns false).
  - `discardWorkout(db): Promise<void>` - deletes the draft.
  - `getSetting(db, key: string): Promise<string | null>`; `setSetting(db, key: string, value: string): Promise<void>`.

- [ ] **Step 1: Write the failing tests**

```ts
// workout.test.ts - db = nodeDb(); await migrate(db); state from startWorkout on a chest-back session dated '2026-11-22'
test('migrating a v1 database adds the draft and settings tables and keeps its history', ...);  // run MIGRATIONS[0] by hand, save a session, then migrate -> loadHistory unchanged, user_version 2
test('a draft round-trips exactly', ...);                     // saveDraft(ticked state) -> loadDraft(db, '2026-11-22') toEqual state (rest included)
test('saving a draft again replaces it', ...);
test('a stale draft is saved under its own date and cleared', ...);   // draft dated 2026-11-22 with done sets; loadDraft(db, '2026-11-23') -> null; loadHistory has one session dated 2026-11-22
test('a stale draft with nothing done is dropped', ...);              // no session saved
test('a corrupt draft reads as no draft', ...);                       // UPDATE active_workout SET state = '{' -> null, row gone
test('completing saves the session and clears the draft once', ...); // true, then false; one session in loadHistory
test('completing with nothing done saves nothing', ...);              // false; no session; draft gone
test('settings are stored and replaced', ...);
```

```ts
// history.test.ts - add
test('a failed session save leaves nothing behind', ...);             // log with a non-number weight -> rejects; loadHistory sessions []
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/store` - Expected: FAIL.

- [ ] **Step 3: Implement**

Keep the `DbContext.tsx` type-only assignability check compiling (`SQLiteDatabase` to `SqlDb`). expo-sqlite's `withExclusiveTransactionAsync` passes a `Transaction` object; if its type is not assignable to `SqlDb`, wrap it in the expo adapter rather than loosening `SqlDb`, and ledger it.

- [ ] **Step 4: Run tests and typecheck**

Run: `npx jest src/store && npm run -s typecheck` - Expected: PASS, clean.

- [ ] **Step 5: Commit**

```bash
git add src/store && git commit -m "feat(store): schema v2 with the workout draft and settings; exclusive transactions; stale drafts settle under their own date"
```

---

### Task 4: Workout screen - start, sets, rest, resume

**Files:**
- Create: `src/app/workout.tsx`, `src/features/workout/SetRow.tsx`, `src/features/workout/NumberEditor.tsx`, `src/features/workout/RestBanner.tsx`, `src/ui/useRemaining.ts`
- Modify: `src/app/preview.tsx`, `src/app/index.tsx`, `src/ui/labels.ts`
- Test: `src/__tests__/app/workout.test.tsx`, `src/__tests__/app/preview.test.tsx`, `src/__tests__/app/index.test.tsx`, `src/ui/useRemaining.test.ts`

**Interfaces:**
- Consumes: Task 1 `INCREMENT_KG`; Task 2 everything; Task 3 `saveDraft`, `loadDraft`; Plan 3 `useToday`, `useLoad`, `useOnceUntilFocus`, `useCountdown`, `doseText`, `weightText`, `blockTitle`, `LIBRARY`, `tick`, `impact`.
- Produces:
  - `useRemaining(endsAt: number | null, onEnd: () => void): number | null` - whole seconds left, re-rendering each second against the clock; calls `onEnd` once when it reaches 0.
  - `CHIP_LABEL: Record<Chip, string>` = easy "Easy", right "Right", hard "Hard" in `labels.ts`; `clock(seconds): string` (`90` -> `"1:30"`) in `src/ui/format.ts`.
  - `useWorkout(db, today)` inside `workout.tsx` (not exported): loads the draft, holds it in `useReducer(reduceWorkout)`, and calls `saveDraft` after every change through one promise chain, so writes never overlap or reorder.

Preview: Start is enabled (drop the "Logging arrives" caption). On press (guarded by `useOnceUntilFocus`): if `loadDraft(db, today)` already has a draft, `router.replace('/workout')` without touching it; otherwise `saveDraft(startWorkout(session, LIBRARY, history, Date.now()))` then `router.replace('/workout')`. Rest has no Start.

Check-in screen (`/`): before the check-in logic, a draft for today redirects to `/workout`.

Workout screen (`/workout`), no draft for today: `Redirect` to `/`.
- Top line: the step's block title (superset steps "Superset A" / "Superset B" by superset order), `"4 / 14"`, and an "End" button (Task 5 wires it; here it is present but inert).
- Rest banner while `state.rest` is set: "Rest", `clock(remaining)`, "+15 s" (dispatch `restPlus` 15) and "Skip" (`restEnd`). At 0: `impact()` and `restEnd`. If the item that started the rest has a slot and all its sets are done, the banner also shows that exercise's name and the three chips (selected chip highlighted; tapping it again clears).
- One card per item in the step: letter (A1 / A2) for supersets, exercise name, `doseText`, RIR as "RIR 1-3" when set. Then one `SetRow` per set: "Set 1", the weight cell (`weightText`, or "Add kg" when null; hidden for non-slot items), the reps or seconds cell, and the tick button.
  - Tick: `accessibilityLabel` "Log set N" (done: "Set N done"). Press: if `canTick`, dispatch `tick` with `Date.now()` and `tick()` haptic; if not, open the weight editor for that set. Long-press: `untick`.
  - Tapping a cell opens `NumberEditor` inline under the row: "-" value "+" with a numeric `TextInput` (`keyboardType="decimal-pad"` for weight, `"number-pad"` otherwise), and "Done". Steps: weight `INCREMENT_KG[e.equipment[0] ?? 'other']`, reps 1, seconds 5. Never below 0.
  - Hold and duration sets also show "Start 30 s" / "Start 8 min" using `useCountdown`; at 0 it ticks the set and fires `impact()`. Hold timers keep the screen awake while running (`activateKeepAwakeAsync` / `deactivateKeepAwake`); duration timers do not.
  - When all of an item's sets are done and it has a slot, the card shows the chips too.
- Bottom: "Back" and "Next" (`go` step -/+ 1). On the last step Next reads "Finish" (Task 5 wires it).

- [ ] **Step 1: Write the failing tests**

```ts
// useRemaining.test.ts (fake timers)
test('counts down against the clock and ends once', ...);   // endsAt now + 3000 -> 3, advance 1 s -> 2, advance 5 s -> onEnd called once
```

```tsx
// workout.test.tsx - check-in good/gym saved, a chest-back draft started through startWorkout at 2026-11-22 19:00 (fake timers)
test('the first step shows the warm-up item with its sets', ...);
test('ticking logs the set and saves the draft', ...);                     // press 'Log set 1' -> 'Set 1 done'; loadDraft(db) has that set done
test('ticking a blank loaded set opens the weight editor', ...);           // go to the main lift; press 'Log set 1' -> the weight input shows; the set is still open
test('entering a weight fills the open sets and allows the tick', ...);    // type 60 -> Done -> all three rows show '60 kg'; tick -> 'Set 1 done'
test('a tick with rest shows the rest banner, and skip clears it', ...);   // '2:30' visible; press 'Skip' -> banner gone
test('the rest banner offers the chip after the last set', ...);           // tick all main sets -> 'Easy' 'Right' 'Hard'; press 'Hard' -> loadDraft chip 'hard'
test('reopening the app resumes the workout', ...);                        // unmount, render '/' with index + workout routes -> workout step and ticks as saved
test('no draft sends you back to check in', ...);
```

```tsx
// preview.test.tsx - replace 'start waits for the next update'
test('start begins the workout', ...);                    // press 'Start' -> pathname '/workout'; loadDraft(db, TODAY) not null
test('start resumes an existing workout instead of replacing it', ...);   // saveDraft first with one tick -> after Start the draft still has that tick
```

```tsx
// index.test.tsx - add
test('a workout in progress opens straight into it', ...);                 // saveDraft for today -> pathname '/workout'
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/ui/useRemaining src/__tests__/app` - Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run tests and typecheck**

Run: `npx jest && npm run -s typecheck` - Expected: all pass, clean.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(app): workout screen - pre-filled sets, one-tap ticks, inline editor, rest banner with the last-set chip; resumes after the app is killed"
```

---

### Task 5: End, finish, discard and the summary

**Files:**
- Create: `src/app/summary.tsx`, `src/features/workout/EndSheet.tsx`
- Modify: `src/app/workout.tsx`, `src/ui/labels.ts`
- Test: `src/__tests__/app/workout.test.tsx`, `src/__tests__/app/summary.test.tsx`

**Interfaces:**
- Consumes: Task 2 `summaryOf`, `toSessionLog`; Task 3 `completeWorkout`, `discardWorkout`.
- Produces: `GUIDANCE: string[]` in `labels.ts`, exactly:
  - "Steps: 8,000-10,000 a day."
  - "Zone 2: 90-150 min a week."
  - "Protein: 1.6-2.2 g per kg a day - dal, paneer, curd, soya chunks, eggs, chicken."

Finish (Next on the last step, or "Finish and save" in the end sheet), guarded by `useOnceUntilFocus`: compute `summaryOf(state, Date.now())`, `await completeWorkout(db, state)`; if it saved, `router.replace('/summary?minutes=&sets=&exercises=')`; if nothing was done, `router.replace('/')`.
"End" opens `EndSheet` (a modal) with "Finish and save", "Discard workout" and "Keep going". Discard asks with `Alert.alert("Discard tonight's workout?", 'Nothing will be saved.', [Keep it, Discard])`, then `discardWorkout` and `router.replace('/')`.
Summary (`/summary`): title "Saved", the line `"54 min · 21 sets · 9 exercises"` (bad params: `Redirect` to `/`), the `GUIDANCE` lines in dim text, a "Done" button (`router.replace('/')`), and the export button slot that Task 8 fills.

- [ ] **Step 1: Write the failing tests**

```tsx
test('finishing saves the session and shows the summary', ...);     // tick something, go to the last step, press 'Finish' -> 'Saved', /^\d+ min · \d+ sets · \d+ exercises$/; loadHistory has 1 session; loadDraft null
test('finishing twice saves one session', ...);                     // two quick presses on 'Finish' -> 1 session
test('finishing with nothing ticked saves nothing', ...);           // -> pathname '/'; no session
test('discard asks, then drops the workout', ...);                  // spy Alert.alert, call the Discard button's onPress -> no session, no draft, pathname '/'
test('the summary shows the guidance note', ...);                   // each GUIDANCE line visible
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/__tests__/app/workout src/__tests__/app/summary` - Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run tests and typecheck**

Run: `npx jest && npm run -s typecheck` - Expected: all pass, clean.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(app): finish, discard and the session summary with the static guidance note"
```

---

### Task 6: Swaps, feedback and the source link

**Files:**
- Create: `src/features/workout/ExerciseSheet.tsx`
- Modify: `src/app/workout.tsx`, `src/ui/labels.ts`
- Test: `src/__tests__/app/workout.test.tsx`

**Interfaces:**
- Consumes: `swapCandidates`, `replaceItem` from `src/builder`; Task 2 `prefillSets`, `swap` action; `setFeedback`, `loadHistory`, `checkInFor` from `src/store/history`.
- Produces: `FEEDBACK_LABEL: Record<Feedback, string>` = more "More of this", less "Less of this", never "Never again".

Each card gets an options button (`accessibilityLabel` "Options for <name>") that opens `ExerciseSheet` (a modal):
- "Swap" when the item has a slot and no done set: lists the top 5 of `swapCandidates(input, state.session, b, i)` with names. `input` = `{ library: LIBRARY, history, today, checkIn, place }` from the loaded history and today's check-in. Picking one: `replaceItem(...)`, `prefillSets` for the new item, dispatch `swap`, close.
- The three feedback rows, the current value selected (from `history.feedback`, updated locally after a change). Tapping one calls `setFeedback(db, id, value)`; tapping the selected one clears it (`null`). Feedback changes nothing tonight; it weights future selection through the builder.
- "Open the original post" when the exercise has a `sourceUrl` (`Linking.openURL`).

- [ ] **Step 1: Write the failing tests**

```tsx
test('swap replaces an untouched main lift with a candidate', ...);   // main step, Options -> Swap -> first candidate -> card shows its name; draft item replaced
test('swap is not offered once a set is done', ...);
test('feedback is saved, and tapping it again clears it', ...);       // 'Never again' -> loadHistory feedback[id] 'never'; again -> undefined
test('an exercise without a source has no post link', ...);           // 'Open the original post' absent (no library entry has sourceUrl yet)
```

- [ ] **Step 2: Run to verify they fail**

Run: `npx jest src/__tests__/app/workout` - Expected: FAIL.

- [ ] **Step 3: Implement**

- [ ] **Step 4: Run tests and typecheck**

Run: `npx jest && npm run -s typecheck` - Expected: all pass, clean.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(app): swap an exercise before its first set; more, less and never feedback; link to the original post"
```

---

### Task 7: Rest timer notification

**Files:**
- Modify: `package.json` (via `npx expo install expo-notifications`), `app.json` (plugin), `jest.setup.js`, `src/app/_layout.tsx`, `src/app/workout.tsx`
- Create: `src/notify/rest.ts`, `src/workout/notice.ts`
- Test: `src/notify/rest.test.ts`, `src/workout/notice.test.ts`

**Interfaces:**
- Consumes: Task 2 `WorkoutState`, `nextOpenSet`, actions `completeNext`, `restPlus`, `restEnd`.
- Produces:
  - `restNotice(state: WorkoutState, names: Map<string, string>, clockText: (ms: number) => string): { endsAt: number; title: string; body: string } | null` in `src/workout/notice.ts` (pure) - null when there is no rest or `rest.seconds < 45` (decision 7). `title` = `"Rest until 19:42"` (`clockText(endsAt)`, local 24-hour HH:MM). `body` = `"Next: Bench Press · set 3 · 60 kg × 8"`, using `nextOpenSet`; the weight part is left out when null, `0` shows "Bodyweight", seconds show `"30 s"`; `"Last set done"` when nothing is open.
  - `src/notify/rest.ts`:
    - `setupRestNotifications(): Promise<void>` - channels `rest-live` (low importance, silent) and `rest-end` (high importance, default sound, vibration); category `rest` with actions `complete` "Complete set", `plus15` "+15 s", `skip` "Skip", each `opensAppToForeground: false`; and a foreground handler that shows banners. Called once from `_layout.tsx`.
    - `showRest(n: { endsAt: number; title: string; body: string }): Promise<void>` - cancels the previous pair, presents the sticky `rest-live` notification (identifier `rest-live`, `categoryIdentifier: 'rest'`, `sticky: true`) and schedules `rest-end` at `endsAt` (title "Rest over", same body, same category).
    - `clearRest(): Promise<void>` - cancels the scheduled one and dismisses both.
    - `onRestAction(handler: (a: 'complete' | 'plus15' | 'skip') => void): () => void` - subscribes to notification responses; returns unsubscribe.
    - Permission: `requestPermissionsAsync()` on the first `showRest`; if denied, every call is a quiet no-op and the in-app banner still works.

Workout screen wiring: an effect keyed on `state.rest?.endsAt` calls `showRest(restNotice(...))` or `clearRest()`. `onRestAction` maps `complete` to `completeNext` with `Date.now()`, `plus15` to `restPlus` 15, `skip` to `restEnd`. Finishing and discarding call `clearRest()` before leaving.

- [ ] **Step 1: Install and mock**

Run: `npx expo install expo-notifications` - Expected: added at an SDK 58 version.
Add `"expo-notifications"` to `app.json` plugins. In `jest.setup.js`, `jest.mock('expo-notifications', ...)` with `jest.fn()` resolved stubs for every function `rest.ts` calls, `addNotificationResponseReceivedListener` returning `{ remove: jest.fn() }`, and the enums it uses.

- [ ] **Step 2: Write the failing tests**

```ts
// notice.test.ts
test('a main-lift rest names the next set', ...);       // body 'Next: <name> · set 2 · 60 kg × 8', title 'Rest until 19:42' for a fixed endsAt and clockText
test('short rests get no notification', ...);           // rest.seconds 15 -> null
test('the last set says so', ...);
```

```ts
// rest.test.ts
test('showRest presents the live notice and schedules the end', ...);   // scheduleNotificationAsync called twice: trigger null with sticky, and a date trigger at endsAt on 'rest-end'
test('showRest replaces the previous rest', ...);                        // cancel called before the second pair
test('denied permission makes showRest a no-op', ...);
test('actions reach the handler', ...);                                   // fire the captured listener with actionIdentifier 'plus15' -> handler('plus15')
```

```tsx
// workout.test.tsx - add
test('finishing cancels the rest notifications', ...);    // tick a main set (rest 150 s), Finish -> clearRest's cancel/dismiss mocks called
test('a notification action completes the next set', ...); // invoke the captured response listener with 'complete' -> next open set shows done
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx jest src/workout/notice src/notify src/__tests__/app/workout` - Expected: FAIL.

- [ ] **Step 4: Implement**

Check the installed `expo-notifications` types for the exact names (`setNotificationCategoryAsync`, `SchedulableTriggerInputTypes.DATE`, `dismissNotificationAsync`, the `sticky` content field). If a field the plan names does not exist in SDK 58, use the nearest equivalent and ledger it.

- [ ] **Step 5: Run tests and typecheck**

Run: `npx jest && npm run -s typecheck` - Expected: all pass, clean.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(notify): rest timer notification with Complete set, +15 s and Skip; cleared when the workout ends"
```

---

### Task 8: Backup - JSON export and Android Auto Backup

**Files:**
- Modify: `package.json` (via `npx expo install expo-file-system`), `app.json`, `jest.setup.js`, `src/app/summary.tsx`
- Create: `src/backup/export.ts`, `src/backup/saveFile.ts`
- Test: `src/backup/export.test.ts`, `src/backup/saveFile.test.ts`, `src/__tests__/app/summary.test.tsx`, `src/__tests__/app/config.test.ts`

**Interfaces:**
- Consumes: Task 3 `getSetting`, `setSetting`; `loadHistory`.
- Produces:
  - `historyExport(db: SqlDb, now: Date): Promise<string>` - pretty JSON (2-space indent): `{ format: 'workout-history', schema: 2, exportedAt: <local ISO-like 'YYYY-MM-DDTHH:MM'>, checkIns: [{ date, value, place }], feedback: {...}, sessions: History['sessions'] }`. Check-ins include `place`, so they are read straight from `check_ins`, not from `loadHistory`.
  - `exportFileName(today: string): string` = `"workout-history-2026-11-23.json"`.
  - `saveToFolder(db: SqlDb, name: string, json: string): Promise<'saved' | 'cancelled'>` in `saveFile.ts` - decision 9. Reads the folder from setting `backup_dir`. If none, asks for one with expo-file-system's directory picker (SDK 58: `Directory.pickDirectoryAsync()` from `expo-file-system`; if that API is absent, `StorageAccessFramework.requestDirectoryPermissionsAsync()` from `expo-file-system/legacy`) and stores its URI. Writes the file (replacing a same-named file). If writing to a remembered folder fails, clears the setting and asks once more. Picker dismissed: `'cancelled'`. Other errors throw.

Summary screen: an "Export history" button. While working it is disabled; then it shows "Saved workout-history-2026-11-23.json", nothing on cancel, or "Export failed. Try again." on error.
`app.json`: `"android": { ..., "allowBackup": true }`, so Android Auto Backup includes the sqlite database (it lives in the app's files directory, which Auto Backup covers by default). Auto Backup only applies to an installed build, not Expo Go.

- [ ] **Step 1: Install and mock**

Run: `npx expo install expo-file-system` - Expected: added at an SDK 58 version.
Mock `expo-file-system` in `jest.setup.js` with a directory picker and file writer as `jest.fn()`s (shape matching the API `saveFile.ts` uses).

- [ ] **Step 2: Write the failing tests**

```ts
// export.test.ts
test('the export carries sessions, check-ins with place and feedback', ...);   // JSON.parse(await historyExport(db, new Date(2026, 10, 23, 21, 5))) toMatchObject { format: 'workout-history', schema: 2, exportedAt: '2026-11-23T21:05', checkIns: [{ date, value: 'good', place: 'gym' }] }; sessions equal loadHistory(db).sessions
test('an empty database exports empty lists', ...);
test('the file name uses the training day', () => expect(exportFileName('2026-11-23')).toBe('workout-history-2026-11-23.json'));
```

```ts
// saveFile.test.ts
test('the first export asks for a folder and remembers it', ...);   // picker called once; getSetting(db, 'backup_dir') = picked uri; second save does not call the picker
test('a dismissed picker cancels quietly', ...);                    // -> 'cancelled', nothing stored
test('a revoked folder is asked for again once', ...);              // write throws for the stored uri -> picker called, write retried, 'saved'
```

```tsx
// summary.test.tsx - add
test('export history saves the file and says so', ...);             // mocks succeed -> 'Saved workout-history-2026-11-22.json'
test('a failed export says so', ...);                               // write rejects twice -> 'Export failed. Try again.'
```

```ts
// config.test.ts
test('Android Auto Backup is on', () => expect(require('../../../app.json').expo.android.allowBackup).toBe(true));
```

- [ ] **Step 3: Run to verify they fail**

Run: `npx jest src/backup src/__tests__/app/summary src/__tests__/app/config` - Expected: FAIL.

- [ ] **Step 4: Implement**

- [ ] **Step 5: Run tests and typecheck**

Run: `npx jest && npm run -s typecheck` - Expected: all pass, clean.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(backup): one-tap JSON export of the history to a remembered folder; Android Auto Backup on"
```

---

## After the final review: on-device check (owner)

Jest cannot prove the notification actions or the feel of logging. After the branch review, on the phone (Expo Go, or a dev build for Auto Backup):

- Preview, Start, and the first set is one tap away. A blank lift asks for its weight once, and the other sets fill in.
- Lock the phone during a main-lift rest. The notification shows "Rest until ..." with Complete set, +15 s and Skip, and "Rest over" fires on time.
- **Uncertain, test first:** "Complete set" and "+15 s" from the lock screen while the app is in the background. If Android does not deliver the action to the app without opening it, switch those actions to `opensAppToForeground: true` (one line in `src/notify/rest.ts`).
- Swipe the app away mid-workout, reopen it: same step, same ticks.
- Finish shows the summary, and Export history writes the file to Downloads (first time: pick the Downloads folder).

Plan 3's deferred minor issues (release above the arc band, Rest's "Back to the menu", Gym / Home radio role, deep-linked preview options, short-screen header overlap, migration rollback) stay out of this plan.
