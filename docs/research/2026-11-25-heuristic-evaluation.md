# Heuristic evaluation of the Plan 3-4 flow

**Date**: 2026-11-25
**Content Type**: Analysis

## Scope and method

- Screens: check-in (`src/app/index.tsx`), focus menu (`menu.tsx`), preview (`preview.tsx`), workout (`workout.tsx`), summary (`summary.tsx`), desk reset (`desk.tsx`).
- Method: Nielsen's 10 heuristics, one evaluator (Claude), walked through the code plus the owner's on-device reaction on 2026-11-25 ("everything is towards the right", "I don't like the flow at all").
- Limitation: one evaluator, no screenshots. Treat severities as a starting point for the redesign, not as test results.

Severity: 0 none, 1 cosmetic, 2 minor, 3 major, 4 catastrophe.

## Findings

| # | Heuristic | Where | Problem | Sev | Direction |
|---|-----------|-------|---------|-----|-----------|
| 1 | Consistency and standards | Whole flow | Two interaction languages in one evening: the right-edge arc on check-in, menu and desk entry, then ordinary lists and buttons on preview, workout and summary. The app changes its model halfway through. | 3 | One interaction model from opening to summary. |
| 2 | Flexibility and efficiency (ergonomics) | Check-in, menu | The arc lives on the right edge only, so the left half of the screen is dead and left-hand use is awkward. The header controls (Gym/Home toggle, "Change") sit top-left, the farthest point from the arc. | 3 | Controls bottom-centre, reachable by either thumb; nothing important in the top third. |
| 3 | Flexibility and efficiency | Check-in to first set | Four full screens before the first set: check-in, menu, preview, workout. The check-in is a whole screen for one tap. | 3 | Collapse into one or two surfaces; the check-in and the choice can live together. |
| 4 | Recognition over recall | Menu | The fisheye shrinks labels away from the thumb, so you must sweep to read the options. The menu shows a time hint but not what the session contains; that needs a separate preview screen. | 2 | All options readable at rest; the content of an option visible before committing. |
| 5 | Visibility of system status | Workout | The rest banner lives inside the scroll view and can scroll out of sight. "End" sits top-right, out of thumb reach. | 2 | Rest state pinned in a fixed zone near the thumb. |
| 6 | Aesthetic and minimalist design | Workout | One step shows the block title, a counter, cards with set rows, an inline number editor that pushes content down, chips and two equal-weight Back/Next buttons. Busy for a between-sets glance. | 2 | One clear primary action at a time; secondary actions tucked away. |
| 7 | User control and freedom | Workout, desk | Moving between steps is button-only; no swipe between exercises. The inline editor shifts the layout under the finger. | 2 | Horizontal swipe between steps with visible buttons as the fallback; edit in a sheet that does not reflow the page. |
| 8 | Aesthetic and minimalist design | All | Default stack slide transitions only; no shared motion between screens, so the flow feels like separate pages, not one fluid thing. | 2 | Continuous transitions (a card that grows into the workout, a sheet that morphs) with spring physics. |
| 9 | Consistency and standards | Summary | Export sits on the summary screen, a moment unrelated to backups. | 1 | Move export to a quiet settings or history spot. |

## Top three for the redesign

1. One interaction model across the whole evening (finding 1).
2. Bottom-centre, two-thumb reach instead of a right-edge arc (finding 2).
3. Fewer surfaces between opening the app and the first set (finding 3).
