import type { Exercise, TagMuscle } from '../library/types';
import { estimateMinutes } from './estimate';
import { coverRegions, type PartContext, plain } from './parts';
import type { Block, PlannedSession } from './types';

const DESK_REGIONS: TagMuscle[] = ['lower back', 'thoracic spine', 'hip flexors', 'hamstrings', 'glutes'];
const ITEMS = 7;

/** Standing or seated, no equipment: something you can do next to the desk. */
const deskFriendly = (e: Exercise) =>
  (e.type === 'mobility' || e.type === 'stretch') && e.position !== 'floor' && e.equipment.length === 0;

/** The standalone 5-10 minute desk routine, varied by date. Not a training session. */
export function buildDeskReset(lib: Exercise[], today: string): PlannedSession {
  const parts: PartContext = { lib, today, place: 'home', used: new Set() };
  const items = coverRegions(parts, 'desk', deskFriendly, DESK_REGIONS, ITEMS).map(e => plain(e, 1, 10));
  const blocks: Block[] = [{ kind: 'mobility', items }];
  return {
    focus: 'desk-reset', dose: 'full', date: today, place: 'home', deload: false, calibration: false, intervals: false,
    blocks, estimatedMinutes: estimateMinutes(blocks),
  };
}
