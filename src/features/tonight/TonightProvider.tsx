import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  pickGroup, targetFor, type CardPick, type GroupId, type GroupInput, type History, type LoggedSet, type Role, type Target,
} from '../../builder';
import { isInterval } from '../../builder/parts';
import { impact, tick } from '../../haptics';
import { clearRest, onRestAction, showRest } from '../../notify/rest';
import { useDb } from '../../store/DbContext';
import { loadHistory } from '../../store/history';
import { appendSet, removeExercise, replaceSets, type LogMeta } from '../../store/log';
import { loadTonight, saveTonight } from '../../store/tonight';
import { emptyTonight, reduceTonight, restNotice, type TonightAction, type TonightState } from '../../tonight';
import { LIBRARY } from '../../ui/library';
import { useToday } from '../../ui/useToday';
import { TonightContext, type TonightApi } from './useTonight';

const BY_ID = new Map(LIBRARY.map(e => [e.id, e]));
const NAMES = new Map(LIBRARY.map(e => [e.id, e.name]));
const pad = (n: number) => String(n).padStart(2, '0');
const timeOfDay = (ms: number) => {
  const d = new Date(ms);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const meta = (t: Target, intervals: boolean): LogMeta =>
  ({ plannedSets: t.sets, targetMin: t.reps, targetMax: t.range?.[1] ?? null, intervals });
const setOf = (t: Target): LoggedSet => ({ weight: t.weight, reps: t.reps, seconds: t.minutes === null ? null : t.minutes * 60 });

/**
 * Owns tonight: history, the tonight UI state, writes in the order they were asked for, the rest timer and its
 * notification. Every screen reads it through useTonight().
 */
export function TonightProvider({ children }: { children: ReactNode }) {
  const db = useDb();
  const today = useToday();
  const [history, setHistory] = useState<History>({ sessions: [], feedback: {} });
  const [state, setState] = useState<TonightState>(() => emptyTonight(today));
  const [ready, setReady] = useState(false);

  const stateRef = useRef(state);
  stateRef.current = state;
  const chain = useRef<Promise<unknown>>(Promise.resolve());
  const run = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const p = chain.current.then(task);
    chain.current = p.catch(e => console.warn('a tonight write failed', e));
    return p;
  }, []);
  const dispatch = useCallback((a: TonightAction) => setState(s => reduceTonight(s, a)), []);

  // Load (and reload on a new training day).
  useEffect(() => {
    let live = true;
    setReady(false);
    void run(async () => {
      const [h, s] = await Promise.all([loadHistory(db), loadTonight(db, today)]);
      if (!live) return;
      setHistory(h);
      setState(s);
      setReady(true);
    });
    return () => {
      live = false;
    };
  }, [db, today, run]);

  // Persist every change of tonight's state, in order with the writes.
  useEffect(() => {
    if (!ready || state.date !== today) return;
    void run(() => saveTonight(db, state));
  }, [db, ready, state, today, run]);

  const prior = useMemo<History>(
    () => ({ ...history, sessions: history.sessions.filter(s => s.date < today) }),
    [history, today],
  );
  const input = useMemo<GroupInput>(() => ({ library: LIBRARY, history, today }), [history, today]);

  const roleOf = useCallback((id: string): Role => {
    for (const cards of Object.values(stateRef.current.cards)) {
      const card = cards?.find(c => c.exerciseId === id);
      if (card) return card.role;
    }
    return 'accessory';
  }, []);
  const doneSets = useCallback((id: string): LoggedSet[] =>
    history.sessions.filter(s => s.date === today).flatMap(s => s.exercises).filter(x => x.exerciseId === id).flatMap(x => x.sets),
  [history, today]);

  // From history before tonight, so the target never moves mid-session. A first-time lift takes the weight chosen
  // for tonight's first set, so the next dots and the notification do not ask again.
  const targetOf = useCallback((id: string): Target => {
    const t = targetFor(BY_ID.get(id)!, roleOf(id), prior, today);
    if (!t.needsWeight) return t;
    const chosen = doneSets(id).find(s => s.weight !== null)?.weight ?? null;
    return chosen === null ? t : { ...t, weight: chosen, needsWeight: false };
  }, [prior, today, roleOf, doneSets]);
  const doneRef = useRef(doneSets);
  doneRef.current = doneSets;

  const reload = useCallback(async () => setHistory(await loadHistory(db)), [db]);

  const logDot = useCallback((id: string, index: number, target: Target, intervals: boolean) => run(async () => {
    const written = await appendSet(db, today, id, setOf(target), meta(target, intervals), index);
    if (!written) return;
    tick();
    const now = Date.now();
    dispatch({ type: 'logged', now });
    if (target.restSeconds > 0) {
      dispatch({ type: 'restStart', rest: { seconds: target.restSeconds, exerciseId: id, set: index + 1, of: target.sets }, now });
    }
    await reload();
  }), [db, today, run, dispatch, reload]);

  const complete = useCallback((id: string, target: Target, intervals: boolean) => run(async () => {
    const done = (await loadHistory(db)).sessions.filter(s => s.date === today).flatMap(s => s.exercises)
      .filter(x => x.exerciseId === id).flatMap(x => x.sets).length;
    for (let i = done; i < target.sets; i++) await appendSet(db, today, id, setOf(target), meta(target, intervals), i);
    tick();
    dispatch({ type: 'logged', now: Date.now() });
    await reload();
  }), [db, today, run, dispatch, reload]);

  const edit = useCallback((id: string, sets: LoggedSet[], target: Target, intervals: boolean) => run(async () => {
    await replaceSets(db, today, id, sets, meta(target, intervals));
    dispatch({ type: 'logged', now: Date.now() });
    await reload();
  }), [db, today, run, dispatch, reload]);

  const undo = useCallback((id: string) => run(async () => {
    await removeExercise(db, today, id);
    if (stateRef.current.rest?.exerciseId === id) dispatch({ type: 'restEnd' });
    await reload();
  }), [db, today, run, dispatch, reload]);

  const openGroup = useCallback((group: GroupId): CardPick[] => {
    const cards = stateRef.current.cards[group] ?? pickGroup({ library: LIBRARY, history: prior, today }, group).cards;
    dispatch({ type: 'open', group, cards, now: Date.now() });
    return cards;
  }, [prior, today, dispatch]);

  const promote = useCallback((group: GroupId, exerciseId: string) => dispatch({ type: 'promote', group, exerciseId }), [dispatch]);
  const restPlus = useCallback((seconds: number) => dispatch({ type: 'restPlus', seconds }), [dispatch]);
  const restSkip = useCallback(() => dispatch({ type: 'restEnd' }), [dispatch]);

  // The rest ends on its own.
  const endsAt = state.rest?.endsAt ?? null;
  useEffect(() => {
    if (endsAt === null) return;
    const id = setTimeout(() => {
      impact();
      dispatch({ type: 'restEnd' });
    }, Math.max(0, endsAt - Date.now()));
    return () => clearTimeout(id);
  }, [endsAt, dispatch]);

  // The notification follows the rest.
  const targetRef = useRef(targetOf);
  targetRef.current = targetOf;
  useEffect(() => {
    if (!ready) return;
    const s = stateRef.current;
    const next = s.rest && s.rest.set < s.rest.of ? targetRef.current(s.rest.exerciseId) : null;
    const notice = restNotice(s, NAMES, timeOfDay, next);
    void (notice ? showRest(notice) : clearRest()).catch(e => console.warn('rest notification failed', e));
  }, [ready, endsAt]);

  // Notification actions, including the one that opened a killed app.
  const logRef = useRef(logDot);
  logRef.current = logDot;
  useEffect(() => {
    if (!ready) return;
    return onRestAction(action => {
      if (action === 'plus15') return dispatch({ type: 'restPlus', seconds: 15 });
      if (action === 'skip') return dispatch({ type: 'restEnd' });
      const rest = stateRef.current.rest;
      if (!rest) return;
      const target = targetRef.current(rest.exerciseId);
      const done = doneRef.current(rest.exerciseId).length;
      if (done >= target.sets || target.needsWeight) return;
      const e = BY_ID.get(rest.exerciseId);
      void logRef.current(rest.exerciseId, done, target, !!e && isInterval(e));
    });
  }, [ready, dispatch]);

  const api: TonightApi = {
    ready, today, history, state, input, openGroup, promote, targetOf, logDot, complete, edit, undo, restPlus, restSkip, doneSets,
  };
  return <TonightContext.Provider value={api}>{children}</TonightContext.Provider>;
}
