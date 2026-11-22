**Date**: 2026-11-22
**Content Type**: Research

# Evidence-based programming rules for the session builder

> **Not medical advice.**
> This is a research summary to drive a personal training app, not medical, nutritional or physiotherapy advice.
> Anyone with pain, a medical condition or doubts about intensity should check with a qualified professional.

## 0. Who this is for and how to read it

The user is a 32-year-old male in Bangalore, no injuries, intermediate trainee.
Shoulders and arms are well developed; chest and back lag; lower body is underdeveloped; fat sits mostly on the stomach, thighs and glutes.
Primary goal is fat loss and "looking very fit" (recomposition), with strength and stamina as secondary goals.
He wants balanced whole-body training, explicitly not a lower-body hyperfocus.
He trains about 1 hour on most evenings (5-7 per week) and sits a lot.

Each section gives the evidence briefly, then concrete rules.
Rules are tagged `R-x.y` so the session builder can reference them.
Where evidence is thin, the rule is marked as a reasoned default rather than a research finding.

A note on spot reduction: training the thighs or abs does not preferentially burn fat from those areas.
Fat loss in the stomach, thighs and glutes will come from the overall energy deficit, so the program does not need extra lower-body volume to "target" that fat.
This supports his wish to avoid a lower-body hyperfocus.
Building the lower body to a normal, proportionate level is still worthwhile for looks, metabolic health and calorie burn per session.

---

## 1. Weekly structure and set volume

### Evidence

- Weekly set volume has a clear dose-response with hypertrophy, with diminishing returns at higher volumes (Schoenfeld et al. 2017; Pelland et al. 2024 meta-regression).
- Pelland et al. found the best-fitting models counted indirect sets as half a set ("fractional" counting), e.g. a bench press set counts 1.0 for chest and 0.5 for triceps.
- Once weekly volume is equated, training frequency adds little extra hypertrophy, but training each muscle at least twice a week is a practical way to spread volume so each session's quality stays high (Schoenfeld, Ogborn and Krieger 2016; Pelland et al. 2024).
- The 2026 ACSM position stand (an overview of 137 systematic reviews) lands on roughly 10 weekly sets per muscle as a solid hypertrophy dose for the average adult, and notes that simply doing resistance training matters far more than fine details.
- Renaissance Periodization's volume landmarks (MEV, MAV, MRV) give typical intermediate ranges of roughly 8-20 sets per muscle per week, varying by muscle.
- In an energy deficit, lean mass gains are blunted but strength gains are not (Murphy and Koehler 2022), so the realistic target is "keep all muscle, add some to lagging areas", not maximal growth everywhere.
- Practical implication: in a deficit, aim at the low-to-middle of productive ranges for maintained areas and the middle for priority areas, rather than chasing very high volume that recovery in a deficit cannot support.

### Focus types

Six focus types cover everything.
The radial menu offers 3-4 of them each evening (see R-1.5).

| Focus ID | Name | Main content | Secondary content |
|---|---|---|---|
| `CB` | Chest and Back | Horizontal and vertical presses and pulls | Rear delts, a little biceps/triceps |
| `LB` | Lower Body | Squat pattern, hinge, single-leg, hamstring curl | Core, calves |
| `SA` | Shoulders, Arms and Upper Back | Side/rear delts, biceps, triceps | One back or chest movement |
| `FB` | Full Body | One lower compound, one push, one pull, circuit-style accessories | Core |
| `CO` | Conditioning | Zone 2 block or intervals | Core, carries |
| `MO` | Mobility and Zone 2 recovery | Long mobility flow plus easy Zone 2 | Light core |

`CB` is the priority day for the lagging areas.
`SA` keeps shoulders and arms getting real work, while slipping in extra back volume.
`LB` brings the lower body up to a fair share without dominating the week.
`FB` is the "balanced" default and the best choice when the plan is ambiguous.

### Weekly rotation (reasoned default)

A good week is built from these templates.
The builder should aim to land near one of them over any rolling 7 days, not force a fixed order.

**6 sessions per week (most common)**

| Day | Focus |
|---|---|
| 1 | `CB` |
| 2 | `LB` |
| 3 | `SA` or `CO` |
| 4 | `CB` |
| 5 | `FB` |
| 6 | `CO` or `MO` |
| 7 | Rest |

**5 sessions per week**: `CB`, `LB`, `SA`, `FB`, `CO`.

**7 sessions per week**: the 6-day template plus one `MO`; never 7 hard lifting days.

Resulting weekly frequency in the 6-day template: chest and back 3x, lower body 2x (`LB` + `FB`), delts and arms 2-3x, core 3-4x.

### Per-muscle weekly set budget

Counting rule: a "hard set" is a working set taken to 0-4 reps in reserve (RIR).
Direct sets count 1.0 for the target muscle; indirect sets count 0.5 (Pelland et al. 2024 fractional method).
Warm-up sets do not count.

| Muscle group | Priority | Weekly hard sets (fractional) | Start of block | Max this phase | Min sessions/week |
|---|---|---|---|---|---|
| Chest | Lagging - priority | 12-16 | 12 | 16 | 2 |
| Back - lats (vertical pull) | Lagging - priority | 8-10 | 8 | 10 | 2 |
| Back - mid/upper (rows) | Lagging - priority | 8-10 | 8 | 10 | 2 |
| Quads | Underdeveloped - fair share | 8-12 | 8 | 12 | 2 |
| Hamstrings | Underdeveloped - fair share | 6-10 | 6 | 10 | 2 |
| Glutes | Underdeveloped - fair share | 6-10 (mostly from squats, hinges, lunges) | 6 | 10 | 2 |
| Side delts | Strong - maintain and grow slowly | 8-12 | 8 | 12 | 2 |
| Rear delts | Strong - maintain (also posture) | 6-10 | 6 | 10 | 2 |
| Front delts | Strong - maintain | 0-4 direct (pressing covers it) | 0 | 4 | - |
| Biceps | Strong - maintain | 6-10 | 6 | 10 | 2 |
| Triceps | Strong - maintain | 6-10 | 6 | 10 | 2 |
| Calves | Optional | 0-8 | 4 | 8 | 1 |
| Abs and core | Supports posture and the "fit" look | 6-10 | 6 | 10 | 2 |

