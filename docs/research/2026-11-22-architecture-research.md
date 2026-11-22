**Date**: 2026-11-22
**Content Type**: Research

# Workout App - Architecture Research

## Summary

The best fit is a variant of option A, called "A+" below.
The app stays fully offline and rule-based on the phone.
Two changes make the Instagram inbox much less painful: a one-tap manual triage at share time, and a PC "enrich" script that you can run on a schedule.
An optional weekly planning step lets Claude adjust the plan offline from the PC, so the phone never waits on a network call.
Option B's "instant tagging" turns out to be mostly an illusion, because the Android share intent only hands the app a URL.
Fetching the video and caption behind that URL needs your logged-in Instagram cookies, and that only works well on the PC.
Option C (Claude builds every session at runtime) works against the main goals: speed, offline use, and predictable sessions.

## Constraints that drive the decision

- One user, one Android phone, no app store release, no multi-device sync.
- Opening the app and starting a session must be instant, so nothing on that path can wait on the network.
- Reuse langocard's stack: Expo 54, expo-router 6, Reanimated 4.1, gesture-handler 2.28, zustand 5, AsyncStorage, Jest (checked in `F:\newprojects\langocard\package.json`).
- Videos are never re-hosted; the app stores links, tags and maybe a thumbnail.

## 1. Architecture options

### Why B's instant tagging does not really work

When you share an Instagram post to an app, Android gives the app a `text/plain` intent that holds the post URL.
It does not include the video, and usually not the caption either.
To tag the post, something has to fetch the caption and video from Instagram.
Instagram now often requires a logged-in session for that, and yt-dlp's Instagram extractor relies on browser cookies ([yt-dlp releases](https://github.com/yt-dlp/yt-dlp/releases), [techearl guide](https://techearl.com/download-instagram-reel)).
A phone app or a cloud function would need your Instagram session cookies to do this.
That is fragile, and calls from a datacenter IP raise the risk of your account getting flagged.
So under B, the Claude call would mostly see a bare URL, which is not enough to tag it.
B also puts an API key inside the APK, where anyone with the file can extract it.
For a sideloaded personal app that risk is small, but it is still a key you would rather not ship.

### Options compared

| Option | Speed and offline use | Tag quality | Complexity | Verdict |
|---|---|---|---|---|
| A - offline app, PC tagging, inbox | Best | Best (video plus caption on the PC) | Low | Good base |
| B - app calls Claude directly | Same as A to open; tagging needs the network | Poor (URL only) | Medium; key sits in the APK | Drop |
| C - Claude builds each session | Network wait at session start; fails offline | Varies; results are not repeatable | Medium | Drop |
| A+ - A plus one-tap triage, scheduled PC enrich, optional weekly Claude plan | Best | Best | Low to medium | **Recommended** |
| Serverless proxy (Cloudflare Worker or Supabase Edge Function) holding the key | Same as B | Still URL-only unless it holds Instagram cookies | Medium | Solves the key problem but not the content problem; keep it in reserve |
| On-device ML (local vision or LLM model) | Fine | Weak for naming exercises from video | High | Drop |
| Fork an existing app (wger, Liftosaur) | Varies | n/a | High to customise | Drop, but borrow ideas |

### Notes on the options I dropped

- **Serverless proxy.**
  A Cloudflare Worker or Supabase Edge Function that holds the API key fixes B's security problem cheaply.
  It does not fix the missing content.
  It only becomes worth having if you later want tagging from text you type in the app ("hip flexor stretch, couch"), which Claude Haiku could handle in under a second.
  Keep it as an add-on if inbox lag ever turns out to matter.
- **On-device ML.**
  Telling apart a "Cossack squat" and a "lateral lunge" from a reel is beyond the small models that run on a phone, and it would bloat the app.
  It brings no benefit over running Claude on the PC.
