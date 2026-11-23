import { stepsOf } from './start';
import type { ItemLog, ItemRef, SetEntry, WorkoutAction, WorkoutState } from './types';

const itemOf = (state: WorkoutState, ref: ItemRef) => state.session.blocks[ref.block]?.items[ref.item];
const logOf = (state: WorkoutState, ref: ItemRef): ItemLog | undefined => state.logs[ref.block]?.[ref.item];

/** A loaded lift needs a weight before its set can be logged. */
export function canTick(state: WorkoutState, ref: ItemRef, set: number): boolean {
  const item = itemOf(state, ref);
  const entry = logOf(state, ref)?.sets[set];
  if (!item || !entry) return false;
  return !(item.slot !== null && entry.weight === null);
}

/** The next set to do: lowest set index first, items in step order (A1 s1, A2 s1, A1 s2...), this step then later ones. */
export function nextOpenSet(state: WorkoutState): { ref: ItemRef; set: number } | null {
  const steps = stepsOf(state.session);
  for (let s = state.step; s < steps.length; s++) {
    const { block, items } = steps[s];
    const most = Math.max(...items.map(item => state.logs[block][item].sets.length));
    for (let set = 0; set < most; set++) {
      for (const item of items) {
        if (state.logs[block][item].sets[set]?.done === false) return { ref: { block, item }, set };
      }
    }
  }
  return null;
}

function withLog(state: WorkoutState, ref: ItemRef, log: ItemLog): WorkoutState {
  const logs = state.logs.map((b, bi) => (bi === ref.block ? b.map((l, i) => (i === ref.item ? log : l)) : b));
  return { ...state, logs };
}

function withSets(state: WorkoutState, ref: ItemRef, log: ItemLog, sets: SetEntry[]): WorkoutState {
  return withLog(state, ref, { ...log, sets });
}

function tick(state: WorkoutState, ref: ItemRef, set: number, now: number): WorkoutState {
  const log = logOf(state, ref);
  if (!log || log.sets[set]?.done !== false || !canTick(state, ref, set)) return state;
  let next = withSets(state, ref, log, log.sets.map((x, i) => (i === set ? { ...x, done: true } : x)));
  const rest = itemOf(state, ref)!.restSeconds;
  if (rest > 0) next = { ...next, rest: { endsAt: now + rest * 1000, seconds: rest, from: ref } };
  const steps = stepsOf(state.session);
  const step = steps[next.step];
  const stepDone = step.items.every(item => next.logs[step.block][item].sets.every(x => x.done));
  if (stepDone && next.step < steps.length - 1) next = { ...next, step: next.step + 1 };
  return next;
}

/** Applies one workout action. Returns the same object when nothing changes. */
export function reduceWorkout(state: WorkoutState, action: WorkoutAction): WorkoutState {
  switch (action.type) {
    case 'tick':
      return tick(state, action.ref, action.set, action.now);
    case 'untick': {
      const log = logOf(state, action.ref);
      if (!log || log.sets[action.set]?.done !== true) return state;
      return withSets(state, action.ref, log, log.sets.map((x, i) => (i === action.set ? { ...x, done: false } : x)));
    }
    case 'edit': {
      const log = logOf(state, action.ref);
      if (!log?.sets[action.set]) return state;
      const { field, value } = action;
      return withSets(state, action.ref, log, log.sets.map((x, i) =>
        i === action.set || (field === 'weight' && i > action.set && !x.done) ? { ...x, [field]: value } : x));
    }
    case 'chip': {
      const log = logOf(state, action.ref);
      if (!log || log.chip === action.chip) return state;
      return withLog(state, action.ref, { ...log, chip: action.chip });
    }
    case 'go': {
      const step = Math.min(Math.max(action.step, 0), stepsOf(state.session).length - 1);
      return step === state.step ? state : { ...state, step };
    }
    case 'completeNext': {
      const open = nextOpenSet(state);
      return open ? tick(state, open.ref, open.set, action.now) : state;
    }
    case 'restPlus':
      if (!state.rest) return state;
      return {
        ...state,
        rest: { ...state.rest, endsAt: state.rest.endsAt + action.seconds * 1000, seconds: state.rest.seconds + action.seconds },
      };
    case 'restEnd':
      return state.rest ? { ...state, rest: null } : state;
    case 'swap': {
      const log = logOf(state, action.ref);
      if (!log || log.sets.some(x => x.done)) return state;
      const blocks = state.session.blocks.map((b, bi) => (bi === action.ref.block
        ? { ...b, items: b.items.map((x, i) => (i === action.ref.item ? action.item : x)) }
        : b));
      return withLog({ ...state, session: { ...state.session, blocks } }, action.ref, { sets: action.sets, chip: null });
    }
  }
}
