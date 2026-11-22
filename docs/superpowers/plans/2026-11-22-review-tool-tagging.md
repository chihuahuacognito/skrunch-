**Date**: 2026-11-22
**Content Type**: Implementation Plan

# Review Tool Tagging Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the review page's free tags with the approved Muscles / Type / Purpose dropdowns, add decision import for future reviews, move the 19 uncollected fitness posts into the main review group, and add the two builder rules to the main design doc.

**Architecture:** `build_review.py` reads the parsed export plus a new `vocab.json` (single source of truth for the lists), computes groups and caption guesses, and inlines the data, the vocab and a new pure-logic file `review_logic.js` into `review_template.html`, producing a single self-contained `review.html`.
All non-DOM logic (store migration, import merge, purpose matching, export) lives in `review_logic.js` so it can be unit-tested with `node --test`. The template keeps only DOM code.

**Tech Stack:** Python 3.14 + pytest 9 (build script), plain browser JS, Node 25 `node:test` (logic tests), headless Edge `--dump-dom` (UI self-test, as already used in this project).

**Spec:** `docs/superpowers/specs/2026-11-22-review-tool-tagging-design.md`

## Global Constraints

- Output stays one self-contained file `saved/review.html` that works from `file://` with no server and no external scripts.
- Muscles list, exactly: abdominals, abductors, adductors, biceps, calves, chest, forearms, glutes, hamstrings, lats, lower back, middle back, neck, quadriceps, shoulders, traps, triceps, hip flexors, thoracic spine.
- Type list, exactly: strength, conditioning, mobility, stretch, stability.
- Purpose starter list, exactly: hip flexors / sitting stiffness, lower back comfort, desk breaks, wrists, knees, shoulder health.
- Changing tags, decisions or notes must never reload the Instagram iframe (current behaviour, verified by the existing self-test; keep it).
- Keyboard shortcuts (K, D, U, V, arrows, J, L) are ignored while typing in any input or textarea, or while a dropdown is open.
- Existing browser progress (localStorage key `ig-review-v1`) must carry over: decisions, notes and moves are kept unchanged; tags migrate per Task 2.
- The project is not a git repo yet. Commit steps apply only if the owner agrees to `git init` before execution; otherwise skip them.
- Never use the em dash in UI copy or docs.

## Review Focus

- Importing the earlier v1 export (a plain JSON array of records with `tags`) must work, not only the new v2 format. Pinned in Task 2 (`mergeImport accepts v1 array`).
- Importing a file that is not valid JSON or not a recognised shape must show an error message and leave progress untouched. Pinned in Task 2 (`parseImport rejects garbage`) and Task 3 self-test.
- Typing "Lower back comfort " (different case, trailing space) into Purpose add-new must select the existing value, not create a duplicate. Pinned in Task 2 (`matchPurpose normalises`).
- Pressing K or D while a dropdown is open must not keep/discard the post; Escape or an outside click closes the dropdown without reloading the video. Pinned in Task 3 self-test.
- A post with no guesses and nothing confirmed must export empty arrays with `confirmed: false`, not missing keys. Pinned in Task 2 (`exportRecords shape`).

---

### Task 1: Vocab file and build script groups and guesses

**Files:**
- Create: `saved/vocab.json`
- Modify: `saved/build_review.py`
- Test: `saved/tests/test_build_review.py`

**Interfaces:**
- Produces: `vocab.json` = `{"muscles": [...19], "types": [...5], "purposes": [...6]}` (Global Constraints values, in that order).
- Produces: in `build_review.py`, importable without side effects (move the CLI into `main()` under `if __name__ == "__main__"`):
  - `group_of(post_id: str, collections: list[str]) -> str` returning `"fitness"`, `"uncollected"` or `"other"`.
  - `guess(caption: str, rules: dict[str, str]) -> list[str]` (regex per value, case-insensitive, result in vocab order).
  - `MUSCLE_RULES`, `TYPE_RULES`, `PURPOSE_RULES: dict[str, str]` whose keys are exactly vocab values (subset allowed).
  - `build_items(parsed: dict) -> list[dict]`; each item has keys `id, url, owner, time, collections, group, suggest, caption, listed, note, guess: {"muscles": [...], "types": [...], "purposes": [...]}`.
  - `render(items, vocab, template_html, logic_js) -> str` replacing the placeholders `/*DATA*/[]`, `/*VOCAB*/{}` and `/*LOGIC*/`.