Rough total: about 90-130 fractional sets, which is about 70-95 actual hard sets across 4-5 lifting sessions, about 16-20 hard sets per session.
That fits a 60-minute session with supersets (section 3).

Why this is "balanced but fair":
- Chest and back get the most weekly sets, because they lag and are large muscles that most change the look of the torso.
- Lower body gets a solid evidence-based maintenance-to-growth dose (each muscle near the ACSM ~10 set mark) but never the most sets in the week.
- Shoulders and arms keep 6-12 direct sets each, plus indirect work from pressing and pulling, which is more than enough to keep and slowly grow them.

### Rules

- `R-1.1` Track weekly fractional sets per muscle over a rolling 7 days.
- `R-1.2` Each muscle with a "Min sessions/week" of 2 must be trained hard in at least 2 sessions per rolling 7 days.
- `R-1.3` Within a session, cap any single muscle at 8 direct hard sets (the useful per-session ceiling for a deficit; more just adds fatigue). Reasoned default, consistent with RP and Stronger By Science guidance on per-session volume.
- `R-1.4` Start each training block at the "Start" column and add 1 set per priority muscle per week, up to "Max", then deload (section 5).
- `R-1.5` Radial menu selection: rank the focus types by (a) which muscle groups are furthest below their rolling weekly budget, (b) which are recovered (section 2), (c) check-in state (section 2), and (d) whether conditioning has been done this week; show the top 3-4.
- `R-1.6` Always include `FB` as one of the options when no single focus clearly wins.
- `R-1.7` Never offer `LB` on two consecutive days, and never offer the same lifting focus on two consecutive days.
- `R-1.8` Suggest at least 1 full rest day per 7 days, and 2 if the check-in was "wrecked" more than twice in the week.

---

## 2. Recovery rules and the check-in

### Evidence

- Muscle protein synthesis after a hard session stays elevated for roughly 24-48 hours in trained people, and performance generally recovers within 48-72 hours depending on volume and eccentric damage; this underpins the common 48-hour rule for training a muscle hard again (MacDougall et al. 1995; Schoenfeld et al. 2016 frequency review).
- Training close to failure gives more hypertrophy, but recovery cost rises sharply near failure, while strength gains are similar across a wide RIR range (Refalo et al. 2023; Robinson et al. 2024).
- Training to failure, exercise choice and complex periodization do not consistently change outcomes for the average adult (ACSM 2026), which means intensity can be dialed down on bad days with little long-term cost.
- Autoregulation by readiness is supported by coaching consensus (Bell et al. 2023 deload Delphi) and by evidence-based coaches (Stronger By Science, RP), though direct trials of "readiness-check" systems are limited.

### Minimum gap before training a muscle hard again

| Situation | Minimum hours before hard sets on that muscle again |
|---|---|
| Upper-body muscle, normal session (up to 8 hard sets) | 48 h |
| Lower body after `LB` (heavy squats, RDLs, lunges) | 72 h |
| Lower body after `FB` (one lower compound, 3-4 sets) | 48 h |
| Any muscle still clearly sore on the check-in day | Treat as not recovered, light work only |
| After HIIT running or sprints | 48 h before `LB` (running stresses legs) |
| After HIIT on bike or rower | 24 h before `LB` |

"Light work" means up to 3 sets at 3+ RIR, which can happen inside the gap (e.g. biceps getting indirect work from rows).

### Check-in adjustments

| Check-in | Menu offered | Volume | Effort (RIR) | Load progression | Finisher |
|---|---|---|---|---|---|
| Good | All recovered focus types, including `LB` and `CB` | 100% of planned sets | Compounds 1-3 RIR; isolation last set 0-1 RIR | Allowed (section 5) | As planned, HIIT allowed |
| OK | Recovered focus types, prefer `FB`, `SA`, `CO` (Zone 2) | About 75% (drop the last set of each exercise; keep at least 2 sets) | Compounds 2-3 RIR; isolation 1-2 RIR | Hold load; reps may increase | Zone 2 or short circuit, no HIIT |
| Wrecked | Only `MO`, a 20-30 min Zone 2 walk/cycle, "minimum dose" full body, or rest | Minimum dose: 6-8 hard sets total (one push, one pull, one leg, 2 sets each) | 3-4 RIR | Hold or reduce load by 10% | None |

### Rules

- `R-2.1` A muscle is "recovered" when the gap in the table above has passed since its last session with 4 or more hard sets on it.
- `R-2.2` Do not offer a focus whose primary muscles are not recovered, unless check-in is "Good" and the overlap is only light secondary work.
- `R-2.3` Apply the check-in table to every generated session.
- `R-2.4` "Wrecked" check-in: show the rest day option first in the menu, with a gentle message, and offer `MO` and minimum dose as alternatives.
- `R-2.5` 2 consecutive "wrecked" check-ins: suggest a rest day.
- `R-2.6` 3 or more "wrecked" check-ins in a rolling 7 days, or "OK/wrecked" for 5 of 7 days: flag an early deload week (section 5).
- `R-2.7` Future (v2) Fitbit integration: a resting heart rate more than about 5 bpm above the 7-day baseline, or HRV clearly below baseline, or sleep under 6 hours, should pre-select "OK" or "wrecked" as a suggestion the user can override. Reasoned default; consumer-wearable readiness thresholds are not well validated.

---

## 3. The 60-minute session template

### Evidence

