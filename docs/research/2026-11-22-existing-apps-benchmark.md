**Date**: 2026-11-22
**Content Type**: Research

# Existing Workout Apps Benchmark

## Purpose and scope

This report checks whether a personal workout app is worth building, and which ideas to borrow from existing apps.
It is written for one user: a 32-year-old male in Bangalore on Android who trains about 1 hour most evenings.
His goals are fat loss, a lean "very fit" look, and balanced whole-body training, with strength and stamina secondary.
He sits a lot, already does back and desk stretches, and tracks sleep and recovery with a Fitbit.

The planned app flow is:

1. One-tap recovery check-in (good / OK / wrecked).
2. A radial thumb menu offers 3-4 focus options that fit recovery and recent training.
3. The app builds a session of about 1 hour, including a conditioning finisher and a cool-down stretch.
4. A separate 5-10 minute desk-reset stretch routine.
5. Exercise library = a free open-source exercise DB plus his tagged Instagram saves, linking back to the original posts.

### Method and caveats

Research used web searches run on 2026-11-22.
Many "review" sources in this space are affiliate sites or competitors' blogs (for example SensAI, Alpha Progression, Fitbod, Hevy and Unstar all publish comparisons of rivals).
Where a source is vendor-written, this report says so.
Rupee prices were hard to find, and only Google Health Premium has an official INR price in the sources.
App store prices in India are usually localized below the USD price, so check the Play Store checkout screen.
Tap counts to start a workout are **my estimates** from each app's documented flow, not measured, and are marked "est."

## 1. Apps that generate or adapt workouts

### Summary table

| App | How it picks the session | Uses recovery / wearable data? | Taps to start (est.) | Price | Main praise | Main complaints |
|---|---|---|---|---|---|---|
| Fitbod | Per-muscle recovery estimate from your own logged history, plus goal and equipment | No HRV/sleep; Health Connect imports only bike, elliptical, rowing workouts | 2 (open app, Start) | $15.99/mo or $95.99/yr for new users; no free tier | Truly "open and go" | Too many exercise options, repetition, generic for advanced lifters |
| Gravl | "Recovery split" based, adapts to recent activity, gym, schedule | Uses history and recovery info; wearable depth unclear | 2-3 | $14.99/mo or $59.99-89.99/yr, 3 free workouts | High store rating | Few independent hands-on reviews |
| Alpha Progression | Generated hypertrophy plan with periodized sets, reps, RIR and deloads | No | 2-3 | about $12.99/mo or $79.99/yr, 14-day trial | Progression logic, exercise DB | Trial billing issues, no watch support |
| JuggernautAI | Daily readiness questionnaire (sleep, motivation, food, soreness on 1-5) plus RPE feedback | Self-reported only | 3-4 (check-in first) | about $35/mo or $350/yr (may be dated) | Real autoregulation | Powerlifting-focused, expensive |
| Future | Human coach writes your plan | Coach can view wearable data | 2 | $199/mo ($149/mo annual) | App quality, accountability | Price (about 10x other apps) |
| Caliber | Human coach tier or free self-guided plans | No | 2-3 | Base app free; coaching tiers priced separately | Good free app | Coaching cost unclear in 2026 sources |
| Hevy | You build routines; no auto-generation | No | 2-3 (Workout tab, routine, Start) | Free core; Pro about $2.99/mo, $23.99/yr, $74.99 lifetime | Free tier, Android first-class, lock-screen controls | Not a coach |
| Strong | You build routines | No | 2-3 | Free with limits; Pro about $29.99/yr | Fastest, no-frills logging | Android less polished than iOS (per one blog) |
| Boostcamp | Pick a structured program from known coaches | No | 2-3 | Core free; Pro tier (about $59.99) | Huge free program library | Features moved behind paywall |
| Liftosaur | Programs written as editable scripts ("Liftoscript") | No | 2-3 | Free and open source; optional subscription | Fully customizable, open source | Aimed at "coders", steep learning curve |
| wger | You build routines; exercise wiki and REST API | No | 3+ | Free, AGPL, self-hostable | Open, API, active in 2026 (v2.1.x) | Less polished UX |
| Google Health Coach (ex Fitbit Premium) | Gemini coach sets weekly targets and suggests each day's focus from readiness, progress and weather | **Yes**: readiness, sleep, training load from his Fitbit | Chat-driven, varies | Google Health Premium: Rs 499/mo or Rs 4,999/yr (official Google India blog) | Pushes back on overtraining, adapts to busy days | Strength sets logged manually or by chat; adaptive depth questioned |
| SensAI | AI coach adjusting training from imported HRV, sleep, RHR | Yes (Oura, WHOOP beta, Garmin, Apple Watch) | Varies | Not confirmed | Wearable-aware | Fitbit support not confirmed; source is the vendor's own blog |

