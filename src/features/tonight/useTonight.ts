import { createContext, useContext } from 'react';
import type { CardPick, GroupId, GroupInput, History, LoggedSet, Target } from '../../builder';
import type { TonightState } from '../../tonight';

export interface TonightApi {
  ready: boolean;
  today: string;
  /** Everything logged, tonight included. */
  history: History;
  state: TonightState;
  /** History, tonight included, for status and summaries. */
  input: GroupInput;
  /** Picks and freezes the group's cards on the first open tonight; returns the frozen cards. */
  openGroup(group: GroupId): CardPick[];
  promote(group: GroupId, exerciseId: string): void;
  /** Tonight's target, from history before tonight, so it never moves mid-session. */
  targetOf(exerciseId: string): Target;
  logDot(exerciseId: string, index: number, target: Target, intervals: boolean): Promise<void>;
  complete(exerciseId: string, target: Target, intervals: boolean): Promise<void>;
  edit(exerciseId: string, sets: LoggedSet[], target: Target, intervals: boolean): Promise<void>;
  undo(exerciseId: string): Promise<void>;
  restPlus(seconds: number): void;
  restSkip(): void;
  doneSets(exerciseId: string): LoggedSet[];
  /** True once per app launch: Home uses it to reopen the last group only on launch. */
  claimReopen(): boolean;
}

export const TonightContext = createContext<TonightApi | null>(null);

export function useTonight(): TonightApi {
  const api = useContext(TonightContext);
  if (!api) throw new Error('useTonight must be used inside a TonightProvider');
  return api;
}