- Hypertrophy is similar across a wide range of loads (roughly 6-30 reps) when sets are taken close to failure; moderate reps (6-15) are most time-efficient (Schoenfeld et al. 2017; Schoenfeld, Grgic, Van Every and Plotkin 2021).
- Heavier loads (about 80% 1RM, roughly 5-8 reps) favour strength (Schoenfeld et al. 2017; ACSM 2026).
- Supersets, drop sets and rest-pause roughly halve session time while keeping volume, and are well suited to hypertrophy (Iversen et al. 2021).
- Supersetting two multi-joint lifts may slightly reduce strength gains compared with straight sets, while body composition outcomes are similar (Iversen et al. 2024), so heavy compounds should use straight sets or non-competing pairings.
- Longer rests (2-3 min) on compounds preserve volume and growth better than very short rests (Schoenfeld et al. 2016 rest interval study); 60-90 s is fine for isolation and antagonist supersets.
- Warm-ups can be restricted to general movement plus exercise-specific ramp sets; long static stretching before lifting is unnecessary unless flexibility is a goal (Iversen et al. 2021).

### Time budget

| Block | Minutes | Content |
|---|---|---|
| 1. Warm-up | 6-8 | 3 min general (bike, rower, brisk incline walk, or jumping jacks at home) plus 2-3 min of 2-3 mobility drills relevant to the day, then ramp sets on the first lift |
| 2. Main lifts | 20-22 | 2 compound lifts, 3-4 sets each, straight sets or antagonist pairs |
| 3. Accessories | 15-18 | 2-3 supersets, 2-3 rounds each |
| 4. Finisher | 6-10 | Conditioning or core circuit (section 4) |
| 5. Cool-down | 5-7 | Focus-specific stretch routine (section 6) |

Total: 52-65 min; the builder should trim accessory rounds first if a session runs long.

### Block parameters

| Block | Reps | RIR (on a "Good" day) | Rest |
|---|---|---|---|
| Ramp sets | 2-3 sets of 3-8 reps at 40-80% of working load | Easy | 30-60 s |
| Main compound, strength bias | 5-8 | 1-3 | 2-3 min |
| Main compound, hypertrophy bias | 8-12 | 1-2 | 2 min |
| Accessories, superset | 10-15 | 1-2, last set 0-1 for isolation | 60-90 s after each pair |
| Isolation for small muscles (delts, arms, calves) | 12-20 | 0-2 | 45-60 s in supersets |

### Superset pairing rules

- Pair antagonists or non-competing muscles: chest + back, biceps + triceps, quads + hamstrings, side delts + core, lower-body isolation + upper-body isolation.
- Do not pair two heavy compounds that share stabilisers or grip heavily (e.g. deadlift + row).
- At a commercial gym, prefer pairings that use one station (e.g. cable stack, dumbbell rack) so equipment changes don't eat time.

### Example sessions (commercial gym)

**`CB` Chest and Back**
- A1 Incline dumbbell press 3x6-10 / A2 Chest-supported row 3x8-12 (rest 90 s between moves, about 2 min per round)
- B Lat pulldown or pull-up 3x8-12 (rest 2 min)
- C1 Cable or machine fly 2-3x12-15 / C2 Single-arm cable row 2-3x10-15
- D1 Face pull or reverse fly 2x15-20 / D2 Triceps pushdown 2x12-15
- Finisher, then cool-down (chest/lat/thoracic emphasis)

**`LB` Lower Body (fair share, not hyperfocus)**
- A Squat pattern (back squat, hack squat or goblet squat) 3x6-10 (rest 2-3 min)
- B Romanian deadlift 3x8-10 (rest 2 min)
- C1 Walking lunge or Bulgarian split squat 2-3x8-12 per leg / C2 Lying or seated hamstring curl 2-3x10-15
- D1 Calf raise 2x12-20 / D2 Cable crunch or hanging knee raise 2x10-15
- Optional E: one upper-body superset (e.g. lateral raise + curl, 2 rounds) so the day still feels balanced
- Finisher (low-impact; no running HIIT on leg day), then cool-down (hip flexor, hamstring, glute emphasis)

**`SA` Shoulders, Arms and Upper Back**
- A Seated dumbbell overhead press 3x6-10
- B Neutral-grip pull-up or pulldown 3x8-12
- C1 Lateral raise 3x12-20 / C2 Rear delt fly 3x15-20
- D1 Incline dumbbell curl 3x10-15 / D2 Overhead cable triceps extension 3x10-15
- Finisher, then cool-down

**`FB` Full Body**
- A1 Goblet squat or leg press 3x8-12 / A2 Pull-up or row 3x8-12
- B1 Push-up or dumbbell bench 3x8-15 / B2 Dumbbell RDL 3x10-12
- C Circuit, 2 rounds: lateral raise 12-15, curl 12-15, pushdown 12-15, plank 30-45 s
- Finisher, then cool-down

### Home or dumbbell-only substitutions

| Gym exercise | Dumbbell / home substitute |
|---|---|
| Barbell or hack squat, leg press | Goblet squat, heels-elevated goblet squat, Bulgarian split squat |
| Romanian deadlift (barbell) | Dumbbell RDL, single-leg dumbbell RDL |
| Hamstring curl machine | Sliding leg curl (towel on tile floor), Nordic curl regression |
| Lat pulldown, pull-up | Doorway pull-up bar, band-assisted pull-up, band pulldown |
| Cable or machine row | One-arm dumbbell row, chest-supported dumbbell row on an incline bench |
| Bench press, machine press | Dumbbell floor press, dumbbell bench, push-up (weighted or deficit) |
| Cable fly | Dumbbell fly, band fly |
| Face pull | Band face pull, prone rear-delt raise |
| Triceps pushdown | Overhead dumbbell extension, band pushdown, close-grip push-up |
| Calf raise machine | Single-leg dumbbell calf raise on a step |
| Bike/rower for conditioning | Brisk walk, stair climbing, skipping rope, kettlebell or dumbbell circuits |