- [ ] **Step 1: Write the failing tests**

```python
def test_uncollected_fitness_joins_main_group():
    assert group_of("DSSS2V7DzGs", []) == "fitness"      # coachkeg single-leg RDL

def test_uncollected_nonfitness_stays_out():
    for pid in ["DXok51Qj-L6", "DSFXZ8nEuNe", "DST3xZGj9LJ", "DNPbB53vPZO", "DScG801gvZZ"]:
        assert group_of(pid, []) == "uncollected"

def test_other_collections():
    assert group_of("x", ["food"]) == "other"
    assert group_of("x", ["food", "mobility"]) == "fitness"

def test_rule_keys_are_vocab_values():
    vocab = json.load(open(VOCAB))
    assert set(MUSCLE_RULES) <= set(vocab["muscles"])
    assert set(TYPE_RULES) <= set(vocab["types"])
    assert set(PURPOSE_RULES) <= set(vocab["purposes"])

def test_guesses():
    assert "hip flexors" in guess("Sitting all day? Your hip flexors get tight", MUSCLE_RULES)
    assert "stretch" in guess("Hold this stretch for 30s", TYPE_RULES)
    assert "lower back comfort" in guess("LOW BACK PAIN? 3 exercises", PURPOSE_RULES)
    assert "hip flexors / sitting stiffness" in guess("anterior pelvic tilt drill", PURPOSE_RULES)
    assert guess("", MUSCLE_RULES) == []

def test_counts_on_real_export():
    items = build_items(json.load(open(PARSED, encoding="utf-8")))
    groups = Counter(i["group"] for i in items)
    assert groups == {"fitness": 139, "uncollected": 5, "other": 51}

def test_render_inlines_everything():
    html = render([{"id": "a</script>"}], {"muscles": []}, "D=/*DATA*/[];V=/*VOCAB*/{};/*LOGIC*/", "LOGIC_OK")
    assert "LOGIC_OK" in html and "</script>" not in html and "/*DATA*/" not in html
```

