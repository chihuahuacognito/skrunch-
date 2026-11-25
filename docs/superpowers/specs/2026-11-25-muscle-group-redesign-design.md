# Muscle-group redesign

**Date**: 2026-11-25
**Content Type**: Design specification

Replaces the app shell and evening flow of Plans 3-4 (thumb arc, check-in, focus menu, preview, set-by-set workout, summary).
The library (Plan 1) and most of the builder (Plan 2) stay.
The parent design is `2026-11-22-workout-app-design.md`; where the two disagree, this document wins.

## 1. Intent

The owner tried Plans 3-4 in Expo Go on 2026-11-25 and rejected the experience:

- The right-edge thumb arc put everything on one side and read as a 1:1 copy of langocard.
- The step order (check-in, focus menu, preview, workout) was too long, and the recovery check-in had no purpose: "it's not like I'll go to the gym if I'm feeling low on energy". If he opens the app, he is training.
- Colours were unreadable and text floated with no panels.
- He expected pictures of the exercises; there were none (Plan 1 deferred image bundling to Plan 3, which never decided it).

What he wants instead, in his words: open the app at the gym, see the muscle groups and when each was last worked, with a body figure highlighting what was worked in the past week; tap a group; see its exercises with pictures, sets and reps, and when each was last done; mark an exercise completed.

The app stops generating sessions. **He chooses what to train; the app shows the state of his week and the next target for each exercise.**

## 2. Goals, non-goals, anti-goals

Goals:
- Two taps from opening the app to the first exercise: open, tap a group.
- At a glance: which groups were trained in the last 7 days, how recently, and which are behind their weekly target.
- Each exercise shows one exact target (sets x reps @ weight) that progresses on its own.
- Logging costs one tap per exercise in the normal case.
- Standard Material 3 look, dark theme only, every element in a container, readable at arm's length.

Non-goals (v1):
- A light theme.
- Generated sessions, focus menus, a daily check-in, recovery-based dosing.
- Real animated GIFs or video (see section 7).
- Fitbit / Health Connect sync (still a later version).
- A full history browser or charts.

Anti-goals (failure even if it works):
- The free choice drifts back to shoulders and arms because nothing shows what is lagging. The weekly-target signal must be visible on Home.
- Anything that adds a screen or a tap before the first exercise.
- Floating text, low-contrast colour, or controls only reachable from one edge.
- Any trace of the arc or the langocard look.

## 3. Constraints

- Android phone, Expo SDK 58, React Native, Expo Router, expo-sqlite, Reanimated, gesture-handler (all already in the project).
- Single user, fully offline. No accounts, no network at runtime.
- Keep `src/library` and `src/builder` free of React Native imports (scripts typecheck them with node types).
- Testing: screen tests live in `src/__tests__/app` (Expo Router bundles everything in `src/app` as routes). `npm run` segfaults in Git Bash; use `npx tsc` / `npx jest`.
- "Today" is the local training day with the 04:00 cutoff (`useToday`), never `toISOString()`.

## 4. Approaches

Considered:

- **A. Rework on top of the Plan 4 branch (chosen by the owner).** Keep the store, rest notification, backup, haptics and the builder pieces that still apply. Delete the arc, check-in, focus menu, preview, workout screen, summary and the session-generation code. Build the new screens. Carries over about 380 tests' worth of proven logic; costs a careful clean-up pass.
- **B. Fresh app shell on `main` (Plans 1-2 only).** Cleanest history, but redoes working notification, storage, backup and resume code.
- **C. Merge Plans 3-4 to `main`, then redesign.** Dropped: it lands a rejected design on `main` for nothing.

Branching: new branch `feat/muscle-groups` from `feat/plan-4-workout`. Nothing merges to `main` until the new flow passes the owner's on-device check; then Plans 3-4 and this branch land together.

## 5. Design references