Home gear that covers almost everything: adjustable dumbbells (to at least 25-30 kg each), an adjustable bench, a doorway pull-up bar, and a set of resistance bands.
Bands, bodyweight and home routines produce meaningful strength and hypertrophy gains (ACSM 2026).
With lighter dumbbells, use higher reps (15-30) taken close to failure, which still drives hypertrophy (Schoenfeld et al. 2017; 2021).

### Rules

- `R-3.1` Every lifting session follows the 5-block template above, trimming accessories first if time runs short.
- `R-3.2` First main lift: rep range 5-8 or 6-10; second main lift: 8-12; accessories: 10-15; small-muscle isolation: 12-20.
- `R-3.3` Rest: 2-3 min for compounds, 60-90 s for supersets, 45-60 s for small-muscle isolation pairs.
- `R-3.4` Use supersets only for antagonist or non-competing pairs (pairing rules above).
- `R-3.5` Every `LB` day includes at least one short upper-body superset if time allows, so no day feels lower-only.
- `R-3.6` Every lifting session ends with the cool-down block (section 6).

---

## 4. Conditioning for fat loss

### Evidence

- HIIT and moderate continuous training produce similar fat loss, with HIIT taking about 40% less time (Wewege et al. 2017); some later reviews show a modest edge for intervals (Viana et al. 2019), but the clinical difference is small.
- The interference effect between cardio and lifting is modest and depends on modality, frequency and duration; running interferes more than cycling (Wilson et al. 2012).
- A 2022 meta-analysis found concurrent training did not compromise whole-muscle hypertrophy or maximal strength in general, though explosive power may be blunted (Schumann et al. 2022).
- The main driver of fat loss is the energy deficit; cardio and daily steps help mainly by raising expenditure and improving fitness and health markers.
- Daily steps around 8,000-10,000 are associated with large health benefits in adults under 60 (Paluch et al. 2022).
- Zone 2 intensity, practically: you can talk in full sentences but would rather not sing; roughly 60-70% of maximum heart rate.
- Estimated max heart rate for a 32-year-old is about 186 bpm (Tanaka et al. 2001 formula: 208 - 0.7 x age), so Zone 2 is roughly 112-130 bpm; the talk test overrides the formula.

### Weekly dose

| Type | Weekly dose | Where it goes |
|---|---|---|
| Daily steps | 8,000-10,000 per day (start from current average +1,000-2,000) | Throughout the day, desk breaks, evening walk |
| Zone 2 | 90-150 min total | `CO` and `MO` sessions (30-45 min) and 10-min finishers |
| HIIT | 1-2 sessions, 10-20 min of work+rest total, never more than 2 | `CO` day or as a finisher on an upper-body day |
| Lifting finishers (circuits, carries, sled) | 2-3 per week, 6-10 min | End of `CB`, `SA`, `FB` |

### Finisher library

| Finisher | Format | When |
|---|---|---|
| Zone 2 flush | 8-10 min bike, rower or incline walk at Zone 2 | Any day, default for "OK" check-in |
| Bike or rower intervals | 6-8 rounds of 20-30 s hard / 60-90 s easy | "Good" check-in, not the day before `LB` |
| Density circuit | 8 min AMRAP: kettlebell swing 10, push-up 10, goblet squat 10 | `FB`, `SA`, "Good" check-in |
| Carries and core | 3 rounds: farmer carry 40 m, plank 40 s, dead bug 10 | Any day, low fatigue |
| Home skipping finisher | 8 rounds of 30 s skipping / 30 s rest | Home, "Good" check-in, not before `LB` |

### Interference rules

- `R-4.1` Prefer cycling, rowing, incline walking and stairs over running for intervals.
- `R-4.2` No HIIT on the day before or the day of an `LB` session, unless the HIIT is a low-impact upper-body-dominant format.
- `R-4.3` On the same evening, always lift first, then condition.
- `R-4.4` Cap HIIT at 2 sessions per 7 days; count HIIT finishers toward this cap.
- `R-4.5` Track Zone 2 minutes per week; if below 90 min by day 5 of the week, rank `CO` or `MO` higher in the menu.
- `R-4.6` "OK" check-in converts any planned HIIT into Zone 2; "wrecked" removes finishers entirely.

---

## 5. Progression and deloads

### Evidence

- Progressive overload can come from either adding load or adding reps; both produce similar hypertrophy and strength outcomes (Plotkin et al. 2022), which supports double progression.
- Strength can still rise in a deficit even when muscle gain is blunted (Murphy and Koehler 2022), so stable or slightly rising loads are a sign the plan is working.
- Coaches broadly agree that deloads (planned or reactive periods of reduced training stress) help manage fatigue, typically every 4-8 weeks, by cutting volume more than load (Bell et al. 2023).

### Double progression

Every exercise has a rep range (e.g. 8-12) and a target RIR.

1. Pick a starting load where the first set reaches the bottom of the range (e.g. 8 reps) at the target RIR.
2. Each session, try to add reps at the same load while staying at or above the target RIR.
3. When every working set hits the top of the range (e.g. 3x12) at the target RIR, increase the load next session.
4. Load step: about 2.5-5% or the smallest available jump; typically 2.5-5 kg for lower-body compounds, 2.5 kg for upper-body compounds, the next dumbbell (1-2.5 kg) for isolation.
5. After a load increase, reps drop back toward the bottom of the range; continue from step 2.
6. If a load jump drops reps below the bottom of the range, return to the previous load and add reps more slowly, or use a smaller jump.

For dumbbell-only training with big jumps between dumbbells, use a wider range (e.g. 10-20) so the jump is absorbed.

### Stall and regression rules

