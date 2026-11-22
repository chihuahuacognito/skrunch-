**Date**: 2026-11-22
**Content Type**: Design Document

# Workout App - Design

## Intent

A personal Android workout app for one person, the owner.
It should be extremely minimal and very fast to navigate, with the smooth radial thumb-arc UX from the owner's other app, langocard.
It replaces "deciding what to do tonight" and "logging it" with a few taps, and keeps training balanced.

Why: the owner trains most evenings, enjoys upper-body work and drifts toward shoulders and arms.
He wants an app that keeps the whole body trained fairly, supports fat loss, builds in the stretching that has helped his desk-sitting back, and gets out of the way.

## The user

- 32-year-old male in Bangalore, India, on an Android phone. No injuries.
- Fairly muscular. Shoulders and arms are well developed. Chest and back lag behind. Lower body is underdeveloped, with fat mostly on the stomach, thighs and glutes.
- Primary goal: lose fat and look very fit. Strength and stamina should improve over time but are secondary.
- Trains about 1 hour most evenings, with 1-2 rest days some weeks.
- Main workouts are at a commercial gym with full equipment. At home he does mobility and stretching only.
- Sits a lot (desk job plus PC at home). Regular back stretching has helped him a lot.
- Tracks sleep with a Fitbit (now the Google Health app).

## Goals

- From opening the app to the first set in about 3 taps.
- Every evening, offer a few sensible session focuses that fit recovery and recent training. He picks one and the session is built instantly.
- Balanced whole-body training. Lagging areas (chest, back, lower body, core) get their fair share, and shoulders and arms keep getting real work.
- Logging a set is one tap, pre-filled from last time.
- Stretching is a fixed part of every session, plus a standalone desk-reset routine.
- Works fully offline and opens instantly.

## Non-goals

- No ongoing Instagram integration: no share sheet, no inbox, no sync. The Instagram import is a one-time job done outside the app (see "One-time Instagram import").
- No backend, accounts, cloud sync or social features.
- No AI calls from the app at runtime.
- No nutrition tracking or calorie logging in v1.
- No automatic Fitbit / Health Connect sync in v1. Possible later.
- No home strength workouts. Home sessions are mobility and stretching only.
- Not for anyone else. There is no onboarding for strangers and no generic settings sprawl.

## Anti-goals (failure even if it technically works)

- The radial UX drifting toward lower-body hyperfocus. The owner explicitly does not want that.
- Too many taps to log a set, or forms to fill in mid-workout.
- Streaks, guilt notifications or nagging.
- Sessions that feel repetitive or generic.
- Sessions that run well past an hour.
- Setup or maintenance chores. The library is built once.

## Approaches considered

1. **On-phone app with a rule-based session builder, plus a one-time library import done in Claude Code (chosen).**
   Fully offline, instant, predictable.
   The Instagram saves are turned into a reviewed JSON library once, then bundled.
