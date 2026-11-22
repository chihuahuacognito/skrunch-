**Date**: 2026-11-22
**Content Type**: Analysis

# Instagram Saved Export - Triage

Source: `saved/saved_posts.html` and `saved/saved_collections.html`.
The export was generated 2026-11-21 and covers saves from 2025-12-22 to 2026-11-19.
Anything saved before late November 2025 is not in it.
Parsed data: `saved/saved_parsed.json`.

## Key finding

The export includes the full caption and creator username for every post.
Most exercises can be read straight from the captions, so yt-dlp is only needed for posts with vague captions.

## Counts

| | Posts |
|---|---|
| Total saved | 195 (no exact duplicates) |
| In collections | 171 |
| Not in any collection | 24 |

| Collection | Posts | Keep? |
|---|---|---|
| mobility | 62 | Yes |
| Workouts | 58 | Yes |
| Arms | 1 | Yes |
| food | 29 | No |
| design | 17 | No |
| Trips | 3 | No |
| watchlist | 2 | No |

Workout-related collections: 121 entries, 120 unique posts.
A skim of all 120 found nothing misfiled. All of them are training, mobility or rehab content.

## Duplicates

| Kind | Posts | Notes |
|---|---|---|
| Same post in two collections | `DU-8lkIAFL_` (squat_university, world's greatest stretch) | Workouts + mobility |
| Same caption, different post (likely repost) | `DVs-M9Kjagz` + `DUvgNddjdlY` (garcia_effect_official, 10 desk exercises) | Both in mobility |
| Same caption, different post (likely repost) | `DT5bruXjq7w` (Workouts) + `DRhpVSqDooC` (uncollected) (arielyu.fit, 3-minute abs) | |
| Overlapping content | `DdVNUdEvOfF` + `DZ6GmmMPS_u` (proformance_sportstherapy, wrist cheat sheets) | 3 of 4 exercises are shared. Keep both, dedupe at the exercise level |

Squat University captions look similar only because they share a "shout out" template. They are different exercises.

After deduping: 119 unique workout/mobility posts in collections.
Exercise-level overlap will be much higher, since many posts repeat the same moves (hip flexor work, dead bugs, world's greatest stretch, curl grip variations).

## Overlap by muscle group and type

Method: keyword tagging of captions (English plus the Korean and Japanese terms used).
This is rough. 19 posts name no body part in the caption, and a post can count toward several groups.

| Muscle group | Posts |
|---|---|
| Core / abs | 40 |
| Hips / hip flexors | 39 |
| Lower back | 31 |
| Shoulders (mostly mobility and rotator cuff) | 30 |
| Legs (quads / hamstrings) | 26 |
| Neck / thoracic spine / posture | 22 |
| Glutes | 21 |
| Upper back / lats | 15 |
| Chest | 12 |
| Biceps | 9 |
| Forearms / wrists | 6 |
| Triceps | 5 |

| Type | Posts |
|---|---|
| Strength / hypertrophy | 62 |
| Rehab / posture | 48 |
| Mobility | 41 |
| Stretching | 32 |
| Conditioning | 14 |

Observations:
- Heavy overlap in one cluster: core, hips, lower back and posture. Most of these are desk-sitting fixes from different creators covering the same ground (hip flexors, anterior pelvic tilt, core control).
- The gym content is thin for the lagging areas: chest 12 posts, upper back 15.
- The arms posts are mostly jongkeungil's "grip variation" series, which are variations of the same few exercises (curl, pushdown, pulldown, row).
- At the exercise level, the most repeated moves found in captions are crunch/leg-raise variations, squats, rows, curls, planks, Bulgarian split squats and supermans/swimmers.
  Many mobility posts name their moves only on screen, so exercise-level overlap is undercounted until the videos are checked.

## Not in any collection (24)

Non-fitness (5): preserveddragons (martial arts film), chinesewithmeganx, notasalaryman, uok.mel, olympics (gymnastics clip).

Fitness (19, pending the owner's decision):
jongkeungil x4 (barbell curl grips, beginner chest, beginner shoulders), thefitcircuits (15 min abs), alejandromatiasfit (10 min mobility), sweat_squadusa (kettlebell home), trevorsinstinct x2 (TV mobility, 5 min flow), arielyu.fit (3 min abs, duplicate), tomwilsonleonard x2 (morning mobility, neck/shoulders), les_bodcon (spine), coachkeg (single-leg RDL), coachjohnnoel (modifications), yogasong_hayeon x2 (deep core, before-bed stretches), vernongriffith4 (hips), hironori_nakajima (dynamic hip stretch), waifumani (leg mobility).
