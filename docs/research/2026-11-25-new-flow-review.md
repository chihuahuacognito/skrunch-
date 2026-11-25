# New muscle-group flow: coverage review and home-view alternatives

**Date**: 2026-11-25
**Content Type**: Research

Two agents reviewed the owner's new flow (home with muscle groups and last-worked; tap a group; exercises with picture, sets x reps, last done; Completed per exercise). The sketch is `.superpowers/brainstorm/526-1795617910/content/flow-v1.html`.

## Coverage gaps (flow review)

- **Balance.** "Days since" shows recency, not volume. Drive colour and order from weekly hard sets vs budget (`needs()`, `deficits()`), show "6/12 sets this week". Calves (budget 0-8) must never nag.
- **Compound lifts.** Credit groups with `sessionCredit` (1 per primary set, 0.5 per secondary, worked at 1.5). Fixed mapping of 9 groups onto the 13 budget muscles (Back = lats + mid back, Shoulders = three delts, Arms = biceps + triceps).
- **Conditioning** is not a muscle group: add a Cardio tile (intervals, Zone 2 minutes this week).
- **Desk reset and stretching:** add a Stretch tile (`buildDeskReset` plus purpose items). It can replace Home mode.
- **Warm-up:** one collapsed row at the top of the first group opened that evening.
- **Rest timer:** small set dots per card start rest (reuses the existing notification), record nothing.
- **How much is enough:** order exercises with `isMainLift` / `rankCandidates` (compound first, 1-2 accessories, rest under More), soft "enough" mark at about 8 direct sets per group; straight sets across 3 groups already fill an hour.
- **Progression** needs a concrete target per card (see logging).
- **Deload:** week-6 banner and halved sets (`blockState`), later.
- **Recovery:** "recovering" tag within 48 h (`unrecovered()`), never a block.
- **Instagram saves:** none merged yet (0 items with `sourceUrl`); purpose items go to Stretch and Warm-up.
- **Session boundary:** all completions on one calendar day form a session. Export moves to a History screen; per-exercise history is the one history view worth having.

## Gym-floor friction

Equipment taken (short ranked list with next-best), undo on Completed, reopen into the last group, back link and top grid out of thumb reach (use system back, tonight's groups as bottom chips), tap-to-enlarge pictures, keep screen awake during rest.

## Ranked add-ons

1. v1 - sets this week vs budget per group.
2. v1 - set dots that start the rest timer.
3. v1 - concrete target per card ("3 x 10 @ 60 kg"), Completed = hit it, sheet for exceptions.
4. v1 - Cardio and Stretch tiles.
5. v1 - undo, calendar-day session, resume in last group.
6. v1 - "Tonight" strip: groups touched, sets, minutes.
7. Later - deload banner.
8. Later - per-exercise history and post links after the Instagram merge.

Builder code still useful: prescribe, volume, needs, budget, block, recovery, select, desk, parts, estimate. Dead: rank, focus specs, session templates, replaceItem, most of tally, check-in effects.

## Logging

Tap plus optional edit, against one concrete target per card. A range ("8-12") plus a single tap cannot drive double progression; a concrete target can. Every-set logging is extra entry for the rare exception.

## Home-view alternatives (visualization research)

| Option | Shows well | Weak at | Picker | Precedent |
|---|---|---|---|---|
| Freshness tiles + target bar | recency, glanceable | exact numbers | yes | [Fitbod recovery](https://help.fitbod.me/hc/en-us/articles/360006269014-Muscle-Recovery) |
| Ranked list with progress bars | volume vs target, lagging groups | gestalt, height | yes, most precise | [Hevy sets per muscle](https://www.hevyapp.com/features/sets-per-muscle-group-per-week/) |
| 7-day heatmap | rhythm, frequency | target, tiny cells | weak | GitHub contributions |
| Ring grid | progress to target, modern | comparison, recency | yes | Apple Activity rings |
| Radar chart | overall balance | recency, floating labels | no | [Boostcamp muscle tracker](https://www.boostcamp.app/features/muscle-tracker) |
| Next-up card + chips | speed, zero clutter | full picture | yes | [Fitbod workout logic](https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout) |
| Body figure as thumbnail | instant whole-body read | volume, small targets | no | [react-native-body-highlighter](https://github.com/TrendingTechnology/react-native-body-highlighter) (MIT) |

Agent recommendation: ranked list tinted by freshness, or freshness tiles with a target bar; a next-up line can sit on top of either. The body figure is best as decoration.