2. **The app calls the Claude API to tag shared posts or build sessions.**
   Rejected. A shared post gives the app only a link (fetching the content needs the owner's logged-in Instagram session), the API key would live in the app, and runtime AI adds latency and needs internet.
   The owner also does not want ongoing sharing.
3. **Claude generates every session.**
   Rejected. Slow to open, needs internet, costs per session, unpredictable.
4. **Use existing apps (Google Health Coach plus a reel-import app such as Stako or PocketGym).**
   Considered after research. Nothing combines the one-tap check-in, radial focus menu, balanced 1-hour sessions, desk reset and the owner's curated reels with fast logging.
   Building is justified as long as v1 stays small.

Research backing this: `docs/research/2026-11-22-architecture-research.md`, `docs/research/2026-11-22-workout-programming-research.md`, `docs/research/2026-11-22-existing-apps-benchmark.md`.

## How it works

### Main flow (evening session)

```
open app
  -> [check-in]   Good / OK / Wrecked                 (1 tap)
  -> [radial]     3-4 focus options, best first       (1 tap)
  -> [preview]    tonight's session, ~55-60 min       (tap Start)
  -> [workout]    current exercise, pre-filled sets, tick to log
  -> [cool-down]  5-7 min stretch, then a one-line summary
```

The check-in is asked once per day. If he reopens the app the same evening, it skips straight to the radial menu.

A small **Gym / Home** toggle sits on the check-in screen and defaults to Gym.
Home mode offers only mobility, stretching and the desk reset.

### Desk reset

A standalone 5-10 minute stretch routine for desk sitting, reachable in at most 2 taps from opening the app (for example a fixed slot on the radial menu or a long-press).
It covers the back, thoracic spine, hip flexors, hamstrings and glutes.
It is not counted as a training session and does not need a check-in.

### Check-in effects

| Check-in | Effect |
|---|---|
| Good | Full session. Main lifts at 1-3 reps in reserve (RIR). Progression allowed. |
| OK | About 75% of planned sets, 2-3 RIR, hold loads (no progression). Intervals become Zone 2. |
| Wrecked | The radial menu leads with Rest, Mobility, and a Zone 2 walk. A "minimum dose" option offers 6-8 sets at 3-4 RIR. |

Three Wrecked check-ins within 7 days bring the next deload week forward.

### Focus types

Six focus types:

- **Chest/Back**
- **Lower** (quads, hamstrings, glutes, calves)
- **Shoulders/Arms**
- **Full Body**
- **Conditioning**
- **Mobility + Zone 2**

The radial menu shows 3-4 of them, ranked by:

1. Recovery. A muscle is not trained hard again within 48 hours, or 72 hours for legs after a Lower session.
2. Which muscles are furthest under their weekly set budget.
3. The check-in.

Rules: never two Lower days in a row, and at least one rest day per 7 days (the app suggests Rest when the owner has trained 6 days running).
Mobility + Zone 2 is always available as an option.

A typical 6-day week ends up close to: Chest/Back, Lower, Shoulders/Arms or Conditioning, Chest/Back, Full Body, Conditioning or Mobility, then rest.
This is an emergent result of the ranking, not a fixed schedule.

### Weekly set budget (hard sets per muscle per week)

A set counts 1.0 for the primary muscle and 0.5 for a secondary one (for example bench press counts half for triceps).

| Muscle | Sets / week |
|---|---|
| Chest | 12-16 |
| Lats | 8-10 |
| Mid back | 8-10 |
| Quads | 8-12 |
| Hamstrings | 6-10 |
| Glutes | 6-10 |
| Side delts | 8-12 |
| Rear delts | 6-10 |
| Front delts | 0-4 |
| Biceps | 6-10 |
| Triceps | 6-10 |
| Core | 6-10 |
| Calves | 0-8 |

Each muscle is trained at least twice a week, with no more than 8 direct sets in one session.
In share terms, chest and back take about 30-35% of sets, lower body about 25-30% (never the largest share) and shoulders and arms about 25-30%.

A training block starts at the low end of each range, adds 1 set a week per muscle, and ends with a deload week every 5-6 weeks (about half the sets, 3-4 RIR).

### Session template (about 60 minutes)

| Part | Time | Content |
|---|---|---|
| Warm-up | 6-8 min | General plus specific to tonight's main lifts |
| Main lifts | 20-22 min | 2 compound lifts, 5-12 reps, 2-3 min rest |
| Supersets | 15-18 min | 2-3 pairs of non-competing muscles, 10-20 reps, 60-90 s rest |
| Finisher | 6-10 min | Conditioning, chosen to fit tonight's focus and the check-in |
| Cool-down | 5-7 min | Stretch, always including back and hip flexors |

Conditioning and Mobility focuses use their own templates (intervals or Zone 2 blocks; flows and holds).
Intervals are capped at 2 per week, never on the day of or the day before a Lower session, and always after lifting.

### Effort logging (owner's decision)

Ticking a set means "done as planned" (target reps at roughly the target RIR).
If reps fall short, the owner edits the rep number.
The last set of each exercise shows an optional chip: **easy / right / hard**. One tap, only when he wants it.
No per-set effort rating.

### Progression

Double progression: when every set of an exercise hits the top of its rep range and the last-set chip is not "hard", the next session adds the smallest weight increment.
"Hard" holds the weight. "Easy" on two sessions in a row may progress even if the top of the range was not reached (builder's call on the exact rule).
Sets are pre-filled with last time's weight and reps, or the progressed weight.

### First run (no prior history)

The owner has no existing workout logs to import.
The first time each exercise appears, the weight field is blank and he enters what he lifts. From then on it is pre-filled.
The first week is a gentle calibration week: the low end of each set budget, main lifts at 3 RIR, and no progression until each exercise has one logged session.
Block week 1 starts on the first logged session.

### Workout screen

- One exercise at a time, with its sets pre-filled.
- Tick a set to log it. Long-press or tap the number to adjust weight or reps.
- Rest timer starts automatically after a tick, with a persistent Android notification offering "complete set", "+15 s" and "skip".
- Swap an exercise for another that hits the same muscle with available equipment.
- Per-exercise feedback "more / less / never", which weights future selection.
- An exercise that came from an Instagram post shows a small link that opens the original post.

### Out-of-app guidance (passive, no nagging)

The session summary can show a static note on daily steps (8,000-10,000), the weekly Zone 2 target (90-150 min) and protein (1.6-2.2 g/kg, with Indian and vegetarian food examples).
v1 does not track these.

## Exercise library

- **Base:** free-exercise-db (public domain, about 870 exercises, still images, muscle and equipment fields).
  Designer's call: Claude curates it down to about 150 standard gym movements plus mobility and stretching drills, and adds the fields the database lacks (movement pattern, default rep range, type, location).
  The owner may skim the curated list but is not required to review it.
- **Owner's additions:** 30-50 exercises from his Instagram Saved posts, produced by the one-time import below.
- Each exercise records name, primary and secondary muscles, movement pattern, type (strength / conditioning / mobility / stretch), equipment, default rep range, location (gym / home), and an optional source link.
- The library ships bundled with the app as data. It is edited by changing the data file and rebuilding, not inside the app.
- Designer's call: v1 does not wait for the Instagram import. It ships on the curated base library, and the library format accepts the imported exercises as a later merge.

## One-time Instagram import (not part of the app)

A one-off job done in a Claude Code session, not a maintained pipeline:

1. The owner places the official Instagram "Saved" export in the project. It contains post URLs, creator usernames and save times, but no captions.
2. yt-dlp, using the owner's browser cookies and throttled, fetches the caption and metadata for each post without the video.
3. Where the caption does not identify the exercises, the video is downloaded and a few still frames are extracted with ffmpeg. Claude reads the frames (on-screen text and the movement itself).
4. Claude merges duplicates, maps each exercise to a free-exercise-db entry where one matches, and tags new ones with the library fields, keeping the source link.
5. The result is a JSON file plus a readable review list. The owner reviews it once, removing junk and correcting tags.
6. The reviewed file is merged into the bundled library. Downloaded videos and frames are deleted afterwards. Creators' videos are never re-hosted.

Risk: using cookies with yt-dlp technically breaks Instagram's terms of service. One slow pass over the owner's own saves is accepted as low risk.
If yt-dlp fails, fall back to the owner pasting captions or skipping the posts.
Audio transcription is skipped unless frames and captions prove insufficient.

## Technical decisions

- **Stack:** Expo (current SDK, 58 at the time of writing), expo-router, TypeScript, Reanimated 4, react-native-gesture-handler, zustand, Jest, as in langocard.
  Starting on the current SDK rather than langocard's 54 is the designer's call for a fresh project. Porting langocard's radial menu and motion code to it must be verified early.
- **UX source:** langocard (`F:\newprojects\langocard`): radial / thumb-arc menu with fisheye magnification, motion tokens in `src/theme/tokens.ts`, motion helpers in `src/motion/`, research in `docs/research/2026-06-28-radial-ui-execution.md`.
- **Storage:** expo-sqlite for workout history (sessions, sets, feedback); the bundled exercise library is static data. Settings in AsyncStorage.
- **Backup (designer's call):** a one-tap "export history" that writes a JSON file to the phone's Downloads folder, plus Android Auto Backup enabled for the database. This protects against reinstalls, signing-key changes and phone loss, and the export can later feed a PC-side weekly review.
- **Session builder:** pure TypeScript functions (inputs: library, history, check-in, location, date; output: ranked focuses and a session), fully unit-tested, no UI dependencies.
- **Rest-timer notification:** Android notification with actions.
- **Distribution:** sideloaded / dev build on the owner's phone. No Play Store requirement.

## Later (explicitly not v1)

- Health Connect sync of Fitbit sleep and resting heart rate as a hint for the check-in. The readiness score itself does not reach Health Connect.
- Steps and Zone 2 tracking.
- An optional offline "weekly review" using Claude from the PC.

## Left to the builder

- The exact visual design within langocard's motion language.
- Data schema details, file layout and component structure.
- Exactly how the desk reset is reached (within the 2-tap limit).
- How swaps and "more / less / never" feedback weight exercise selection, within the rules above.
- Tuning thresholds that the research marked as reasoned defaults (check-in percentages, rotation details). These are expected to change with use.