- Home: `docs/design/home-front-back-numbers-grid.pdf` (from Claude Design, option "A - Front + back, numbers grid"). Use the **dark** artboard only.
- Muscle-group screen: `docs/design/muscle-screen-quads/Muscle.dc.html` (interactive export; the README explains it is a reference mockup). Use the `.th-d` values. Replicate colours, sizes, spacing and radii faithfully in React Native styles; do not copy the markup.
- The mockup's stick-figure SVG animations are **not** used. Exercise cards show library photos (section 7).

Dark tokens from the mockup (replace `src/theme/tokens.ts` colours):

| Token | Value | Use |
|---|---|---|
| bg | #111318 | screen |
| sc | #1D2024 | cards |
| sch | #272A2F | raised (image well, bottom bar) |
| schh | #32353A | pressed |
| on | #E2E2E9 | primary text |
| onv | #C4C6D0 | secondary text |
| ol / olv | #8E9099 / #44474E | outlines |
| pri / onpri | #A8C7FF / #0B305F | primary button |
| pric / onpric | #254777 / #D5E3FF | rest panel, selected chip, Tonight strip |
| just | #FF8F4A | just trained |
| recov | #FFCF5C | recovering |
| rest | #6CB0FF | rested |
| empty | #3A3E45 | untrained fill, empty bars |
| errc / onerrc | #93000A / #FFDAD6 | BEHIND badge |
| okc / onokc | #1F3D2E / #B8F0CF | completed row, "enough" reached |

Type: Roboto (Android system). Card radius 20, inner radius 14-16, buttons 24-28 (pill), min touch target 44.

## 6. Screens and flow

```
Home ──tap group (figure or grid)──> Muscle group ──tap photo──> Exercise detail (sheet)
  │                                     │
  ├─tap Cardio──> Cardio                └─ Tonight chips: Home / other groups opened tonight
  ├─tap Stretch──> Stretch (desk reset + cool-down)
  └─tap "Last 7 days" card──> History (past days + Export)
```

The app opens on Home, except: if a rest timer is running or the last action today was under 45 minutes ago, it reopens on the last muscle group (tunable).

### 6.1 Home

Top to bottom, in one scroll view, per the PDF:

1. **Week card.** "Last 7 days" and the date range (for example "Thu 19 - Wed 25 Nov"). Legend dots: Just trained, Recovering, Rested. Line "Fill height = sets vs target". If the block is in a deload week, a line "Lighter week: 2 sets per exercise". Tapping the card opens History.
   - The PDF says "This week, Mon-Sun". Builder call: the window is **rolling 7 days** (today and the 6 days before), because the builder's volume, targets and progression already use a rolling window and a calendar week would make every group look behind on Monday.
2. **Figure card.** A stylized, segmented front and back figure (as in the PDF), labelled Front and Back. Each of the 9 groups is one or more tappable regions:
   - Front: chest, shoulders (front and side caps), arms (biceps and forearms), core, quads, calves.
   - Back: back (upper and mid, lats), shoulders (rear caps), arms (triceps), glutes, hamstrings, calves.
   - Region colour = recency (6.4). Never-trained regions are drawn as a dashed outline on `empty`.
   - Fill height = sets vs target: the region fills from the bottom up in its recency colour, the rest stays `empty`. Full at or above target.
   - Tapping any region of a group opens that group. Regions too small to hit (calves, forearms) get an invisible hit area of at least 44 x 44; the grid below is the precise alternative.
   - The group last opened tonight is outlined (`on`, 2 px) on both figures and in the grid.
   - Drawn with `react-native-svg` as a hand-built asset; no body-map package (none map 1:1 to the 9 groups and the PDF style is custom).