### Notes per app

**Fitbod.**
Reviewers describe it as estimating how recovered each muscle group is from your training history, then choosing exercises that balance stimulus against recovery ([SensAI review](https://www.sensai.fit/blog/fitbod-review-2026), [aitoolsbakery](https://aitoolsbakery.com/blog/fitbod-review/)).
It does not read HRV, sleep or wearable recovery data ([aitoolsbakery](https://aitoolsbakery.com/blog/fitbod-review/)).
On Android, Health Connect imports only biking, stationary biking, elliptical and rowing; yoga and HIIT are not used by the algorithm ([Fitbod help](https://help.fitbod.me/hc/en-us/articles/22109292991895)).
Pricing rose in 2026 to $15.99/mo or $95.99/yr for new users, and there is no free version ([aitoolsbakery pricing](https://aitoolsbakery.com/?p=16300), [thepricer](https://www.thepricer.org/how-much-does-fitbod-cost/)).
Complaints: too many exercise options per muscle group, repeated exercises, and an "algorithm is broken" verdict from a long-term Reddit user, reported second-hand ([onclarity](https://www.onclarity.com/leaderboard/insight/fitbod), [Trustpilot](https://www.trustpilot.com/review/fitbod.me), [Indie Hackers](https://www.indiehackers.com/post/fitbod-app-review-2026-honest-take-after-real-testing-45d5f07a1b)).
Fitbod's own answer is "recommend more / less / exclude" controls on each exercise ([Fitbod blog](https://fitbod.me/blog/recommend-more-less-exclude/)).
Relevance: Fitbod is the closest to his "app builds my session" idea, but ignores his Fitbit and his Instagram ideas.

**Gravl.**
Described as adapting upcoming workouts to recovery, recent activity, the gym you are in and your schedule, using a "recovery split" rather than per-muscle scores ([Alpha Progression vs Gravl](https://alphaprogression.com/en/blog/alpha-progression-vs-gravl), vendor-written; [SourceForge](https://sourceforge.net/software/product/Gravl/)).
Price about $14.99/mo or $59.99-89.99/yr after 3 free workouts ([SensAI Gravl review](https://www.sensai.fit/blog/gravl-app-review-2026)).
I found no independent hands-on review of its recovery logic ([Gainframe](https://gainframe.app/blog/gravl-app-review/) states it did not train with the app).

**Alpha Progression.**
Generates a plan from equipment and experience, and periodizes sets, reps and RIR across mesocycles with deloads ([Alpha Progression](https://alphaprogression.com/en), [aitoolsbakery](https://aitoolsbakery.com/?p=19503)).
About $79.99/yr with a 14-day trial; free tier is logging only ([Hevy comparison](https://www.hevyapp.com/?p=18340), vendor-written).
Strong ratings (about 4.8-4.9) with complaints about trial billing and no watch app ([brace-ai](https://brace-ai.pages.dev/reviews/alpha-progression/)).
Hypertrophy-first, so it fits "looking fit" but not his conditioning and mobility blocks.

**JuggernautAI.**
The best-known example of a **daily readiness check-in**: motivation, sleep, calories and soreness rated 1-5 before each session ([Garage Gym Reviews](https://garagegymreviews.com/juggernautai-review)).
Powerlifting-oriented and about $35/mo ([Garage Gym Reviews](https://garagegymreviews.com/juggernautai-review)); even a competitor concedes it is the pick for meet peaking ([Alpha Progression](https://alphaprogression.com/en/blog/best-juggernautai-alternatives)).
Relevance: proves the check-in concept, but four questions is three more than he wants.

**Future and Caliber.**
Future is a human coach in an app at $199/mo, and reportedly dropped a free AI beta in June 2026 to focus on human coaches ([SensAI Future review](https://www.sensai.fit/blog/future-app-review-2026), competitor; [Active.com](https://www.active.com/fitness/articles/future-app-review)).
Caliber has a free self-guided app and paid coaching tiers ([App Store](https://apps.apple.com/us/app/caliber/id1482405410), [BarBend](https://barbend.com/caliber-fitness-app-review/)).
Neither fits a "minimal, personal, fast" brief.

**Hevy and Strong.**
Both are loggers, not generators.
Consensus: Strong for fastest no-frills logging, Hevy for Android, a generous free tier and community ([repreturn](https://repreturn.com/strong-app-vs-hevy/), [aitoolsbakery](https://aitoolsbakery.com/blog/hevy-vs-strong-app/), [setgraph](https://setgraph.app/ai-blog/hevy-vs-strong-app-comparison-2026)).
Hevy Pro is about $2.99/mo, $23.99/yr or $74.99 lifetime ([Adapty](https://adapty.io/paywall-library/hevy/), [Recurdash](https://recurdash.com/subscription-pricing/hevy)).
Hevy's live activity widget works on Android and iOS, lets you complete sets from the lock screen, and shows the rest timer with +/-15 s and skip, on the free tier ([Hevy help](https://help.hevyapp.com/hc/en-us/articles/35649846517399-How-to-Use-Hevy-s-Live-Activity-on-iOS-and-Android), [Hevy feature page](https://www.hevyapp.com/features/live-activity/)).

**Boostcamp and Liftosaur.**
Boostcamp offers proven programs from known coaches with a free core ([Fortune](https://fortune.com/article/boostcamp-review/), [Garage Gym Reviews](https://www.garagegymreviews.com/boostcamp-review)), with some users unhappy that free features moved behind the paywall ([JustUseApp](https://justuseapp.com/en/app/1529354455/boostcamp-gym-workout-planner/reviews)).
Liftosaur is an open-source PWA where every program is an editable script ([GitHub](https://github.com/astashov/liftosaur), [liftosaur.com](https://liftosaur.com/)).
Liftosaur is a useful reference for "programs as data", which matches his rules-based session builder.

**wger.**
Free, AGPL-3.0, self-hostable with Docker, has an exercise wiki and a REST API, and its Android app is still updated in 2026 ([wger README](https://raw.githubusercontent.com/wger-project/wger/master/README.md), [F-Droid](https://f-droid.org/en/packages/de.wger.flutter/)).
Exercise data carries additional Creative Commons licensing, so check per exercise before reuse.

**Google Health Coach (Fitbit's successor) - the most important finding.**
The Fitbit app has been rebranded Google Health, and the Gemini-based Health Coach launched in India in May 2026 ([Google India blog, 7 May 2026](https://blog.google/intl/en-in/products/hardware/google-health-coach-is-coming-to-india/)).
It sets weekly targets and suggests each day's focus from readiness, progress and local weather, offers guided sessions, and lets you create custom workouts by describing them in plain language ([Google India blog](https://blog.google/intl/en-in/products/hardware/google-health-coach-is-coming-to-india/)).
Plans adjust to training load, readiness score and overnight recovery; for example a low readiness score after bad sleep leads to suggested plan changes ([Google blog, preview](https://blog.google/products/fitbit/personal-health-coach-public-preview/)).
Official India price is Rs 499/mo or Rs 4,999/yr, also bundled with Google AI Pro and Ultra ([Google India blog](https://blog.google/intl/en-in/products/hardware/google-health-coach-is-coming-to-india/)).
Some Indian outlets reported Rs 99/mo or Rs 999/yr, possibly an intro offer, so confirm in the app ([Cashify](https://www.cashify.in/news/fitbit-app-is-now-a-part-of-google-health-get-your-plan-at-just-99)).
Strength sets must be logged manually or by telling the coach ([CG Magazine](https://www.cgmagonline.com/review/fitbit-air-and-google-health-coach/)).
A hands-on review says it pushed back on intense training after several hard days ([Business Standard](https://www.business-standard.com/technology/tech-reviews/google-health-review-fitbit-s-successor-is-ambitious-and-surprisingly-good-126071300611_1.html)).
An earlier TechRadar piece felt it stopped short of the fully adaptive plans of dedicated training apps ([TechRadar](https://www.techradar.com/health-fitness/fitness-apps/google-didnt-show-its-ai-health-coach-in-action-here-are-5-features-i-hope-well-see-when-it-drops)).
Relevance: this already covers "recovery-aware daily focus" using his own Fitbit, which overlaps directly with steps 1-3 of his flow.
What it does not do: one-tap radial UX, fast set logging in the gym, or an Instagram-sourced exercise library.

**SensAI and other 2026 AI coaches.**
SensAI reads HRV, sleep and RHR from Oura, WHOOP (beta), Garmin and Apple Watch and adjusts training ([SensAI](https://www.sensai.fit/blog/best-ai-personal-trainer-apps-2026), vendor-written; [Vora](https://askvora.com/de/blog/best-ai-fitness-coach-app-2026)).
Fitbit is not listed in these sources.
WHOOP and Oura offer AI recovery analysis but are not workout builders ([Asian Efficiency](https://www.asianefficiency.com/technology/best-ai-health-fitness-apps/)).

## 2. Does any app already do most of what he wants?

**Honest answer: no single app does it all, but two pieces exist off the shelf.**

**Piece A - recovery-aware daily session: Google Health Coach.**
He already owns a Fitbit, so for Rs 499/mo he gets readiness-driven daily focus and plain-language custom workouts.
This is the strongest "buy" alternative to steps 1-3 of his flow.
Gaps: chat-first rather than one-tap, manual strength logging, no Instagram library, and no control over the session-building rules.

**Piece B - Instagram reel import: a new wave of "save workouts from reels" apps (2025-2026).**
These apps take a shared Instagram/TikTok/YouTube link and use AI to extract exercises, sets and reps.

- **Stako** (Android, Google Play): reads the caption and the spoken audio of Reels, TikTok and Shorts and builds a workout card; share-sheet or paste link; supports circuits, supersets, AMRAP, EMOM, Tabata; no account, data stored on phone; free tier keeps 5 workouts ([Google Play](https://play.google.com/store/apps/details?id=app.stako)).
  A directory shows it was created on 2026-10-22 with very few downloads ([chrome-stats](https://chrome-stats.com/d/app.stako)).
- **PocketGym: Save Workouts** (Android, Google Play): share or paste a video link, get an editable card of exercises, sets and reps; uses OpenAI and Gemini, AI can be turned off; optional Plus subscription ([Google Play](https://play.google.com/store/apps/details?id=app.spotter.dev)).
- **Repperoo** (listed as iOS and Android on Product Hunt, Play listing not confirmed) ([Product Hunt](https://www.producthunt.com/posts/repperoo)).
- iOS-only so far: RepReel, RepExtract, SÜPAFIT, Stashd, FitSaver, Fitness Vault, Gymdex, Kinex Fit ([RepReel](https://apps.apple.com/app/id6759174613), [RepExtract](https://apps.apple.com/us/app/repextract/id6762238819), [Stashd](https://apps.apple.com/app/id6760226093), [FitSaver](https://apps.apple.com/app/id6756478119)).

Key caveat: I found no independent test of extraction accuracy, and some apps read only the caption, which fails for reels that only show the moves on screen.
These apps save whole workouts from reels; none I found **combine** reel imports with a free exercise DB into a recovery-aware session generator.

**So the unique part of his app is the combination:** one-tap readiness, radial focus choice, rule-based 1-hour session (main block + conditioning finisher + cool-down), a desk-reset routine, and a library that mixes an open DB with his tagged reels.
That combination does not exist in any one app I found.

## 3. Mobility and stretching apps

| App | Fit for 5-10 min desk resets | Price | Praise | Complaints |
|---|---|---|---|---|
| Bend | Good general daily stretch; targeted routines behind Pro | Freemium, Pro subscription | Calm, clean, easy habit | Free daily stretch "thin" and repetitive; hunting for neck/back-specific routines |
| pliability (ex ROMWOD) | Has a "Workforce" desk-worker release (lower/upper back, wrists, knees), but core sessions are long | about $19.99/mo or $179.99/yr (US) | Guided recovery for athletes | CrossFit tone, long sessions, trial/cancel friction |
| StretchIt | Poor: long, floor-based instructor classes | Subscription | Production, progress for committed users | Too advanced, long, steep price |
| GOWOD | Poor: athlete mobility profiling | Subscription for follow-alongs | Individualized, measurable | Poor fit for general users, learning curve |
| Limbr | Built for desk breaks, no floor or equipment, reminders | Free posture reset; Pro for more | n/a | Source is the maker's own blog |

Sources: [Woman and Home](https://www.womanandhome.com/us/health-wellbeing/best-stretching-apps/), [Athletech News on pliability](https://athletechnews.com/product-of-the-week-pliability-stretching-app-review/), [Bustle on Bend](https://www.bustle.com/wellness/bend-stretching-app-review-price-features-subscriptions), [Lifehacker AU on GOWOD](https://www.lifehacker.com.au/?p=1155332), [Adapty on pliability pricing](https://adapty.io/paywall-library/pliability-mobility-recovery/), [Unstar ranked 2026](https://unstar.app/blog/bend-stretchit-pliability-gowod-stretching-apps-ranked-2026) and [Unstar desk apps 2026](https://unstar.app/blog/best-desk-stretching-apps-back-neck-posture-relief-2026) (Unstar makes Limbr, so treat its rankings as biased).

Lessons for his desk-reset routine:

- Recurring 1-3 star themes: routines built as workouts are too long for a desk break, useful targeted content is paywalled, and streaks push people to quit after a missed day ([Unstar](https://unstar.app/blog/best-desk-stretching-apps-back-neck-posture-relief-2026)).
- Desk resets should be chair/standing friendly, work in office clothes, need no mat, and run hands-free with a timer and audio/vibration cues.
- Targeted entry points (neck, upper back, hips, wrists) beat a generic catalog.
- He already has a known routine, so the main value is a hands-free timer with his own moves, not a content library.

## 4. UX patterns worth borrowing for "fast and minimal"

### Starting a session

- **"Today's workout is already on the home screen"** (Fitbod): the app opens to a ready session, so start is one tap. His radial menu can match this: check-in tap + focus tap = 2 taps to a built session.
- **Readiness check-in before the session** (JuggernautAI): proven concept, but cut it to one 3-state tap, and pre-select the suggested state from Fitbit sleep data so it is often just a confirm.
- **Pushing back on bad days** (Google Health Coach): when he taps "wrecked", the menu should lead with mobility/zone-2/light options rather than hiding hard options entirely.

### In-workout logging (Strong / Hevy pattern)

- Each set row is pre-filled with the last session's weight and reps (shown as "previous"), so a normal set is **one tap on the checkmark**.
- Only edit when something changed; use +/- steppers or a quick number pad, not a full keyboard.
- Checking a set **auto-starts the rest timer**.
- Bodyweight and timed moves (planks, intervals, stretches) log as a duration with a countdown, not weight x reps.
- For circuits and finishers, log the whole round with one tap rather than per exercise (Stako supports AMRAP/EMOM/Tabata structures for this reason).

### Rest timer

- Auto-start on set completion, per-exercise default duration, +/-15 s and skip controls, vibration plus sound at zero (Hevy pattern, [Hevy help](https://help.hevyapp.com/hc/en-us/articles/35649846517399-How-to-Use-Hevy-s-Live-Activity-on-iOS-and-Android)).

### Exercise swapping

- One action on the exercise opens a short list of alternatives for the same muscle/pattern and equipment.
- Fitbod-style "recommend more / less / never" feedback lets the generator learn without settings screens ([Fitbod blog](https://fitbod.me/blog/recommend-more-less-exclude/)).
- For him, swaps should surface his tagged Instagram moves first when they match the slot.

### Android lock screen and notification controls

- A persistent ongoing notification showing current exercise, set, and rest countdown, with actions "Complete set", "+15 s", "Skip" (Hevy does this on Android and iOS, on the free tier).
- On Android this is a foreground-service notification; newer Android versions also offer "live update" style promoted notifications, worth checking for the target OS version.
- Goal: during a set he never needs to unlock the phone.

### Fast open

- Local-first data (Stako stores everything on the phone with no account) avoids login screens and network waits at the gym.
- No splash screen, no feed, no social layer.

## 5. Common failure modes that make people quit

1. **Logging friction.** Redditors consistently complain about apps that take too many steps per set; fewer taps per set means people actually log every set ([setgraph](https://setgraph.app/ai-blog/workout-tracker-app-reddit), vendor-written but consistent with the Strong/Hevy praise).
2. **Low usage, then the subscription feels wasted.** "Not enough usage" is the top cancellation reason across subscription apps at 37% ([RevenueCat](https://www.revenuecat.com/blog/growth/not-enough-usage-churn)).
   About 69% of fitness apps are abandoned within 90 days, per industry data cited in a 2024 scoping review ([JMIR / PMC scoping review](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11694054/)).
3. **Discouraging or unreachable app-set goals, and shame.** An October 2025 British Journal of Health Psychology study found users discouraged by app-determined goals they could not reach ([eMarketer](https://www.emarketer.com/content/ai-will-power-next-phase-of-health-app-growth), secondary reporting).
4. **Streak mechanics.** A missed day breaks the streak and the user quits ([Unstar](https://unstar.app/blog/best-desk-stretching-apps-back-neck-posture-relief-2026)); notification pressure ("close your rings") also drives people away ([Fortune](https://www.fortune.com/well/2025/01/24/apple-watch-bullied-burn-calories-close-rings-obsession-fitness-trackers-notifications)).
5. **Generator distrust.** Repetitive or odd exercise choices, too many options, or plans that feel generic ([onclarity on Fitbod](https://www.onclarity.com/leaderboard/insight/fitbod)).
6. **Sessions that do not fit real life.** Routines that are too long or need a floor, mat or equipment that is not available ([Unstar](https://unstar.app/blog/bend-stretchit-pliability-gowod-stretching-apps-ranked-2026)).
7. **Paywall creep and billing friction.** Free features moved to paid tiers (Boostcamp), trials auto-converting (StretchIt, Alpha Progression).
8. **Data overload.** People who already know what helps them stop wanting constant feedback ([ex-WHOOP user](https://kaitmalthaner.squarespace.com/blog/why-i-stopped-using-whoop-after-5-years), [Digital Trends](https://digitaltrends.com/health-fitness/why-fitness-trackers-are-losing-popularity)).

Failure modes that matter most for a solo personal app: the generator producing sessions he does not trust, too much setup (tagging reels becomes a chore), and the app becoming a project he maintains instead of a tool he uses.

## 6. Technical notes relevant to building

- **Exercise DB:** [free-exercise-db](https://github.com/yuhonas/free-exercise-db) has 800+ exercises as JSON with images under the Unlicense (public domain), though one open issue questions image licensing for commercial use; fine for personal use.
  [wger](https://raw.githubusercontent.com/wger-project/wger/master/README.md) is an alternative with an API and CC-licensed data.
- **Fitbit data access is in flux.** The legacy Fitbit Web API loses support on 2026-09-30 and is being turned off around late October / early November 2026, with integrations required to move to the new Google Health API ([Google Health API](https://developers.google.com/health/about)).
  Sources conflict on the exact turn-off date, and sleep score support is unconfirmed ([Fitbit community](https://community.fitbit.com/t5/Web-API-Development/Introducing-the-next-phase-of-the-Fitbit-Web-API/m-p/5828051)).
- **Health Connect on-device** is the simpler route on Android: sleep, heart rate and resting heart rate are widely reported to sync from Fitbit / Google Health, while HRV sync is inconsistent across sources ([Google support](https://support.google.com/googlehealth/answer/14236613), [Android Authority](https://androidauthority.com/google-health-connect-3164755)).
  An April 2026 thread reports Fitbit exercise data stopped syncing to Health Connect ([Fitbit community](https://community.fitbit.com/t5/Android-App/Exercise-data-no-longer-synching-to-Health-Connect/td-p/5824599)).
  Do not depend on Fitbit readiness score being readable; design the one-tap check-in as the source of truth and use sleep duration only as a hint.
- **Reel import:** existing apps use caption text plus audio transcription plus an LLM. For a personal app, a lighter approach is share-sheet capture of the URL, a manual or LLM-suggested tag set, and a link back; no video processing needed.

## 7. Build vs buy conclusions

**Buy-only option (lowest effort):** Google Health Premium (Rs 499/mo) for readiness-aware daily focus, plus Hevy free for fast logging with lock-screen controls, plus a reel-saver (Stako or PocketGym) for Instagram ideas.
Cost: about Rs 5,000/yr plus maybe a reel-saver subscription.
Downsides: three apps, no radial one-thumb flow, no single library, the coach's session rules are a black box, and the Instagram moves never flow into generated sessions.

**Build option:** justified, because the value is the specific combination and the speed, not any single feature.
The hardest pieces (exercise data, set logging patterns, rest timer notifications) are well-understood and well-documented.
The risky pieces are the session generator quality and the Fitbit data access, both manageable if the generator is simple, rule-based and editable, and if readiness comes from the one-tap check-in.

**Recommendation:** build, but keep v1 small, and use bought tools as a benchmark.

- Before building, spend 1-2 weeks using Google Health Coach (he may already have a trial via his Fitbit) and Hevy, to learn what he actually misses.
- v1 scope: check-in, radial focus menu, rule-based session builder from free-exercise-db, Hevy-style logging with a lock-screen notification, and the desk-reset timer.
- v2: Instagram share-sheet capture with tags and link-back, then optional sleep hint from Health Connect.
- Avoid: streaks, social, AI chat, cloud accounts, and any setup step that is not one tap.

## 8. Shortlist of ideas to borrow

1. **Ready-to-go session on open** (Fitbod): 2 taps from launch to first set (check-in + radial focus).
2. **Pre-filled sets with one-tap completion** (Strong / Hevy): previous weight and reps shown, checkmark logs it, steppers for changes.
3. **Rest timer auto-start plus lock-screen notification controls** (Hevy): complete set, +15 s, skip, all without unlocking.
4. **Readiness gate before the session** (JuggernautAI, Google Health Coach): reduced to one 3-state tap that shapes the radial options and pushes back gently on "wrecked" days.
5. **Share-sheet reel capture** (Stako, PocketGym): share from Instagram into the app, tag the move, keep the link back to the original post.
6. **"More / less / never" feedback on exercises** (Fitbod): tunes the generator without a settings screen.
7. **Programs as editable data** (Liftosaur): session templates (main block, finisher, cool-down) stored as simple rules he can tweak.
8. **Round-based logging for finishers** (Stako's AMRAP/EMOM/Tabata structures): one tap per round, not per exercise.
9. **Short, targeted, hands-free desk resets** (pliability Workforce, Limbr): chair/standing friendly, no mat, audio and vibration cues, entry by body area.
10. **Local-first, no account** (Stako): instant open, works offline at the gym.

## Sources

All sources are linked inline above.
Vendor-written or competitor-written comparisons are flagged where used.
