import { addDays } from './dates';
import { buildDeskReset } from './desk';
import { byId, lib } from './test-utils/fixtures';

const REGIONS = ['lower back', 'thoracic spine', 'hip flexors', 'hamstrings', 'glutes'] as const;

test.each(['2026-11-20', '2026-11-21', '2026-11-22', '2026-11-23'])(
  'desk reset on %s covers the five regions with standing or seated no-equipment items in 5-10 minutes', date => {
    const d = buildDeskReset(lib, date);
    expect(d.focus).toBe('desk-reset');
    expect(d.blocks).toHaveLength(1);
    const items = d.blocks[0].items.map(i => byId(i.exerciseId));
    expect(items.length).toBeGreaterThanOrEqual(6);
    expect(items.length).toBeLessThanOrEqual(8);
    expect(items.every(e => e.position !== 'floor' && e.equipment.length === 0 && ['mobility', 'stretch'].includes(e.type))).toBe(true);
    for (const r of REGIONS) expect(items.some(e => e.muscles.includes(r))).toBe(true);
    expect(d.estimatedMinutes).toBeGreaterThanOrEqual(5);
    expect(d.estimatedMinutes).toBeLessThanOrEqual(10);
  });

test('desk reset varies across days', () => {
  const lists = Array.from({ length: 7 }, (_, i) => buildDeskReset(lib, addDays('2026-11-22', i)).blocks[0].items.map(x => x.exerciseId).join());
  expect(new Set(lists).size).toBeGreaterThan(1);
});
