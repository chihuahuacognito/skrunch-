import type { TonightAction, TonightState } from './types';

export function emptyTonight(date: string): TonightState {
  return { version: 2, date, rest: null, lastRest: null, opened: [], cards: {}, promoted: {}, lastGroup: null, lastActionAt: null, firstSetAt: null };
}

export function reduceTonight(s: TonightState, a: TonightAction): TonightState {
  switch (a.type) {
    case 'open':
      return {
        ...s,
        opened: s.opened.includes(a.group) ? s.opened : [...s.opened, a.group],
        cards: s.cards[a.group] ? s.cards : { ...s.cards, [a.group]: a.cards },
        lastGroup: a.group,
        lastActionAt: a.now,
      };
    case 'promote': {
      const list = s.promoted[a.group] ?? [];
      return list.includes(a.exerciseId) ? s : { ...s, promoted: { ...s.promoted, [a.group]: [...list, a.exerciseId] } };
    }
    case 'logged':
      return { ...s, firstSetAt: s.firstSetAt ?? a.now, lastActionAt: a.now };
    case 'restStart':
      return {
        ...s,
        rest: { ...a.rest, endsAt: a.now + a.rest.seconds * 1000 },
        lastRest: { exerciseId: a.rest.exerciseId, set: a.rest.set, of: a.rest.of },
        lastActionAt: a.now,
      };
    case 'restPlus':
      if (!s.rest) return s;
      return { ...s, rest: { ...s.rest, seconds: s.rest.seconds + a.seconds, endsAt: s.rest.endsAt + a.seconds * 1000 } };
    case 'restEnd':
      return s.rest ? { ...s, rest: null } : s;
    case 'forgetRest':
      return {
        ...s,
        rest: s.rest?.exerciseId === a.exerciseId ? null : s.rest,
        lastRest: s.lastRest?.exerciseId === a.exerciseId ? null : s.lastRest,
      };
  }
}
