// Pure logic for review.html: store shape, v1 migration, import/export, purpose matching.
// No DOM access here, so it runs in the browser (inlined) and under `node --test`.
(function (root) {
  'use strict';

  const DIMS = ['muscles', 'types', 'purposes'];
  const STARTER_PURPOSES = ['hip flexors / sitting stiffness', 'lower back comfort', 'desk breaks', 'wrists', 'knees', 'shoulder health'];

  // v1 tag -> v2 values. Anything not listed (and not a known role) is a custom tag -> purpose.
  const V1_MUSCLES = {
    'core': ['abdominals'], 'lower back': ['lower back'], 'hips': ['hip flexors'], 'glutes': ['glutes'],
    'legs': ['quadriceps', 'hamstrings'], 'chest': ['chest'], 'upper back': ['middle back', 'lats'],
    'shoulders': ['shoulders'], 'biceps': ['biceps'], 'triceps': ['triceps'], 'forearms': ['forearms'],
  };
  const V1_TO_DESK = new Set(['posture', 'desk reset']);
  const V1_DROPPED_ROLES = new Set(['warm-up', 'cool-down', 'gym', 'home', 'finisher']);

  const uniq = list => [...new Set(list)];
  const norm = s => String(s).trim().toLowerCase().replace(/\s+/g, ' ');

  function emptyStore() {
    return {
      version: 2, decisions: {}, notes: {}, moves: {},
      tags: { muscles: {}, types: {}, purposes: {} },
      extraPurposes: [], importedIds: [],
      group: 'fitness', status: 'all', embed: true, cur: null,
    };
  }

  // Split a list of v1 tags into v2 dimensions.
  function mapV1Tags(list) {
    const muscles = [], purposes = [];
    for (const t of list || []) {
      if (V1_MUSCLES[t]) muscles.push(...V1_MUSCLES[t]);
      else if (V1_TO_DESK.has(t)) purposes.push('desk breaks');
      else if (!V1_DROPPED_ROLES.has(t)) purposes.push(t);
    }
    return { muscles: uniq(muscles), purposes: uniq(purposes) };
  }

  function migrateV1(old) {
    const s = emptyStore();
    for (const k of ['decisions', 'notes', 'moves']) s[k] = { ...(old[k] || {}) };
    for (const k of ['group', 'status', 'embed', 'cur']) if (k in old) s[k] = old[k];
    for (const [id, list] of Object.entries(old.tags || {})) {
      const m = mapV1Tags(list);
      if (m.muscles.length) s.tags.muscles[id] = m.muscles;
      if (m.purposes.length) s.tags.purposes[id] = m.purposes;
    }
    s.extraPurposes = uniq((old.custom || []).filter(t => !STARTER_PURPOSES.includes(t)));
    return s;
  }

  function tagsOf(item, store, dim) {
    const own = store.tags[dim][item.id];
    return own ? { values: own, confirmed: true } : { values: (item.guess && item.guess[dim]) || [], confirmed: false };
  }

  function matchPurpose(query, list) {
    const q = norm(query);
    if (!q) return { exact: null, matches: [...list] };
    return { exact: list.find(v => norm(v) === q) || null, matches: list.filter(v => norm(v).includes(q)) };
  }

  const NOT_EXPORT = () => new Error('Not a review export');

  // Accepts the v2 object export and the earlier v1 plain-array export.
  function parseImport(text) {
    let data;
    try { data = JSON.parse(text); } catch (e) { throw NOT_EXPORT(); }
    const isRecords = a => Array.isArray(a) && a.every(r => r && typeof r.id === 'string');
    if (isRecords(data)) {
      const records = data.map(r => {
        const m = mapV1Tags(r.tags);
        return {
          id: r.id, decision: r.decision, moves: r.moves || '', note: r.note || '',
          muscles: m.muscles, musclesConfirmed: m.muscles.length > 0,
          types: [], typesConfirmed: false,
          purposes: m.purposes, purposesConfirmed: m.purposes.length > 0,
        };
      });
      return { records, purposes: [] };
    }
    if (data && data.version === 2 && isRecords(data.records)) {
      return { records: data.records, purposes: (data.vocab && data.vocab.purposes) || [] };
    }
    throw NOT_EXPORT();
  }

  // Local work wins; imported values only fill what is empty locally.
  function mergeImport(store, parsed) {
    const s = JSON.parse(JSON.stringify(store));
    for (const r of parsed.records) {
      if (r.decision && r.decision !== 'undecided' && !s.decisions[r.id]) s.decisions[r.id] = r.decision;
      if (r.moves && !s.moves[r.id]) s.moves[r.id] = r.moves;
      if (r.note && !s.notes[r.id]) s.notes[r.id] = r.note;
      for (const dim of DIMS) {
        if (r[dim + 'Confirmed'] && Array.isArray(r[dim]) && !(r.id in s.tags[dim])) s.tags[dim][r.id] = [...r[dim]];
      }
      if (!s.importedIds.includes(r.id)) s.importedIds.push(r.id);
    }
    const imported = [...parsed.purposes, ...parsed.records.flatMap(r => (r.purposesConfirmed && r.purposes) || [])];
    s.extraPurposes = uniq([...s.extraPurposes, ...imported.filter(p => !STARTER_PURPOSES.includes(p))]);
    return s;
  }

  function exportRecords(items, store, vocab) {
    const records = items.map(i => {
      const r = {
        id: i.id, url: i.url, owner: i.owner, collections: i.collections,
        decision: store.decisions[i.id] || 'undecided',
      };
      for (const dim of DIMS) {
        const t = tagsOf(i, store, dim);
        r[dim] = [...t.values];
        r[dim + 'Confirmed'] = t.confirmed;
      }
      Object.assign(r, {
        captionListsMoves: !!i.listed, moves: store.moves[i.id] || '', note: store.notes[i.id] || '', caption: i.caption,
      });
      return r;
    });
    return {
      version: 2, exportedAt: new Date().toISOString(),
      vocab: { muscles: vocab.muscles, types: vocab.types, purposes: uniq([...vocab.purposes, ...store.extraPurposes]) },
      records,
    };
  }

  const api = { DIMS, emptyStore, migrateV1, tagsOf, matchPurpose, parseImport, mergeImport, exportRecords };
  root.ReviewLogic = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
