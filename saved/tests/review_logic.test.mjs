import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  emptyStore, migrateV1, tagsOf, matchPurpose, parseImport, mergeImport, exportRecords,
} = require('../review_logic.js');

test('migrateV1 keeps decisions, notes, moves', () => {
  const s = migrateV1({ decisions: { a: 'keep' }, notes: { a: 'n' }, moves: { a: 'bird dog' } });
  assert.deepEqual([s.decisions, s.notes, s.moves], [{ a: 'keep' }, { a: 'n' }, { a: 'bird dog' }]);
  assert.equal(s.version, 2);
});

test('migrateV1 maps old tags', () => {
  const s = migrateV1({
    tags: { a: ['core', 'legs', 'upper back', 'posture', 'desk reset', 'gym', 'pelvic tilt'] },
    custom: ['pelvic tilt'],
  });
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
  const p = parseImport(JSON.stringify({
    version: 2, vocab: { purposes: ['knees', 'golf'] },
    records: [{ id: 'a', decision: 'keep' }, { id: 'b', decision: 'keep', purposes: ['golf'], purposesConfirmed: true }],
  }));
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

test('v1 import keeps unconfirmed guesses unconfirmed', () => {
  const p = parseImport(JSON.stringify([
    { id: 'a', decision: 'keep', tags: ['legs', 'posture'], tagsConfirmed: false },
    { id: 'b', decision: 'keep', tags: ['core'], tagsConfirmed: true },
  ]));
  const s = mergeImport(emptyStore(), p);
  assert.ok(!('a' in s.tags.muscles) && !('a' in s.tags.purposes));
  assert.deepEqual(s.tags.muscles.b, ['abdominals']);
});

test('parseImport rejects wrongly typed fields', () => {
  const v2 = recs => JSON.stringify({ version: 2, vocab: { purposes: [] }, records: recs });
  assert.throws(() => parseImport(v2([{ id: 'a', moves: 5 }])), /Not a review export/);
  assert.throws(() => parseImport(v2([{ id: 'a', note: {} }])), /Not a review export/);
  assert.throws(() => parseImport(v2([{ id: 'a', decision: 'maybe' }])), /Not a review export/);
  assert.throws(() => parseImport(v2([{ id: 'a', purposes: 'knees' }])), /Not a review export/);
  assert.throws(() => parseImport(JSON.stringify({ version: 2, vocab: { purposes: 'abc' }, records: [] })), /Not a review export/);
});