- **wger.**
  wger is server-centric Django/Flutter software, licensed AGPL-3.0, with Creative Commons exercise data ([wger README](https://raw.githubusercontent.com/wger-project/wger/master/README.md)).
  Its stack and UX are far from the radial, Reanimated-driven feel you want.
  Its exercise data is useful as a source (see section 6).
- **Liftosaur.**
  Liftosaur is an AGPL-3.0 TypeScript PWA built around "Liftoscript", a scriptable progression language ([GitHub](https://github.com/astashov/liftosaur), [site](https://liftosaur.com/)).
  It focuses on barbell programming, not on recovery-aware full-body plus conditioning plus mobility sessions.
  The idea worth borrowing is a declarative progression rule per exercise.
- **Claude-generated weekly plan (kept, as an option inside A+).**
  This is the useful part of C without its costs.
  A PC script exports workout history and check-ins as JSON.
  Claude (Sonnet 5.5 or Opus 5.5) proposes next week's focus rotation and tweaks to the rules (volume per muscle, conditioning share) as a JSON file.
  The phone imports that file, and the on-device builder still assembles each actual session instantly.

### Recommended design (A+)

1. **Bundled library.**
   free-exercise-db JSON (about 870 exercises) plus `instagram.json` from the PC pipeline, loaded into SQLite on first launch or after an import.
2. **Session builder on the device.**
   This is pure TypeScript and is easy to unit-test with Jest.
   Inputs: recovery check-in, recent volume per muscle group (last 7 days), equipment available, focus picked from the radial menu.
   Output: warm-up, then strength blocks, then conditioning finisher, then cool-down stretches (about 60 minutes), with time estimates per block.
   A separate generator builds the 5-10 minute "desk reset" from mobility and stretch tags (neck, thoracic spine, hip flexors, wrists).
   Use a seeded random choice among exercises that score equally, so sessions vary but can be reproduced in tests.
3. **Share-sheet inbox with one-tap triage.**
   When a post is shared, the app saves the URL right away and shows the radial menu once: "mobility / stretch / strength-upper / strength-lower / conditioning / skip".
   That single tap makes the post usable in sessions straight away, as a placeholder exercise that links back to the post.
4. **PC enrich script, scheduled.**
   It reads new inbox URLs (exported from the app as a file, or from a synced folder), runs yt-dlp with cookies, extracts keyframes plus a local Whisper transcript, and sends them to Claude for structured tagging.
   It writes an updated `instagram.json`, and the app imports it.
   Windows Task Scheduler can run it weekly, so "until the PC script is run again" becomes "within a week" with no effort on your part.
5. **Optional weekly plan** from Claude, as described above.
6. **Health Connect, later.**
   Read sleep, HRV and resting heart rate to pre-fill the recovery check-in.
   The one-tap check-in stays as the override.

Claude API notes (pricing as of 2026-11 per Anthropic's model list): Claude Haiku 5.5 costs $0.10 input and $0.50 output per million tokens, and Sonnet 5.5 costs $2 and $10.
The Messages API takes images and PDFs but not video files, so the script must send sampled frames plus the caption and transcript.
Rough cost: 500 posts at about 10k tokens each is about 5M input tokens, which is roughly $0.50 on Haiku 5.5 or $10 on Sonnet 5.5.
The Batch API halves that again.
Use structured outputs (a JSON schema) so the tags land straight in your data model.

## 2. Local storage for Expo 54

| Option | Fit | Notes |
|---|---|---|
| **expo-sqlite** | **Recommended** | First-party, ships with the SDK, has a sync and async API, works with Drizzle ORM. Its docs list Expo Go support, which helps for quick iteration ([Expo SQLite docs](https://docs.expo.dev/versions/latest/sdk/sqlite.md)). |
| op-sqlite | Not needed | JSI-based and faster in the author's 2023 benchmarks ([ospfranco](https://ospfranco.github.io/post/2023/11/09/sqlite-for-react-native,-but-5x-faster-and-5x-less-memory/)). An independent check found little difference ([Medium](https://medium.com/@lukasz.kurant/real-use-of-react-native-op-sqlite-with-typeorm-and-performance-questions-c19491b945d4)), and PowerSync found the libraries similar on iOS and mixed on Android ([PowerSync](https://powersync.com/blog/react-native-database-performance-comparison)). It needs a dev build. |
| WatermelonDB | Overkill | Built for lazy loading of large data and sync to a backend; neither applies here. |
| AsyncStorage / MMKV | Settings only | Fine for preferences and UI state. Storing history as JSON blobs makes queries like "volume per muscle over the last 7 days" awkward. |

At about 1000 exercises plus a few thousand logged sets, any of these is fast.
The deciding factors are first-party support and SQL queries over history, which points to expo-sqlite.
A practical pattern: load the exercise table into a zustand store at startup (a few hundred KB), and write history to SQLite.
Keep AsyncStorage for small preferences, as in langocard.
Confidence: high.

## 3. Receiving Android share intents in Expo 54

- **expo-share-intent** (community package by achorein) is the established choice.
  Version 5.x maps to SDK 54 ([npm](https://npmjs.com/package/expo-share-intent), [GitHub](https://github.com/achorein/expo-share-intent)).
  It is set up through a config plugin, needs a dev client (not Expo Go), and needs `expo-linking`.
  The repo notes that it needs `patch-package` for SDK versions below 55 ([repo docs index](https://docsearch.algolia.com/mcp/docs/repo/achorein/expo-share-intent)).
  By default it accepts only text and URL shares, which is exactly what Instagram sends.
- **First-party alternative.**
  Newer `expo-sharing` versions can receive shares, through the `useIncomingShare()` hook, `getSharedPayloads()`, an `android.enabled` plugin option, and an expo-router `+native-intent.ts` handler.
  Expo marks this "currently experimental" ([expo-sharing docs, v58](https://docs.expo.dev/versions/latest/sdk/sharing/)).
  The type is marked `@experimental` in expo-sharing 56.0.15 ([source](https://cdn.jsdelivr.net/npm/expo-sharing@56.0.15/src/Sharing.types.ts)).
  I could not confirm that the receiving API exists in SDK 54's expo-sharing.
- **Gotchas.**
  - Test both cold start and warm start; the app may already be open when you share.
  - expo-router can try to route the incoming intent as a deep link; handle it in `+native-intent` or the provider so you do not get a "not found" screen.
  - Instagram shares a URL with tracking query parameters (`?igsh=...`); normalise it to the `/p/<id>/` or `/reel/<id>/` form before checking for duplicates.
  - Each config-plugin change needs a clean prebuild and a native rebuild.
- **Note on the Expo version.**
  As of today the current Expo SDK is 58 ([docs](https://docs.expo.dev/versions/latest/sdk/sharing/)).
  Staying on 54 keeps you on the same versions as langocard, so you can copy the radial menu without changes.
  Starting a new app on the latest SDK would give you the first-party share receiving and a longer support window.
  This is worth a quick decision before the project starts.

Confidence: medium-high for expo-share-intent on SDK 54; medium for the first-party route.

## 4. Health Connect and Fitbit

- **Library.**
  `react-native-health-connect` (matinzd) is the standard bridge; it needs `minSdkVersion` 26 and a dev build ([GitHub](https://github.com/matinzd/react-native-health-connect), [npm](https://npmjs.com/package/react-native-health-connect)).
  The repo's migration notes say the Expo config plugin now ships inside the main package, replacing the separate `expo-health-connect` package ([releases](https://github.com/matinzd/react-native-health-connect/releases)).
  Check which major version supports SDK 54 when you get to this step.
- **What Fitbit writes.**
  The Fitbit app was renamed the Google Health app in May 2026 ([Google support](https://support.google.com/googlehealth/answer/17068213)).
  Google lists the types it writes to Health Connect, including sleep session, sleep stages, heart rate, HRV, resting heart rate, exercise and steps ([Google Fitbit help](https://support.google.com/fitbit/answer/14506680?hl=en)).
  **The readiness score is not on that list**, so you cannot read Fitbit's readiness directly.
- **Implication.**
  Compute your own recovery hint from last night's sleep duration and stages plus HRV and resting heart rate against a 14-day baseline.
  Use it to pre-select good/OK/wrecked, with your tap still deciding.
- **Reliability.**
  Fitbit community threads report sleep not syncing to Health Connect at times, including a January 2026 report from the public preview ([thread](https://community.fitbit.com/t5/Android-App/Fitbit-app-not-syncing-Health-Connect-sleep-data/td-p/5734429), [thread](https://community.fitbit.com/t5/Third-Party-Integrations/Fitbit-not-syncing-sleep-with-health-connect/td-p/5789880)).
  Treat Health Connect data as optional input, never as a hard dependency.
- The Fitbit Web API was retired on 2026-10-30, so Health Connect is now the only practical route on Android ([Google support](https://support.google.com/googlehealth/answer/14236613?hl=en-GB)).

Confidence: high on the data types; medium on day-to-day sync reliability.

## 5. Instagram export and yt-dlp

### What the "Saved" export contains

- Request it in JSON format, not HTML, via Your activity, then Download your information ([Instagram help](https://help.instagram.com/ipad-app/181231772500920)).
- `saved_posts.json` holds entries under `saved_saved_media`.
  Each entry has `title` (the creator's username) and `string_map_data["Saved on"]` with an `href` (post URL) and a Unix `timestamp` of when you saved it ([ContextBolt guide](https://contextbolt.com/blog/instagram-saved-posts/)).
- **There are no captions, no media and no comments.**
  Captions have to be fetched separately.
- Collections are in `saved_collections.json`.
  If you sorted saves into collections such as "mobility", that is a free hint for tagging.
- Field names may vary between exports, so check one real file before writing the parser.

### yt-dlp in 2026

- The Instagram extractor was reworked in 2026, and yt-dlp now detects when cookies have been invalidated ([yt-dlp releases](https://github.com/yt-dlp/yt-dlp/releases)).
- Expect `401` or "login required" errors when the cookies go stale.
  The usual fix is `--cookies-from-browser firefox` after logging in to Instagram in Firefox ([techearl](https://techearl.com/download-instagram-reel)).
  Firefox is the safer choice on Windows, because cookie extraction from Chrome has long been hampered by Chrome's app-bound cookie encryption.
- Some failures come from a missing impersonation dependency rather than login problems ("no impersonate target is available").
  Install yt-dlp's impersonation extras, which use curl_cffi ([Seal issue](https://github.com/JunkFood02/Seal/issues/2566)).
- yt-dlp can write metadata only (`--write-info-json --skip-download`), which captures the caption, uploader and duration without downloading the video.
  Download the video only when you need frames.
- Throttle requests (`--sleep-requests`, `--sleep-interval`) and run in small batches.
  Pulling hundreds of posts in a burst with your own account's cookies risks a temporary block.
- Delete downloaded videos after tagging; keep only the tags, the URL and maybe one thumbnail for your own use.
- Fallback if yt-dlp breaks: `instaloader` or `gallery-dl`, which work from the same cookies.

Confidence: medium.
Instagram changes often, which is one more reason to keep the scraper off the phone.

## 6. Exercise databases

| Source | Size | License | Media | Fields | Verdict |
|---|---|---|---|---|---|
| **yuhonas/free-exercise-db** | About 870 | Unlicense (public domain) | 2 JPG stills per exercise | `name, force, level, mechanic, equipment, primaryMuscles[], secondaryMuscles[], instructions[], category, images[]` | **Base** ([GitHub](https://github.com/yuhonas/free-exercise-db)) |
| wger | Several hundred in curated languages | Creative Commons per entry (often CC-BY-SA 4.0); code AGPL | Images and some videos, of varying quality | Muscles, equipment, category, translations | Optional supplement; you must show attribution per item ([README](https://raw.githubusercontent.com/wger-project/wger/master/README.md), [FSF entry](https://directory.fsf.org/wiki/Wger)) |
| ExerciseDB (now AscendAPI) | 1500 in the free V1; 11k+ in V2 | No clear open license; commercial provider with its own terms of use | Animated GIFs | bodyPart, target, equipment, secondary muscles | Avoid bundling it; the licensing is unclear ([exercisedb.dev](https://exercisedb.dev/), [V2 notes](https://exercisedb.notion.site/Table-of-Contents-1a6983b728ca80b69e85c5c74133220e)) |

Notes:

- free-exercise-db has a `stretching` category and enough strength coverage for full-body sessions.
  Its mobility and "desk reset" coverage is thin, and that is exactly where your Instagram saves will help.
- Its muscle names (for example "abdominals", "lats", "middle back", "lower back") are a fixed set.
  Make it your canonical taxonomy, and have the Claude tagging step map onto those same values.
- The images are stills rather than animations.
  For a fast, minimal app, that is a plus: they are small and load instantly.
  Bundle downsized WebP versions, or just the first frame.
- Add your own fields: `isConditioning`, `isDeskFriendly`, `jointStress` and `timeCost`.
  The session builder needs them, and none of the databases has them.

Confidence: high.

## Risks and open questions

- Expo SDK version choice (54 to match langocard, or the latest for first-party sharing and a longer support window).
- How often your Instagram cookies go stale, and whether Instagram flags the account; this only matters during the one-off import.
- Whether you want a cloud piece at all; A+ needs none.
- Fitbit-to-Health-Connect sleep reliability on your device; test it early before building around it.

## Recommendation

Build **A+**: a fully offline Expo app with expo-sqlite and a deterministic session builder in TypeScript.
Shared posts go into an inbox with one-tap triage through the radial menu.
A scheduled PC script (yt-dlp with Firefox cookies, then frames plus Whisper transcript, then Claude Haiku 5.5 with structured output) enriches the library.
Add an optional weekly Claude plan file, imported by the phone, as the controlled form of "AI-designed training".
Use free-exercise-db as the base library and taxonomy, and expo-share-intent 5.x for sharing on SDK 54.
Add Health Connect later, only as a pre-fill for the check-in and not as the readiness source.
Drop B and C, and keep a Cloudflare Worker proxy in reserve in case typed-text tagging from the phone is ever wanted.

**Confidence: high (about 80%)** that A+ is the right overall shape.
It is medium on the details that depend on fast-moving third parties: Instagram scraping, Fitbit sync reliability, and whether first-party Expo share receiving is mature enough to replace expo-share-intent.