3. **Group grid card.** 3 x 3 cards: Chest, Back, Shoulders / Arms, Core, Glutes / Quads, Hamstrings, Calves. Each card: name; recency dot and "2d ago" / "Today" / "Never"; big "8/12" sets vs target; thin progress bar; a **BEHIND** badge (6.5). Tap opens the group.
4. **Cardio and Stretch cards**, side by side. Cardio: heart icon, "Zone 2 · 40/150 min" with a thin bar. Stretch: figure icon, "Desk & back routine".
5. **Tonight strip** (`pric` background) pinned at the bottom: "Tonight  1 group  6 sets  34 min". Groups = groups with at least one logged set tonight; sets = logged sets tonight across all exercises (each filled dot is one); minutes = from the first logged set tonight to now. Hidden before the first set of the day.

### 6.2 Muscle group (e.g. Quads)

Per the mockup:

1. **Header card.** Group name (30 px); recency dot + "Rested · last worked 5 days ago"; "**3/10** sets this week" + BEHIND badge if behind; progress bar.
2. **Warm-up card**, collapsed, only before the first set of the evening (any group): "Warm-up · 3 moves · ~5 min". Expands to 2-3 mobility items for the group's region (from the builder's region cover). Nothing is logged. Builder call, not in the mockup; the agent review flagged warm-ups as a gap.
3. **Exercise cards**, ordered (section 8): one labelled MAIN LIFT when the group has a compound, then ACCESSORY cards, 3 cards in total. Each card:
   - Role label (11 px, letter-spaced).
   - Photo well 96 x 96 (radius 14) with the two library photos alternating (section 7) and an enlarge icon bottom-right. Tap opens Exercise detail.
   - Name (18 px), target (24 px bold, tabular), for example "3 × 6 @ 60 kg"; bodyweight shows "3 × 12"; first time with no weight shows "3 × 8 · set weight".
   - Last line (13 px): "Last: 9 days ago · 60 kg × 8" or "Never done".
   - Set dots: "Sets" + one numbered 28 px dot per planned set (44 px hit area) + "tap = start rest" + Edit. **A dot is a done set.** Tapping the next dot logs one set at the target reps and weight (written to SQLite at once) and starts the rest timer for that exercise. Tapping the last dot also completes the exercise (green row) and still starts a rest. Tapping a filled dot does nothing (Undo or Edit corrects). If the target has no weight yet, the first dot opens Edit first.
   - Completed (pill, 56 px, `pri`): logs the remaining sets at target and turns the controls into the green row "✓ Completed · 3 × 6 @ 60 kg" with Undo. No rest starts. If the target has no weight yet, Completed opens Edit first.
   - Edit opens a bottom sheet: weight (stepper by the equipment increment, typed value allowed), reps per set (stepper), sets done (stepper). Save replaces tonight's sets for that exercise with those values (uniform sets). If sets done equals the planned sets it shows the green row; otherwise the dots show the new count.
   - Undo removes all of tonight's sets for that exercise and empties its dots.
4. **"About 8 sets is enough for tonight"** card (dashed outline): "Quads tonight: N sets. Anything past here is a bonus." Turns `okc` at 8 direct sets for this group tonight. Never blocks anything.
5. **More exercises** (collapsed): the rest of the group's candidates as compact rows (photo thumbnail, name, target, last done). Tapping a row promotes it to a full card for tonight (it replaces nothing; the list just grows).
6. **Bottom bar** (`sch`, radius 24 top, shadow), fixed:
   - Rest panel when resting: "REST", "Dumbbell Lunges · set 1 of 3 done", big countdown, progress bar, +15 s and Skip. The screen stays awake while a rest runs.
   - Tonight row: "Tonight", a Home chip, one chip per group opened tonight (current one selected with a check), and "N sets · M min" right-aligned.
   - Back also works through the system back gesture.

### 6.3 Exercise detail (bottom sheet)

