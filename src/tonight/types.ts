import type { CardPick, GroupId } from '../builder';

export interface Rest { endsAt: number; seconds: number; exerciseId: string; set: number; of: number }

/** Tonight's UI state. Logged sets live in SQLite; this only remembers where he is. */
export interface TonightState {
  version: 2;
  date: string;
  rest: Rest | null;
  opened: GroupId[];
  /** Frozen when a group is first opened tonight, so cards never reshuffle mid-session. */
  cards: Partial<Record<GroupId, CardPick[]>>;
  /** More rows promoted to full cards tonight. */
  promoted: Partial<Record<GroupId, string[]>>;
  lastGroup: GroupId | null;
  lastActionAt: number | null;
  firstSetAt: number | null;
}

export type TonightAction =
  | { type: 'open'; group: GroupId; cards: CardPick[]; now: number }
  | { type: 'promote'; group: GroupId; exerciseId: string }
  | { type: 'logged'; now: number }
  | { type: 'restStart'; rest: Omit<Rest, 'endsAt'>; now: number }
  | { type: 'restPlus'; seconds: number }
  | { type: 'restEnd' };