- `R-5.1` Apply double progression to every exercise, using the RIR the user logs (or "reps left in the tank" prompt).
- `R-5.2` Stall: no increase in reps or load for 3 consecutive exposures at the same check-in level means swap to a similar variation (e.g. incline dumbbell press to machine incline press), or drop one set for that exercise for a week.
- `R-5.3` Regression: performance falling for 2 consecutive exposures on several exercises suggests accumulated fatigue; trigger an early deload.
- `R-5.4` Sessions with "OK" or "wrecked" check-ins do not count as stalls.
- `R-5.5` Weekly volume progression per R-1.4 (add 1 set per priority muscle per week, up to the max).

### Deloads

- `R-5.6` Schedule a deload week after every 5-6 weeks of training, or earlier if R-2.6 or R-5.3 triggers.
- `R-5.7` Deload week: halve the number of hard sets, keep loads the same or reduce by up to 10%, train at 3-4 RIR, keep Zone 2 and steps, drop HIIT.
- `R-5.8` After a deload, restart the block at the "Start" set budget, with loads where they were before the deload.
- `R-5.9` During a fat-loss phase, treat maintained loads as success; do not show a stall warning if loads hold within about 5% while bodyweight drops.

---

## 6. Desk-sitter mobility

### Evidence

- Long-term static stretching (and foam rolling) improves joint range of motion with a moderate effect, and effects largely persist for weeks after stopping (Konrad et al. 2024; Konrad et al. 2025 detraining review).
- Exercise therapy is effective for reducing pain and improving function in chronic low back pain, with no single exercise type clearly superior (Hayden et al. 2021, Cochrane review).
- Long static stretching before lifting is not needed for performance; keep stretching for cool-downs and standalone routines (Iversen et al. 2021).
- His own experience (back stretching helped massively) is a good reason to keep a regular stretching habit; for an app, adherence matters more than exact drill selection.
- Evidence for "sitting posture correction" specifically is weak; the realistic goal is regular movement breaks, comfortable range of motion in the hips, thoracic spine and hamstrings, and strength through the posterior chain (rows, RDLs, face pulls), which the lifting plan already covers.

### Drill library

| Area | Drill | Dose |
|---|---|---|
| Hip flexors | Half-kneeling hip flexor stretch (squeeze glute, tuck pelvis) | 30-45 s per side |
| Hip flexors and quads | Couch stretch (rear foot against wall or sofa) | 30-45 s per side |
| Thoracic spine | Open book (side-lying rotation) | 6-8 slow reps per side |
| Thoracic spine | Thoracic extension over foam roller or chair back | 6-8 reps |
| Thoracic and lats | Child's pose with side reach, or bench lat stretch | 30-45 s, or 30 s per side |
| Spine | Cat-cow | 8-10 slow reps |
| Hamstrings | Supine hamstring stretch with strap/towel, or standing hip hinge stretch | 30-45 s per side |
| Glutes | Figure-4 stretch (lying or seated in chair) | 30-45 s per side |
| Hips | 90/90 hip switches | 6-8 reps per side |
| Chest | Doorway pec stretch | 30 s per side |
| Neck | Chin tucks | 8-10 reps, 3 s hold |
| Posterior chain activation | Glute bridge | 10-15 reps |
| Shoulders and spine decompression | Dead hang from a bar (gym or doorway) | 20-40 s, 1-2 sets |

### Desk reset (standalone, 6-8 min, no equipment, office-friendly)

1. Standing march or brisk walk, 45 s.
2. Chin tucks, 8 reps with 3 s hold.
3. Seated or standing thoracic rotation (arms crossed on chest), 6 per side.
4. Doorway pec stretch, 30 s per side.
5. Standing hip hinge with hands on desk (hamstrings and lats), 45 s.
6. Half-kneeling hip flexor stretch, 30-45 s per side (or standing split-stance version if kneeling is not possible).
7. Seated figure-4 glute stretch in the chair, 30 s per side.
8. Cat-cow (on the floor, or standing with hands on thighs), 8 reps.
9. Glute bridges, 12 reps (floor) or bodyweight squats, 10 reps.

5-minute short version: steps 2, 3, 5, 6, 7.

### Post-session cool-downs (5-7 min, chosen by focus)

All cool-downs start with 1 minute of slow walking or easy cycling, then 4-6 minutes of stretches held 30-45 s.

| Focus | Stretches |
|---|---|
| `CB` | Doorway pec stretch, bench lat stretch, child's pose with side reach, open book, half-kneeling hip flexor |
| `LB` | Couch stretch, supine hamstring stretch, figure-4 glute, 90/90 hip switches, cat-cow |
| `SA` | Doorway pec stretch, cross-body rear delt stretch, overhead triceps stretch, dead hang, open book |
| `FB` | Half-kneeling hip flexor, supine hamstring, doorway pec, child's pose, figure-4 glute |
| `CO` | Couch stretch, standing calf stretch, supine hamstring, figure-4 glute, cat-cow |
| `MO` | Full 15-20 min flow from the drill library plus 20-30 min Zone 2 |

### Rules

- `R-6.1` Every session ends with the focus-specific cool-down, always including at least one hip flexor and one thoracic or spine drill (because he sits a lot).
- `R-6.2` Offer the desk reset as a daily nudge (e.g. once mid-afternoon on workdays); it is separate from training and does not affect recovery calculations.
- `R-6.3` Warm-ups use 2-3 dynamic drills from the library relevant to the day, not long static holds.
- `R-6.4` `MO` sessions count as recovery, not training load.

---

## 7. Fat-loss context the app can gently support

### Deficit and rate of loss

- Aim for a bodyweight loss of about 0.5-1% per week; slower loss better preserves muscle (Helms, Aragon and Fitschen 2014).
- That is usually a deficit of about 300-500 kcal per day; larger deficits are linked to blunted lean mass gains (Murphy and Koehler 2022, with the caveat that the exact 500 kcal threshold is debated).
- For a "recomp" goal with a solid muscle base, the lower end (about 0.5% per week) is a sensible default.
- Use a 7-day rolling average of morning bodyweight, plus a weekly waist measurement at the navel, since water swings and new muscle can hide fat loss.