Large photo pair (alternating, or side by side if Reduce Motion is on), the instructions, the last 5 logs ("60 kg × 8, 8, 8 · 9 days ago"), feedback chips More / Less / Never (Plan 4's feedback, reused), and the Instagram post link when the exercise has a `sourceUrl`.

### 6.4 Cardio

Header card: "Zone 2 · 40/150 min (last 7 days)" with a bar, and "Intervals · 1/2 this week".
Cards for the library's conditioning items in two sections, Zone 2 and Intervals, same card layout as 6.2:
- **Zone 2** items: target **25 min** (tunable), editable in Edit. A Start timer button is optional; the in-app timer shows elapsed time while the app is open and needs no notification (no locked-phone alarm). **Completed logs the target minutes** (or the edited minutes); the timer never logs on its own. Weekly target 150 min (parent spec range 90-150, top end because fat loss is the primary goal).
- **Interval** items: timed items (ropes, air bike, mountain climbers) use the library dose as one timed block with the same optional timer and Completed. Rep items (burpees, swings, star jumps) use **4 rounds** at the library rep dose with 60 s rest, logged with set dots exactly like strength cards.
- Any interval item logged on a day sets that day's `sessions.intervals` flag, and that day counts as one of the 2 per rolling week. At 2 the section shows a quiet "2 of 2 done this week" note, never a block.
- Conditioning sets never count toward muscle-group targets.

### 6.5 Stretch

Two cards: **Desk reset** (opens the existing one-item-at-a-time player from `desk.tsx`, restyled to the new tokens, hold timers kept) and **Cool-down** (a short list of stretches for the groups trained tonight, from the builder's cool-down cover). Nothing here counts toward weekly targets. This replaces the Gym/Home switch: home sessions are stretching only (owner decision 2026-11-22), so at home he opens Stretch.

### 6.6 History

Past training days, newest first: date, groups trained, sets, minutes. Tapping a day lists its exercises and sets. An **Export history** button at the bottom (Plan 4's one-tap JSON export to the remembered folder, unchanged). Read-only; no editing of past days in v1.

## 7. Exercise pictures

- Source: free-exercise-db (public domain). 173 of the 191 library exercises have two photos, start and end position, already referenced by `images` in `library.json`.
- Bundle them in the app (offline). A one-off script downloads the referenced files into `assets/exercises/<id>/0.jpg, 1.jpg`, resized to 384 px on the long side, and generates a static require map (`src/ui/images.ts`) so Metro bundles them. Builder checks the total size; expected well under 20 MB.
- Display: the two frames alternate every 1.2 s (cross-fade under 150 ms), paused when the app is in the background or Reduce Motion is on (then frame 0 only, both side by side in detail).
- The 18 hand-added exercises without photos show a neutral placeholder: the group's icon on `sch`. Instagram frames can fill these later.
- Real animated GIFs would need a paid source; out of scope (owner informed 2026-11-25).

## 8. Exercises, targets and progression

### 8.1 Groups

| Group | Budget muscles | Weekly target [low, high] |
|---|---|---|
| Chest | chest | 12-16 |
| Back | lats, midBack | 12-16 |
| Shoulders | sideDelts, rearDelts, frontDelts | 10-14 |
| Arms | biceps, triceps | 10-14 |
| Core | core | 6-10 |
| Glutes | glutes | 6-10 |
| Quads | quads | 8-12 |
| Hamstrings | hamstrings | 6-10 |
| Calves | calves | fixed 6 (3 in a deload) |

- Calves use a fixed display target instead of the ramp, because the per-muscle ramp starts at 0 and the grid would show "0/0". Low priority: never BEHIND.
- Group targets are a builder call derived from the per-muscle budget, so that one row set counts once for Back instead of twice; tunable at the top of the new module. Week ramp and deload halving reuse `weeklyTargets` logic (low end in week 1, +1 set a week to the high end, about half the low end in a deload week).
- **Group credit per set:** 1 if any primary muscle of the exercise is in the group, else 0.5 if any secondary is (front delts still count only as direct work). Strength only; stability does not count toward Core (parent rule).
- A group counts as **worked** on a day with at least 1.5 credit (`TRAINED_CREDIT`). "Last worked" is the most recent such day.

### 8.2 Recency colour

0-1 days since worked: Just trained. 2-4 days: Recovering. 5+ days: Rested. Never: grey dashed. Thresholds tunable. Display only; nothing is blocked.

### 8.3 BEHIND

A group is BEHIND when its target is at least 6 and its sets in the last 7 days are under half its target. Calves never show BEHIND. Tunable.

### 8.4 Which exercises a group shows

Candidates: strength exercises whose primary muscles include one of the group's muscles, excluding feedback "Never".
Order for the 3 cards:
1. MAIN LIFT: a compound for the group (`isMainLift`), if one exists. Prefer the one logged most recently in the last 21 days (continuity keeps progression meaningful), else the builder's ranking.
2. Two ACCESSORY cards: same continuity rule, then `rankCandidates`, feedback "More" ranked up, "Less" down. Arms shows one biceps and one triceps accessory after its first card; Core shows core strength items.
3. Everything else goes under More exercises, in the same order.

The day-hash rotation in `rankCandidates` stays for exercises with no recent history, so new picks vary.
The card list for a group is computed when the group is first opened tonight and then **frozen** for the evening (stored in the tonight UI state), so cards never reshuffle as sets change the deficits. Arms and Calves have no qualifying main lift, so they show three ACCESSORY cards; Calves has only 4 candidates in total.

### 8.5 Target per exercise (double progression)

- Sets: 3 per exercise (2 in a deload week). Rest: 120 s for the main lift, 90 s for accessories (builder `restSeconds` rules).
- Rep range: the main lift uses the main-lift range from `prescribeReps` (5-12 band, clamped to the exercise dose). Accessories use **10-15** (clamped to the exercise dose), not the old superset 10-20, so weight goes up after about 5 good sessions instead of 10. Tunable.
- First time: reps = bottom of the range, weight blank ("set weight"); Completed asks for the weight.
- A log counts as **hit** only when the number of sets reached `planned_sets` and every set reached the target reps. Fewer sets than planned (stopped early, Edit with fewer sets) is a miss.
- After a hit: next target reps +1, up to the top of the range. When every set reached the top of the range: next weight + the equipment increment (`INCREMENT_KG`), reps back to the bottom of the range.
- After a miss: same target again.
- Bodyweight (0 kg): reps climb to the top of the range and stay there.
- Deload week: same weight and reps as the last log, 2 sets, no progression.
- `nextLoad` is extended (or replaced) to return reps and weight together; the easy/right/hard chip is not shown in v1, so the "easy twice" path goes quiet but stays in code until the builder clean-up decides.

## 9. Data and state

- **A session is a training day.** The first logged set of a day creates that day's `sessions` row and the exercise's `logged_exercises` row; every dot, Completed and Edit-save writes its sets immediately (an exclusive transaction). Undo deletes the exercise's row for tonight. No Start, no Finish, no summary. Because every done set is already in SQLite, Home, the Tonight strip, the "enough" card and the warm-up rule all read from SQLite alone; no draft merging and no settlement at the day boundary.
- `logged_exercises` gains a `planned_sets` column (schema v3 migration) so progression can tell a short session from a full one.
- `sessions.focus` is no longer meaningful: write `'free'` for new rows (type change in `FocusId` / `SessionLog`). Old rows stay readable.
- **Tonight UI state** (the running rest, groups opened, tonight's frozen card list per group, promoted More rows, last group and last action time) lives in the existing `active_workout` table as JSON keyed by date, so a killed app reopens where it was. It holds no logged sets. At the next training day it is simply discarded.
- `check_ins` table: kept, no longer written or read.
- Feedback table: unchanged.
- The owner has no real training history yet (only Expo Go test taps), so no data migration is needed beyond the schema.

## 10. Rest timer and notification

Plan 4's notification is reused: the silent sticky "Rest until 19:42" notice and the "Rest over" alert, both with actions. The actions now mean: **Complete set** acts exactly like tapping the next dot of the exercise that is resting (logs the set, starts the next rest, and on the last dot completes the exercise; does nothing if the exercise is already complete), **+15 s**, **Skip**. The opening-tap-once handling stays. Rests under 45 s still use the in-app timer only. Open owner question carried over: `USE_EXACT_ALARM` for punctual "Rest over" on a locked phone.

## 11. What happens to existing code

Delete: `src/features/arc`, `src/app/index.tsx` (check-in), `menu.tsx`, `preview.tsx`, `workout.tsx`, `summary.tsx`, `src/features/workout/*` components that the new cards do not reuse, `useOnceUntilFocus` if unused, the check-in store functions, builder `rank.ts`, `focus.ts`, session templates in `session.ts`, `main.ts`, `swap.ts`, `tally.ts`, the check-in effects, and their tests. The arc tokens and langocard motion tokens go.

Keep and adapt: `src/library`; builder `prescribe`, `volume`, `needs`/`budget` (group layer added), `block`, `select`, `desk`, `parts` (warm-up and cool-down covers), `estimate` if still used, `dates`; `src/store` (sessions, logs, feedback, settings, active_workout); `src/notify/rest`; `src/backup`; `src/haptics`; `useToday`, `useCountdown`, `useRemaining`, `useLoad`; `desk.tsx` restyled.

`src/workout` (pure workout state) is reshaped into a smaller "tonight" reducer: dots, rest, complete, edit, undo, promote. Its idempotent-tick and serialized-draft-write lessons carry over.

## 12. Testing and verification

- Unit tests for the pure parts: group credit and targets, recency, BEHIND, candidate ordering, double progression (all cases in 8.5), the tonight reducer, dot / Completed / Edit / Undo writes, planned-sets misses.
- Store tests through node:sqlite as today.
- Screen tests in `src/__tests__/app` for Home (figure and grid open the right group, BEHIND and counts render), the group screen (dot starts rest, Completed and Undo, Edit sheet, first-time weight prompt), Cardio, Stretch, History export.
- On-device check by the owner in Expo Go before merge: readability in the gym, figure taps (calves), photos load offline, rest notification and actions, reopen after kill lands in the group.

## 13. Left to the builder

- Exact SVG paths of the figure, matching the PDF's segmented style.
- Image resize and size budget; placeholder icon set.
- Whether `nextLoad` is extended or replaced.
- Whether a schema migration is needed.
- Layout details the mockups do not show (Cardio, Stretch, History), following the same tokens and card patterns.
- All tunable constants (group targets, recency thresholds, BEHIND rule, 45-minute reopen window, enough-for-tonight at 8 sets), kept at the top of their modules.

## 14. Builder calls in this document (for the owner to check)

1. Rolling 7 days instead of the PDF's Mon-Sun week.
2. Group targets in 8.1.
3. BEHIND = under half the target; calves never.
4. Recency thresholds 0-1 / 2-4 / 5+ days.
5. Warm-up card before the first set of the evening.
6. 3 cards per group (1 main + 2 accessories), continuity-first ordering.
7. Exact-target double progression (+1 rep per hit, weight up at the top of the range); fewer sets than planned is a miss; accessories use 10-15 reps; no easy/right/hard chip in v1.
8. Each set dot logs a done set immediately; the last dot completes the exercise; Completed fills the rest without a rest timer.
9. Reopen into the last group within 45 minutes.
10. History screen reached from the week card, holding Export.
11. Stretch replaces the Gym/Home switch.
12. Placeholder icon for the 18 exercises without photos.
13. Calves: fixed target of 6, never BEHIND.
14. Cardio: Zone 2 cards at 25 min toward 150 min a week; rep-based intervals as 4 rounds; Completed logs minutes, the timer never does.
15. Tonight's three cards per group are frozen once opened, so they never reshuffle mid-session.