(`VOCAB` and `PARSED` are paths next to the script: `saved/vocab.json`, `saved/saved_parsed.json`. 139 = 120 fitness + 19 uncollected fitness.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd saved && python -m pytest tests/test_build_review.py -q`
Expected: FAIL (ImportError on `group_of` etc.).

- [ ] **Step 3: Implement**

`NONFIT_UNCOLLECTED` stays the 5 ids above; every other uncollected post is `"fitness"`. `suggest` is `"discard"` for `other` and the 5 non-fitness ids, else `None`.
Rule regexes: reuse the current `MUSCLE` patterns re-keyed to vocab names (core to abdominals, hips to hip flexors, upper back split into lats `\blats?\b|pull ?-?down|pull ?-?up|pullover` and middle back `\brows?\b|face pull|mid back|rhomboid|swimmer`, legs split into quadriceps `squat|lunge|quad|leg press|step ?up` and hamstrings `\brdl\b|deadlift|hamstring|leg curl`, posture to thoracic spine `thoracic|t-?spine|open ?book`, add calves `calf|calves`, neck `\bneck\b`). Type and purpose rules from the current `TYPE` dict and these purpose keywords: hip flexor / pelvic tilt / sitting; back pain / lower back / low back; desk / sitting all day / posture; wrist; knee; shoulder pain / rotator / shoulder health.
`main()` reads `saved_parsed.json`, `vocab.json`, `review_template.html`, `review_logic.js` from the script's own folder and writes `review.html`.

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd saved && python -m pytest tests/test_build_review.py -q`
Expected: 7 passed.

- [ ] **Step 5: Commit**

```bash
git add saved/vocab.json saved/build_review.py saved/tests/test_build_review.py
git commit -m "feat(review): vocab file, new groups and caption guesses"
```

---

### Task 2: Pure logic module

**Files:**
- Create: `saved/review_logic.js`
- Test: `saved/tests/review_logic.test.mjs`

**Interfaces:**
- Consumes: item shape and vocab shape from Task 1.
- Produces (plain functions on `globalThis.ReviewLogic`, and also `module.exports` when `module` exists, so the browser inline and `node --test` both work):
  - `emptyStore() -> Store` where `Store = {version: 2, decisions: {}, notes: {}, moves: {}, tags: {muscles: {}, types: {}, purposes: {}}, extraPurposes: [], importedIds: [], group: "fitness", status: "all", embed: true, cur: null}`. `tags.<dim>[id]` present means confirmed by the owner.
  - `migrateV1(old: object) -> Store`.
  - `tagsOf(item, store, dim) -> {values: string[], confirmed: boolean}` (falls back to `item.guess[dim]`).
  - `matchPurpose(query: string, list: string[]) -> {exact: string | null, matches: string[]}` (trim, lowercase, collapse spaces; `matches` = substring hits).
  - `parseImport(text: string) -> {records: Record[], purposes: string[]}`; throws `Error("Not a review export")` on bad JSON or unknown shape.
  - `mergeImport(store, parsed) -> Store` (returns a new store).
  - `exportRecords(items, store, vocab) -> {version: 2, exportedAt: string, vocab: {muscles, types, purposes}, records: Record[]}` where `Record = {id, url, owner, collections, decision, muscles, musclesConfirmed, types, typesConfirmed, purposes, purposesConfirmed, captionListsMoves, moves, note, caption}` and `vocab.purposes` = starter list plus `extraPurposes`.

- [ ] **Step 1: Write the failing tests** (`node:test` + `node:assert/strict`)

```js
test('migrateV1 keeps decisions, notes, moves', () => {
  const s = migrateV1({ decisions: {a: 'keep'}, notes: {a: 'n'}, moves: {a: 'bird dog'} });
  assert.deepEqual([s.decisions, s.notes, s.moves], [{a: 'keep'}, {a: 'n'}, {a: 'bird dog'}]);
  assert.equal(s.version, 2);
});
test('migrateV1 maps old tags', () => {
  const s = migrateV1({ tags: {a: ['core', 'legs', 'upper back', 'posture', 'desk reset', 'gym', 'pelvic tilt']}, custom: ['pelvic tilt'] });
  assert.deepEqual(s.tags.muscles.a, ['abdominals', 'quadriceps', 'hamstrings', 'middle back', 'lats']);
  assert.deepEqual(s.tags.purposes.a, ['desk breaks', 'pelvic tilt']);
  assert.ok(!('a' in s.tags.types));
  assert.deepEqual(s.extraPurposes, ['pelvic tilt']);
});
test('tagsOf falls back to guess', () => {
  const item = { id: 'a', guess: { muscles: ['glutes'], types: [], purposes: [] } };
  assert.deepEqual(tagsOf(item, emptyStore(), 'muscles'), { values: ['glutes'], confirmed: false });
});
test('matchPurpose normalises', () => {
  const r = matchPurpose('  Lower back COMFORT ', ['lower back comfort', 'knees']);
  assert.equal(r.exact, 'lower back comfort');
  assert.deepEqual(matchPurpose('back', ['lower back comfort', 'knees']).matches, ['lower back comfort']);
});
test('parseImport rejects garbage', () => {
  assert.throws(() => parseImport('not json'), /Not a review export/);
  assert.throws(() => parseImport('{"foo":1}'), /Not a review export/);
});
test('mergeImport accepts v1 array', () => {
  const p = parseImport(JSON.stringify([{ id: 'a', decision: 'keep', tags: ['core'], moves: 'x', note: '' }]));
  const s = mergeImport(emptyStore(), p);
  assert.equal(s.decisions.a, 'keep');
  assert.deepEqual(s.importedIds, ['a']);
});
test('mergeImport: local decision wins, imported fills gaps', () => {
  const local = { ...emptyStore(), decisions: { a: 'discard' } };
  const p = parseImport(JSON.stringify({ version: 2, vocab: { purposes: ['knees', 'golf'] },
    records: [{ id: 'a', decision: 'keep' }, { id: 'b', decision: 'keep', purposes: ['golf'], purposesConfirmed: true }] }));
  const s = mergeImport(local, p);
  assert.equal(s.decisions.a, 'discard');
  assert.equal(s.decisions.b, 'keep');
  assert.deepEqual(s.tags.purposes.b, ['golf']);
  assert.ok(s.extraPurposes.includes('golf'));
});
test('exportRecords shape', () => {
  const item = { id: 'a', url: 'u', owner: 'o', collections: [], caption: 'c', listed: false, guess: { muscles: [], types: [], purposes: [] } };
  const out = exportRecords([item], emptyStore(), { muscles: [], types: [], purposes: ['knees'] });
  assert.equal(out.version, 2);
  assert.deepEqual(out.records[0].muscles, []);
  assert.equal(out.records[0].musclesConfirmed, false);
  assert.equal(out.records[0].decision, 'undecided');
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `node --test saved/tests/`
Expected: FAIL (cannot find `../review_logic.js` exports).

- [ ] **Step 3: Implement the functions in `saved/review_logic.js`**

Old-to-new muscle map: core to abdominals; lower back; hips to hip flexors; glutes; legs to quadriceps + hamstrings; chest; upper back to middle back + lats; shoulders; biceps; triceps; forearms to forearms.
`posture` and the `desk reset` role become purpose `desk breaks`. Other roles (warm-up, cool-down, gym, home, finisher) are dropped.
v1 custom tags become purposes and are added to `extraPurposes`.
A v1 import record's `tags` go through the same map. `mergeImport` adds every imported id to `importedIds` (no duplicates).

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test saved/tests/`
Expected: 8 passed, 0 failed.

- [ ] **Step 5: Commit**

```bash
git add saved/review_logic.js saved/tests/review_logic.test.mjs
git commit -m "feat(review): store migration, import merge, purpose matching, export"
```

---

### Task 3: Dropdown UI, import button and new filters

**Files:**
- Modify: `saved/review_template.html`
- Create: `saved/tests/selftest.py` (builds a copy of `review.html` with an appended test script and runs headless Edge with an isolated `--user-data-dir` in the scratch folder, then asserts on `data-result`)
- Generated: `saved/review.html`

**Interfaces:**
- Consumes: everything on `ReviewLogic` from Task 2; `/*DATA*/[]`, `/*VOCAB*/{}`, `/*LOGIC*/` placeholders from Task 1.
- Produces: DOM hooks the self-test uses: each dropdown is `.dd[data-dim="muscles|types|purposes"]` with a toggle button `.dd-toggle`, a panel `.dd-panel`, checkboxes `input[type=checkbox][value=...]`; the purpose add-new input is `.dd-panel .dd-new`; the import control is `#importInput`; errors appear in `#toast`.

- [ ] **Step 1: Write the failing self-test**

The appended test script runs after load and sets `document.body.dataset.result` to a JSON object. `selftest.py` asserts every key is `true`:
- `dropdownsPresent`: three `.dd` elements exist for the current post.
- `noRoleRow`: no element contains the text "Role" or "Your tags".
- `toggleKeepsVideo`: open the muscles dropdown, tick a box; the same iframe element is still in the DOM and the box stays ticked.
- `shortcutBlocked`: with a dropdown open, dispatch `keydown` K; the post's decision is still unset.
- `escapeCloses`: `keydown` Escape closes the panel; the iframe is unchanged.
- `purposeNoDuplicate`: type "Lower back COMFORT" in `.dd-new`, press Enter; the purpose checklist has exactly one "lower back comfort" and it is ticked.
- `badImportToast`: dispatch a change on `#importInput` with a `File(['nope'])`; `#toast` shows text containing "Not a review export" and decisions are unchanged.
- `newSinceImportFilter`: the status filter offers "New since last import".
- `uncollectedInMain`: the "Workout collections" tab label shows 139.

- [ ] **Step 2: Run it to verify it fails**

Run: `python saved/tests/selftest.py`
Expected: FAIL listing the false keys (the current page has none of these hooks).

- [ ] **Step 3: Implement in the template**

Replace the Muscles/Role/Your tags rows with three dropdowns (labels "Muscles", "Type", "Purpose"). Closed: chips of the current values, dashed while `confirmed` is false, plus "✓ guess is right" when there are unconfirmed guesses. Open: a checklist in vocab order. Purpose adds `.dd-new` at the bottom, which uses `matchPurpose` to filter as you type, and on Enter selects the exact match or adds a new value to `extraPurposes`.
Only one dropdown is open at a time. An outside click or Escape closes it. Redraws reuse the existing `shown` / `buildLeft` path so the iframe is never rebuilt.
Header: add an "Import decisions" button backed by the hidden `#importInput` (`accept=".json"`), plus a `#toast` line for errors and results ("Imported 139 posts").
Status filter: add `['new', 'New since last import']` (items whose id is not in `importedIds`). Keep "Kept, moves missing".
Storage key becomes `ig-review-v2`. On first load, if only `ig-review-v1` exists, run `migrateV1` and save under v2 (leave v1 in place as a backup).
Export uses `exportRecords`.
Then rebuild: `python saved/build_review.py`.

- [ ] **Step 4: Run all tests**

Run: `python -m pytest saved/tests -q && node --test saved/tests/ && python saved/tests/selftest.py`
Expected: all pass; the self-test prints every key as true.

- [ ] **Step 5: Screenshot check**

Run the headless Edge screenshot (as used earlier this session) and look at it: dropdowns readable in dark mode, no layout overflow at 1400px and at 800px width.

- [ ] **Step 6: Commit**

```bash
git add saved/review_template.html saved/tests/selftest.py saved/review.html
git commit -m "feat(review): muscles/type/purpose dropdowns, import, new-since-import filter"
```

---

### Task 4: Builder rules in the main design doc

**Files:**
- Modify: `docs/superpowers/specs/2026-11-22-workout-app-design.md` (the "Exercise library" bullets around lines 200-216 and the session-building section)

- [ ] **Step 1: Edit the doc**

- Exercise type list becomes strength / conditioning / mobility / stretch / stability, with the boundary rules copied from the tagging spec's "Type boundary rules".
- Add a purpose field (vocab as in the tagging spec) and the derived fields position and dose format.
- Add rule: only strength items count toward the weekly set budget; mobility, stretch and stability muscle tags mean target region; stability does not count toward the core budget.
- Add rule: purpose-tagged items fill only warm-up, cool-down, desk reset and the Mobility focus, never main-lift or superset slots; chest and back main work comes from the base library.
- Link the tagging spec.

- [ ] **Step 2: Verify**

Run: `grep -n "stability\|target region\|superset slot" docs/superpowers/specs/2026-11-22-workout-app-design.md`
Expected: each phrase appears at least once. Also check there are no em dashes: `grep -c "-" docs/superpowers/specs/2026-11-22-workout-app-design.md` prints 0.

- [ ] **Step 3: Commit**

```bash
git add docs/superpowers/specs/2026-11-22-workout-app-design.md
git commit -m "docs: add tagging-derived builder rules to main design"
```