### Protein

- Protein intake beyond about 1.6 g/kg/day gives little further benefit for lean mass gains, with an upper confidence bound around 2.2 g/kg/day (Morton et al. 2018).
- ISSN recommends 1.4-2.0 g/kg/day for active people, and higher intakes (2.3-3.1 g/kg of lean mass) can help retain muscle in a deficit (Jäger et al. 2017; Helms et al. 2014).
- Practical target: 1.6-2.2 g/kg bodyweight per day, spread over 3-4 meals of about 25-40 g each (Jäger et al. 2017).
- Example: at 80 kg, 130-175 g per day.
- The ICMR-NIN Dietary Guidelines for Indians (2024) give a general-population requirement of about 0.83 g/kg/day and advise against routine protein supplements; they also acknowledge that intakes around 1.6 g/kg support resistance training gains.
- Since typical Indian diets average well below even the general requirement (estimated around 0.66 g/kg/day), protein is likely the single most useful nutrition nudge for this user.

### Indian protein sources (approximate values; check labels and IFCT 2017 tables)

| Food | Serving | Protein (approx.) | Notes |
|---|---|---|---|
| Paneer | 100 g | 18-20 g | High in fat; low-fat paneer exists |
| Hung curd / Greek yogurt | 200 g | 15-20 g | Good snack or raita base |
| Curd (dahi) | 200 g | 6-8 g | Everyday option |
| Milk (toned) | 250 ml | 8 g | |
| Soya chunks | 50 g dry | 25 g | Very protein-dense, cheap |
| Tofu | 100 g | 10-15 g | |
| Toor/moong/masoor dal | 1 katori cooked (about 150 g) | 9-12 g | Combine with rice or roti |
| Chana, rajma, chole | 1 katori cooked | 10-12 g | |
| Sprouts (moong) | 1 cup | 6-8 g | |
| Besan chilla | 2 medium (about 60 g besan) | 12-14 g | |
| Sattu drink | 40 g sattu | 8-9 g | Common summer drink |
| Eggs | 2 whole | 12 g | Egg whites about 3.5 g each |
| Chicken breast | 100 g cooked | 30 g | |
| Fish | 100 g cooked | 20-25 g | |
| Whey protein | 1 scoop (30 g) | 22-25 g | Optional; ICMR advises food first |

Vegetarian strategy: build each meal around one dense source (paneer, hung curd, soya, tofu, dal-plus-curd), and add one protein snack.
Lacto-vegetarian sources (paneer, curd, milk) plus legumes cover all essential amino acids when eaten across the day.

### Steps and NEAT

- Daily step target 8,000-10,000 (Paluch et al. 2022), progressing from the current Fitbit average by 1,000-2,000 per week.
- For a desk worker, short walks during calls and after meals are the easiest way to reach this.

### Warm, humid climate and hydration

- Bangalore evenings are relatively mild by Indian standards (roughly 20-28 °C most of the year), but humidity during the monsoon (about June-October) and hot pre-monsoon months (March-May) increases sweat loss and perceived effort.
- The ACSM fluid replacement position stand recommends starting exercise well hydrated (about 5-7 ml/kg a few hours before), avoiding more than about 2% bodyweight loss during exercise, and replacing about 1.25-1.5 litres per kg lost afterwards (Sawka et al. 2007).
- Drinking excessively beyond thirst during long sessions risks low sodium levels, so this is about matching sweat loss, not maximizing intake (Sawka et al. 2007).
- On hot or humid days, a salty snack or an electrolyte drink (or nimbu pani with a pinch of salt) helps replace sodium lost in sweat.
- Signs to stop: dizziness, confusion, nausea, chills or headache during exercise in the heat warrant stopping and cooling down (ACSM 2023 exertional heat illness consensus).
- If training at home without air conditioning, use a fan, train in the cooler part of the evening, and lower HIIT intensity on very humid days.

### Rules

- `R-7.1` Show a daily protein target of 1.6-2.2 g/kg from the user's logged weight, with Indian food examples.
- `R-7.2` Show a daily step target, starting from the 7-day average and stepping up toward 8,000-10,000.
- `R-7.3` Show weekly bodyweight trend (7-day average) and flag if loss is faster than 1% per week for 2 weeks (suggest eating a bit more) or no change for 3 weeks (suggest a small reduction or more steps).
- `R-7.4` Hydration nudge before sessions: about 500 ml water in the hour before, a bottle during, more on humid days.
- `R-7.5` On humid or hot days (manual toggle in v1, weather API later), replace HIIT finishers with Zone 2 and remind about electrolytes.
- `R-7.6` Keep nutrition features as gentle nudges; no calorie shaming, no aggressive targets.

---

## 8. Making "balanced but fair" concrete

The per-muscle table in section 1 is the main tool.
These extra rules keep the balance honest over time.

- `R-8.1` Priority ordering: chest and back exercises are placed first in any session that includes them, while fresh.
- `R-8.2` Each week, chest and back together get the largest share of hard sets (target about 30-35% of all fractional sets).
- `R-8.3` Lower body (quads, hamstrings, glutes, calves) gets about 25-30% of weekly fractional sets, never the largest share; this is enough to develop it without a lower-body focus.
- `R-8.4` Shoulders and arms get about 25-30% of weekly fractional sets combined (direct plus indirect).
- `R-8.5` Core gets the remaining share, roughly 5-10%.
- `R-8.6` Weekly review screen: show a simple bar per muscle with "sets done / budget", coloured below / in range / above.
- `R-8.7` If a muscle is below its minimum for 2 weeks running, boost its rank in the radial menu; never auto-schedule it, just make it more visible.
- `R-8.8` Re-evaluate priorities every 8-12 weeks with progress photos and waist/chest/arm/thigh measurements; when chest and back catch up, rebalance the table toward equal priority.

