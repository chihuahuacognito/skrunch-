**Date**: 2026-11-22
**Content Type**: Design Document (short)

# Saved-Post Review Tool - Tagging Upgrade

## Intent

The owner reviews saved Instagram workout posts in `saved/review.html` so Claude can build the exercise library without vision.
The owner tags what they know: exercise names, purpose, type and muscles.
Claude can overrule muscles and type when it maps exercises to free-exercise-db.
The tool should still work for a review of newer saves months from now.

Revised after an expert review (evidence-based S&C coach / physio agent, 2026-11-22). Changes from that review are marked (R).

## Classification

| Dimension | Who tags | Values |
|---|---|---|
| Muscles / region | Owner, Claude may overrule | free-exercise-db's 17: abdominals, abductors, adductors, biceps, calves, chest, forearms, glutes, hamstrings, lats, lower back, middle back, neck, quadriceps, shoulders, traps, triceps. Plus **hip flexors** and **thoracic spine** (R). Obliques and deep core fold into abdominals |
| Type | Owner, Claude may overrule | strength, conditioning, mobility, stretch, stability. Boundary rules below (R) |
| Purpose | Owner only | hip flexors / sitting stiffness, lower back comfort, desk breaks, wrists, knees, shoulder health (R: reworded). New values allowed, but only after checking the existing list (R) |
| Moves | Owner, when the caption doesn't list them | Free text |
| Derived by Claude, not tagged | - | Primary/secondary muscles (1.0 / 0.5 weighting), front/side/rear delt and rotator cuff split (R), movement pattern, equipment, location, session role, position: standing / seated / floor (R), dose format: reps / hold / duration (R), impact: jumping / low-impact for conditioning (R, optional) |

### Type boundary rules (R)

- **Strength:** progressed by adding load or reps. Loaded core work (cable crunch, hanging leg raise) counts here.
- **Conditioning:** done for heart rate or work capacity (intervals, circuits, Zone 2).
- **Mobility:** active movement through a range, done for reps (90/90 switches, world's greatest stretch). Goes in the warm-up.
- **Stretch:** a held position, 10-30 s holds, about 60 s total per stretch (ACSM, Garber 2011). Goes in the cool-down.
- **Stability:** low-load motor control that is not progressed by adding weight (dead bug, bird dog, Pallof press, side plank).
  This is our own category, not ACSM's "neuromotor" type, which means balance and coordination.

ACSM's flexibility type covers both static and dynamic stretching. Mobility and stretch are split because each maps to a session slot.

### What a muscle tag means (R)

Only **strength** items count toward the weekly set budget in the main design.
On mobility, stretch and stability items, a muscle tag means "target region", not training volume.
So a hip flexor stretch or a rotator cuff drill never inflates hip or delt volume.
Stability sets do not count toward the core budget.

### Purpose: evidence framing (R)

Purpose means "what I'm working on", not "what this cures".
- Exercise reduces chronic low back pain (Hayden et al., Cochrane 2021, CD009790; 249 trials; about 15 points on a 0-100 scale against no treatment, moderate certainty). No exercise type is clearly better: a companion network meta-analysis (Hayden et al., J Physiother 2021) found small, low-certainty edges for Pilates, McKenzie and functional restoration.
- Anterior pelvic tilt is common in pain-free people (Herrington 2011, Manual Therapy, as reported by secondary sources; original not read), so it is not treated as a diagnosis.
- There is no consensus that spinal posture causes low back pain (Swain et al. 2020, J Biomech, review of 41 reviews). Hence "desk breaks" (moving often) rather than "desk posture".

### Builder rule needed in the main design (R)

The saves are skewed (about 40 core, 39 hip and 31 lower-back posts, against 12 chest and 15 upper back).
Items with a Purpose tag fill only the warm-up, cool-down, desk reset and Mobility focus, never a main-lift or superset slot.
Chest and back main work comes from the base library.
This rule and the strength-only volume rule above must be added to the main design doc.

## Approaches

- **A (picked):** the owner tags purpose plus moves, and Claude derives the rest. The owner chose to also tag type and muscles, with Claude allowed to overrule.
- B: the owner tags every dimension, Claude never overrules. Rejected: more clicks on things a lookup handles.
- C: free-form tags. Rejected: synonyms drift and the session builder can't use them.

## Tool changes

- Each dimension is a dropdown that opens a checklist (multi-select), showing chosen values as chips when closed.
  Muscles and type are pre-filled with Claude's caption guesses, shown dashed until confirmed or edited.
  Purpose is pre-filled from caption keywords (back pain, hip flexor, pelvic tilt, wrist, knee and similar).
- Purpose's "add new" filters the existing list as you type, and only adds a new value if nothing matches (R).
- Keep the moves field, the note field, the vague-caption badge, and the "Kept, moves missing" filter.
- Remove the Role row and the free "Your tags" row.
  Existing custom tags become purpose values. The old "desk reset" role and "posture" tag become "desk breaks".
  Old muscle tags the owner already confirmed are kept as a hint only. Claude re-derives muscles from the exercise names rather than mapping them mechanically (R).
- **Future reviews:** an **Import decisions** button loads an earlier `review-decisions.json`.
  The build script accepts any new Instagram export. Posts already decided keep their decisions, and a "New since last import" filter shows only new ones.
  Browser autosave stays, but the exported JSON is the durable record.
- Export also includes the vocabulary lists, so a later review starts with the same purpose values.

## Not in scope

- No automation or periodic import. A future review is a manual re-run of the build script on a new export.
- No movement pattern, equipment or position tagging in the tool.

## Left to the builder

- Dropdown look and keyboard handling (shortcuts stay paused while a dropdown is open).
