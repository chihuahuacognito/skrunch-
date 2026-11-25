# On-device checklist - muscle group redesign

**Date**: 2026-11-26
**Content Type**: Checklist

Merged to `main` on 2026-11-26 before this check, at the owner's request.
Tick each box on the phone in Expo Go.
Note anything that fails under "Findings" at the bottom, with what you did and what you saw.

## Setup

1. On the PC, in the project folder, run `npx expo start --clear --port 8082`.
2. Phone and PC on the same Wi-Fi.
3. In Expo Go, open `exp://192.168.0.101:8082` (or scan the QR code in the terminal; the IP can change after a router restart).
4. Port 8082 keeps it apart from the other Expo app on 8081.

## 1. Home

- [ ] The screen is readable in gym lighting: text, panels and figure colours all clear.
- [ ] The front and back figure shows. Groups trained in the last 7 days are coloured (orange 0-1 days, yellow 2-4, blue 5+).
- [ ] Tapping each muscle on the figure opens the right group:
  - [ ] chest
  - [ ] front shoulder (should open Shoulders, not Chest or Arms)
  - [ ] biceps and triceps (Arms)
  - [ ] abs (Core)
  - [ ] quads
  - [ ] back
  - [ ] glutes
  - [ ] hamstrings
  - [ ] calves (small, check both legs)
- [ ] The 3x3 grid shows each group with "last worked" and sets/target. BEHIND badges make sense.
- [ ] The Cardio and Stretch cards open their screens.
- [ ] The "Last 7 days" card opens History.

## 2. Group screen

- [ ] Three exercise cards show, each with photos that alternate (two frames).
- [ ] Turn on airplane mode: the photos still load (they ship inside the app).
- [ ] Each card shows an exact target, for example "3 × 6 @ 60 kg", and when it was last done.
- [ ] Arms shows one biceps card and one triceps card.
- [ ] "More" lists extra exercises, and adding one works.
- [ ] Tap the first set dot on a lift you have never done: it asks for the weight. Later dots reuse that weight.
- [ ] A loaded lift will not save at 0 kg.

## 3. Rest timer and notification

- [ ] Tapping a set dot logs the set and starts the rest panel at the bottom (120 s main lift, 90 s accessory).
- [ ] +15 s and Skip work on the panel.
- [ ] Lock the phone during a rest: the notification shows, with Complete set, +15 s and Skip.
- [ ] "Rest over" arrives on time with the phone locked. Note how late it is, if at all (this decides the exact-alarm question below).
- [ ] After "Rest over", pressing Complete set in the notification logs the next set (this was the critical bug).
- [ ] Pressing Completed or Edit during a rest clears the rest panel and the notification.

## 4. Edit, Undo, Completed

- [ ] Edit before any set, then Save: the exercise is not marked Completed.
- [ ] Edit after some sets: change the weight or reps and Save. The card shows the change.
- [ ] Undo removes tonight's sets for that exercise.
- [ ] Completed marks the card done.

## 5. Reopening

- [ ] Kill the app during a rest, then reopen it within 45 minutes: it lands back in the group you were in.
- [ ] Reopen it after more than 45 minutes: it opens on Home.
- [ ] The Tonight strip on Home shows tonight's groups, sets and minutes.

## 6. Cardio, Stretch, History

- [ ] Cardio shows Zone 2 minutes against 150 a week, and the interval cap of 2 days.
- [ ] Cardio cards read Steady, Timed or Rounds. The timer works.
- [ ] The More / Less / Never buttons on Cardio do something (they were dead before).
- [ ] Stretch shows the desk reset and a 5-stretch cool-down for tonight's groups.
- [ ] History lists days newest first. Tapping a day shows its exercises. Minutes show for days logged from now on.
- [ ] Export history saves a JSON file to the chosen folder.

## Questions to answer after the check

- [ ] Should "Rest over" use the exact-alarm permission (`USE_EXACT_ALARM`) so it is punctual on a locked phone? Decide based on section 3.
- [ ] When you edit a set's weight, should the next set dots carry that new weight? (Today they keep the original target weight.)

## Known small issues (not bugs to report)

- The first rest notice for a brand-new lift does not show the weight.
- If saving to the database fails, the app does not say so.
- With Reduce Motion on, the detail sheet shows one photo instead of both side by side.
- The Tonight minutes keep counting if you undo every set.

## Findings

(Write what failed here: screen, what you did, what you expected, what happened.)