---

## 9. Rules for the session builder (compact)

**Inputs**: check-in (good / OK / wrecked), last 7 days of sessions (per-muscle fractional sets, timestamps), HIIT count, Zone 2 minutes, current block week.

**Menu generation**
1. Compute recovered muscles: 48 h since last hard work (72 h for lower body after `LB`, 48 h before `LB` after running HIIT).
2. Compute budget deficit per muscle vs the section 1 table.
3. Filter focus types to those whose primary muscles are recovered.
4. Apply check-in filter: good = all; OK = prefer `FB`, `SA`, `CO` (Zone 2), `MO`; wrecked = rest, `MO`, Zone 2 walk, minimum dose.
5. Rank by budget deficit, priority (chest/back first), conditioning need (Zone 2 under 90 min by day 5), and variety (no same lifting focus two days running, no `LB` two days running).
6. Show the top 3-4 options; include `FB` when nothing clearly wins.

**Session generation**
- Template: warm-up 6-8 min, 2 main lifts 20-22 min, 2-3 supersets 15-18 min, finisher 6-10 min, cool-down 5-7 min.
- Main lift 1: 3-4 x 5-8 or 6-10, 2-3 min rest; main lift 2: 3 x 8-12, 2 min rest; accessories: 2-3 x 10-15 in antagonist supersets, 60-90 s rest; small isolation 12-20 reps.
- RIR on "good": compounds 1-3, isolation 0-2; "OK": compounds 2-3, isolation 1-2, about 75% of sets, hold loads; "wrecked": 6-8 total sets at 3-4 RIR or no lifting.
- Max 8 direct hard sets per muscle per session.
- `LB` days include one short upper superset if time allows.
- Always end with the focus-specific cool-down including a hip flexor and thoracic drill.

**Conditioning**
- Steps 8,000-10,000 daily; Zone 2 90-150 min per week; HIIT max 2 per week on bike/rower/stairs.
- No HIIT the day before or day of `LB`; lift before conditioning; "OK" converts HIIT to Zone 2; "wrecked" removes finishers.

**Progression**
- Double progression: hit the top of the rep range on all sets at target RIR, then add the smallest load step.
- Stall after 3 flat exposures (ignoring OK/wrecked days): swap variation or drop a set.
- Add 1 set per priority muscle per week from "Start" to "Max".
- Deload every 5-6 weeks, or early on 3+ wrecked check-ins in 7 days or 2 regressing sessions: half sets, 3-4 RIR, same or -10% load, no HIIT.

**Recovery and rest**
- At least 1 rest day per 7 days; 2 consecutive wrecked check-ins means suggest rest.

**Nudges**
- Protein 1.6-2.2 g/kg/day with Indian food examples; target 0.5-1% bodyweight loss per week; hydration and electrolytes on humid days; daily desk reset.

---

## Sources

- American College of Sports Medicine (2026). Resistance Training Prescription for Muscle Function, Hypertrophy, and Physical Performance in Healthy Adults: An Overview of Reviews. Medicine & Science in Sports & Exercise. Summary: [ACSM resistance training guidelines update 2026](https://acsm.org/resistance-training-guidelines-update-2026/)
- ACSM (2023). Expert Consensus Statement on Exertional Heat Illness: Recognition, Management, and Return to Activity. [ACSM](https://rebrandx.acsm.org/education-resources/pronouncements-scientific-communications/official-statements/acsm-expert-consensus-statement-exertional-heat-illness)
- Bell L. et al. (2023). Integrating Deloading into Strength and Physique Sports Training Programmes: An International Delphi Consensus Approach. Sports Medicine - Open. [PMC10511399](https://pmc.ncbi.nlm.nih.gov/articles/PMC10511399/)
- Hayden J.A. et al. (2021). Exercise therapy for chronic low back pain. Cochrane Database of Systematic Reviews.
- Helms E.R., Aragon A.A., Fitschen P.J. (2014). Evidence-based recommendations for natural bodybuilding contest preparation: nutrition and supplementation. JISSN 11:20. [PMC4033492](https://pmc.ncbi.nlm.nih.gov/articles/PMC4033492)
- ICMR-NIN (2024). Dietary Guidelines for Indians. Coverage: [Telangana Today](https://telanganatoday.com/why-do-icmr-nins-new-dietary-guidelines-advise-against-protein-supplements), [The South First](https://thesouthfirst.com/news/icmr-releases-dietary-guidelines-for-indians-after-13-years-says-no-to-protein-supplements)
- ICMR-NIN (2017). Indian Food Composition Tables (IFCT 2017), for approximate protein values.
- Iversen V.M. et al. (2021). No Time to Lift? Designing Time-Efficient Training Programs for Strength and Hypertrophy: A Narrative Review. Sports Medicine 51:2079-2095. [PMC8449772](https://pmc.ncbi.nlm.nih.gov/articles/PMC8449772)
- Iversen V.M. et al. (2024). Superset versus traditional resistance training (RCT). Journal of Strength and Conditioning Research. [PubMed 39072654](https://pubmed.ncbi.nlm.nih.gov/39072654/)
- Jäger R. et al. (2017). International Society of Sports Nutrition Position Stand: protein and exercise. JISSN 14:20. [PubMed 28642676](https://pubmed.ncbi.nlm.nih.gov/28642676/)
- Konrad A. et al. (2024). Chronic effects of stretching and foam rolling on range of motion: a meta-analysis. Sports Medicine. [Springer](https://link.springer.com/10.1007/s40279-024-02041-0)
- MacDougall J.D. et al. (1995). The time course for elevated muscle protein synthesis following heavy resistance exercise. Canadian Journal of Applied Physiology.
- Morton R.W. et al. (2018). A systematic review, meta-analysis and meta-regression of the effect of protein supplementation on resistance training-induced gains in muscle mass and strength. British Journal of Sports Medicine 52:376-384. [PubMed 28698222](https://pubmed.ncbi.nlm.nih.gov/28698222/)
- Murphy C., Koehler K. (2022). Energy deficiency impairs resistance training gains in lean mass but not strength: a meta-analysis and meta-regression. Scandinavian Journal of Medicine & Science in Sports. [PubMed 34623696](https://www.pubmed.gov/34623696/); discussion: [Stronger By Science](https://www.strongerbyscience.com/muscle-caloric-deficit/)
- Paluch A.E. et al. (2022). Daily steps and all-cause mortality: a meta-analysis of 15 international cohorts. Lancet Public Health 7:e219-e228. [PubMed 35247352](https://pubmed.ncbi.nlm.nih.gov/35247352/)
- Pelland J.C. et al. (2024 preprint). The Resistance Training Dose-Response: Meta-Regressions Exploring the Effects of Weekly Volume and Frequency on Muscle Hypertrophy and Strength Gain. SportRxiv. [SportRxiv](https://sportrxiv.org/index.php/server/preprint/view/460)
- Plotkin D. et al. (2022). Progressive overload without progressing load? The effects of load or repetition progression on muscular adaptations. PeerJ. [PeerJ](https://peerj.com/articles/14142)
- Refalo M.C. et al. (2023). Influence of Resistance Training Proximity-to-Failure on Skeletal Muscle Hypertrophy: A Systematic Review with Meta-analysis. Sports Medicine 53:649-665. [Deakin](https://dro.deakin.edu.au/articles/journal_contribution/Influence_of_Resistance_Training_Proximity-to-Failure_on_Skeletal_Muscle_Hypertrophy_A_Systematic_Review_with_Meta-analysis/22030796)
- Robinson Z.P. et al. (2024). Exploring the Dose-Response Relationship Between Estimated Resistance Training Proximity to Failure, Strength Gain, and Muscle Hypertrophy. Sports Medicine. [Abertay](https://rke.abertay.ac.uk/en/publications/exploring-the-dose-response-relationship-between-estimated-resist/)
- Sawka M.N. et al. (2007). American College of Sports Medicine position stand: Exercise and fluid replacement. Medicine & Science in Sports & Exercise 39(2):377-390.
- Schoenfeld B.J., Ogborn D., Krieger J.W. (2016). Effects of Resistance Training Frequency on Measures of Muscle Hypertrophy: A Systematic Review and Meta-Analysis. Sports Medicine. [PubMed 27102172](https://pubmed.ncbi.nlm.nih.gov/27102172/)
- Schoenfeld B.J. et al. (2016). Longer interset rest periods enhance muscle strength and hypertrophy in resistance-trained men. Journal of Strength and Conditioning Research.
- Schoenfeld B.J., Ogborn D., Krieger J.W. (2017). Dose-response relationship between weekly resistance training volume and increases in muscle mass: a systematic review and meta-analysis. Journal of Sports Sciences.
- Schoenfeld B.J. et al. (2017). Strength and Hypertrophy Adaptations Between Low- vs. High-Load Resistance Training: A Systematic Review and Meta-analysis. Journal of Strength and Conditioning Research. [PubMed 28834797](https://pubmed.ncbi.nlm.nih.gov/28834797/)
- Schoenfeld B.J., Grgic J., Van Every D.W., Plotkin D.L. (2021). Loading Recommendations for Muscle Strength, Hypertrophy, and Local Endurance: A Re-Examination of the Repetition Continuum. Sports 9(2):32. [MDPI](https://www.mdpi.com/2075-4663/9/2/32)
- Schumann M. et al. (2022). Compatibility of Concurrent Aerobic and Strength Training for Skeletal Muscle Size and Function: An Updated Systematic Review and Meta-Analysis. Sports Medicine. [Springer](https://link.springer.com/article/10.1007/s40279-021-01587-7)
- Tanaka H., Monahan K.D., Seals D.R. (2001). Age-predicted maximal heart rate revisited. Journal of the American College of Cardiology.
- Viana R.B. et al. (2019). Is interval training the magic bullet for fat loss? A systematic review and meta-analysis comparing moderate-intensity continuous training with high-intensity interval training. British Journal of Sports Medicine. [PubMed 30765340](https://pubmed.ncbi.nlm.nih.gov/30765340/)
- Wewege M. et al. (2017). The effects of high-intensity interval training vs. moderate-intensity continuous training on body composition in overweight and obese adults: a systematic review and meta-analysis. Obesity Reviews. [PubMed 28401638](https://pubmed.ncbi.nlm.nih.gov/28401638/)
- Wilson J.M. et al. (2012). Concurrent training: a meta-analysis examining interference of aerobic and resistance exercises. Journal of Strength and Conditioning Research 26(8).
- Renaissance Periodization. Training volume landmarks for muscle growth (MEV, MAV, MRV), rpstrength.com.
- Stronger By Science (Greg Nuckols, Eric Trexler and others), articles on frequency and training in a caloric deficit, strongerbyscience.com.
- Jeff Nippard and Menno Henselmans, evidence-based coaching content on volume, frequency and exercise selection (used as practitioner context, not primary evidence).

### Confidence notes

- Strong evidence: volume dose-response, load range for hypertrophy, protein targets, HIIT vs continuous fat loss equivalence, steps and health, double progression working.
- Moderate evidence: 48-72 h recovery windows, fractional set counting, deficit size threshold (500 kcal debated), interference by modality.
- Reasoned defaults (coaching consensus or logic, not trials): exact focus rotation, per-session set cap, check-in adjustment percentages, deload every 5-6 weeks, Fitbit readiness thresholds, share-of-sets percentages in section 8.
