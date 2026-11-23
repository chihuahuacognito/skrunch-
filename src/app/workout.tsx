import { Redirect, useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useEffect, useReducer, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { INCREMENT_KG, replaceItem, swapCandidates, type BuilderInput, type CheckIn, type Feedback, type History, type PlannedExercise } from '../builder';
import { ChipRow } from '../features/workout/ChipRow';
import { EndSheet } from '../features/workout/EndSheet';
import { ExerciseSheet } from '../features/workout/ExerciseSheet';
import { NumberEditor } from '../features/workout/NumberEditor';
import { RestBanner } from '../features/workout/RestBanner';
import { SetRow } from '../features/workout/SetRow';
import { impact, tick as tickHaptic } from '../haptics';
import { useDb } from '../store/DbContext';
import { checkInFor, loadHistory, setFeedback } from '../store/history';
import type { SqlDb } from '../store/sql';
import { completeWorkout, discardWorkout, loadDraft, saveDraft } from '../store/workout';
import { tokens } from '../theme/tokens';
import { blockTitle, doseText } from '../ui/format';
import { LIBRARY } from '../ui/library';
import { useCountdown } from '../ui/useCountdown';
import { useLoad } from '../ui/useLoad';
import { useOnceUntilFocus } from '../ui/useOnceUntilFocus';
import { useRemaining } from '../ui/useRemaining';
import { useToday } from '../ui/useToday';
import { canTick, prefillSets, reduceWorkout, stepsOf, summaryOf, type ItemRef, type WorkoutState } from '../workout';

const BY_ID = new Map(LIBRARY.map(e => [e.id, e]));
const nameOf = (id: string) => BY_ID.get(id)?.name ?? id;
const same = (a: ItemRef, b: ItemRef) => a.block === b.block && a.item === b.item;
type Field = 'weight' | 'reps' | 'seconds';

/** Tonight's workout in progress. It lives in the draft, so the app reopens straight into it. */
export default function WorkoutScreen() {
  const db = useDb();
  const today = useToday();
  const data = useLoad(async () => {
    const draft = await loadDraft(db, today);
    return draft ? { draft, history: await loadHistory(db), checkIn: (await checkInFor(db, today))?.value ?? null } : null;
  }, [db, today]);
  if (data === undefined) return <View style={styles.root} />;
  if (data === null) return <Redirect href="/" />;
  return <Workout initial={data.draft} history={data.history} checkIn={data.checkIn} />;
}

/**
 * Saves every change after the first render, one write at a time, in order. close() stops further writes and resolves
 * once the queued ones have landed, so finishing or discarding can never be undone by a late draft write.
 */
function useDraftWriter(db: SqlDb, state: WorkoutState) {
  const chain = useRef<Promise<void>>(Promise.resolve());
  const first = useRef(true);
  const closed = useRef(false);
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    if (closed.current) return;
    chain.current = chain.current.then(() => saveDraft(db, state)).catch(e => console.warn('saving the workout failed', e));
  }, [db, state]);
  return {
    close: async () => {
      closed.current = true;
      await chain.current;
    },
    reopen: () => {
      closed.current = false;
    },
  };
}

function StayAwake() {
  useKeepAwake();
  return null;
}

function rirText(rir: [number, number] | null): string | null {
  if (!rir) return null;
  return `RIR ${rir[0] === rir[1] ? rir[0] : `${rir[0]}-${rir[1]}`}`;
}

/** Tonight's inputs for the swap list; null without a check-in (swaps are then not offered). */
function swapInput(state: WorkoutState, history: History, checkIn: CheckIn | null): BuilderInput | null {
  if (!checkIn) return null;
  return { library: LIBRARY, history, today: state.session.date, checkIn, place: state.session.place };
}

function Workout({ initial, history, checkIn }: { initial: WorkoutState; history: History; checkIn: CheckIn | null }) {
  const db = useDb();
  const router = useRouter();
  const [state, dispatch] = useReducer(reduceWorkout, initial);
  const writer = useDraftWriter(db, state);
  const once = useOnceUntilFocus();
  const [ending, setEnding] = useState(false);
  const [options, setOptions] = useState<ItemRef | null>(null);
  const [feedback, setFeedbackState] = useState(history.feedback);
  const [editing, setEditing] = useState<{ ref: ItemRef; set: number; field: Field } | null>(null);
  const [timing, setTiming] = useState<{ ref: ItemRef; set: number } | null>(null);
  const timingRef = useRef(timing);
  timingRef.current = timing;

  const countdown = useCountdown(() => {
    const t = timingRef.current;
    setTiming(null);
    if (!t) return;
    impact();
    dispatch({ type: 'tick', ref: t.ref, set: t.set, now: Date.now() });
  });
  const remaining = useRemaining(state.rest?.endsAt ?? null, () => {
    impact();
    dispatch({ type: 'restEnd' });
  });

  const { session } = state;
  const steps = stepsOf(session);
  const step = steps[state.step];
  const block = session.blocks[step.block];
  const last = state.step === steps.length - 1;
  const supersetLetter = block.kind === 'superset'
    ? String.fromCharCode(65 + session.blocks.slice(0, step.block).filter(b => b.kind === 'superset').length)
    : null;
  const title = supersetLetter ? `Superset ${supersetLetter}` : blockTitle(block.kind);

  const go = (to: number) => {
    setEditing(null);
    countdown.stop();
    setTiming(null);
    dispatch({ type: 'go', step: to });
  };

  const onTick = (ref: ItemRef, set: number) => {
    if (!canTick(state, ref, set)) {
      setEditing({ ref, set, field: 'weight' });
      return;
    }
    setEditing(null);
    tickHaptic();
    dispatch({ type: 'tick', ref, set, now: Date.now() });
  };

  /** Leaves the workout through one door: no more draft writes, then the given store change, then navigation. */
  const leave = async (change: () => Promise<string>) => {
    if (!once.claim()) return;
    setEnding(false);
    countdown.stop();
    try {
      await writer.close();
      router.replace(await change() as '/');
    } catch (e) {
      writer.reopen();
      once.release();
      throw e;
    }
  };
  const finish = () => leave(async () => {
    const { minutes, sets, exercises } = summaryOf(state, Date.now());
    const saved = await completeWorkout(db, state);
    return saved ? `/summary?minutes=${minutes}&sets=${sets}&exercises=${exercises}` : '/';
  });
  const discard = () => {
    setEnding(false);
    Alert.alert("Discard tonight's workout?", 'Nothing will be saved.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => void leave(async () => { await discardWorkout(db); return '/'; }) },
    ]);
  };

  const input = swapInput(state, history, checkIn);
  const optionsItem = options ? session.blocks[options.block].items[options.item] : null;
  const swaps = options && optionsItem?.slot && input && !state.logs[options.block][options.item].sets.some(x => x.done)
    ? swapCandidates(input, session, options.block, options.item)
    : null;
  const swapTo = (exerciseId: string) => {
    if (!options || !input) return;
    const item = replaceItem(input, session, options.block, options.item, exerciseId).blocks[options.block].items[options.item];
    const exercise = BY_ID.get(exerciseId)!;
    setEditing(null);
    dispatch({ type: 'swap', ref: options, item, sets: prefillSets(item, exercise, history) });
    setOptions(null);
  };
  const giveFeedback = async (value: Feedback | null) => {
    if (!optionsItem) return;
    const id = optionsItem.exerciseId;
    await setFeedback(db, id, value);
    setFeedbackState(f => {
      const next = { ...f };
      if (value === null) delete next[id];
      else next[id] = value;
      return next;
    });
  };

  const allDone = (ref: ItemRef) => state.logs[ref.block][ref.item].sets.every(s => s.done);
  const restFrom = state.rest?.from;
  const restItem = restFrom ? session.blocks[restFrom.block]?.items[restFrom.item] : undefined;
  const restChip = restFrom && restItem?.slot && allDone(restFrom) ? restFrom : null;
  const holdRunning = timing !== null && session.blocks[timing.ref.block].items[timing.ref.item].dose.format === 'hold';

  const card = (item: PlannedExercise, i: number) => {
    const ref: ItemRef = { block: step.block, item: i };
    const log = state.logs[ref.block][ref.item];
    const exercise = BY_ID.get(item.exerciseId);
    const timed = item.dose.format !== 'reps';
    const rir = rirText(item.rir);
    return (
      <View key={`${ref.block}-${i}-${item.exerciseId}`} style={styles.card}>
        <View style={styles.cardHead}>
          {supersetLetter ? <Text style={styles.letter}>{`${supersetLetter}${i + 1}`}</Text> : null}
          <Text style={styles.name}>{nameOf(item.exerciseId)}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Options for ${nameOf(item.exerciseId)}`}
            onPress={() => setOptions(ref)}
            style={styles.more}
          >
            <Text style={styles.moreText}>···</Text>
          </Pressable>
        </View>
        <Text style={styles.dose}>{[doseText(item.sets, item.dose), rir].filter(Boolean).join(' · ')}</Text>
        {log.sets.map((entry, set) => {
          const open = editing && same(editing.ref, ref) && editing.set === set ? editing : null;
          const isTiming = timing !== null && same(timing.ref, ref) && timing.set === set;
          return (
            <View key={set}>
              <SetRow
                index={set}
                entry={entry}
                showWeight={item.slot !== null}
                timer={timed ? {
                  remaining: isTiming ? countdown.remaining : null,
                  onStart: () => {
                    setTiming({ ref, set });
                    countdown.start(entry.seconds ?? 0);
                  },
                  onStop: () => {
                    countdown.stop();
                    setTiming(null);
                  },
                } : undefined}
                onTick={() => onTick(ref, set)}
                onUntick={() => dispatch({ type: 'untick', ref, set })}
                onEdit={field => setEditing(open?.field === field ? null : { ref, set, field })}
              />
              {open ? (
                <NumberEditor
                  key={`${open.field}-${set}`}
                  label={`${open.field === 'weight' ? 'Weight' : open.field === 'reps' ? 'Reps' : 'Seconds'} for set ${set + 1}`}
                  value={entry[open.field]}
                  step={open.field === 'weight' ? INCREMENT_KG[exercise?.equipment[0] ?? 'other'] : open.field === 'reps' ? 1 : 5}
                  decimal={open.field === 'weight'}
                  onChange={value => dispatch({ type: 'edit', ref, set, field: open.field, value })}
                  onClose={() => setEditing(null)}
                />
              ) : null}
            </View>
          );
        })}
        {item.slot && allDone(ref) ? (
          <ChipRow value={log.chip} onChange={chip => dispatch({ type: 'chip', ref, chip })} />
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      {holdRunning ? <StayAwake /> : null}
      <View style={styles.top}>
        <Text style={styles.kicker}>{title}</Text>
        <Text style={styles.count}>{`${state.step + 1} / ${steps.length}`}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="End" onPress={() => setEnding(true)} style={styles.end}>
          <Text style={styles.endText}>End</Text>
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {state.rest && remaining !== null ? (
          <RestBanner
            remaining={remaining}
            onPlus={() => dispatch({ type: 'restPlus', seconds: 15 })}
            onSkip={() => dispatch({ type: 'restEnd' })}
          >
            {restChip ? (
              <View style={styles.restChip}>
                <Text style={styles.restName}>{`How was ${nameOf(restItem!.exerciseId)}?`}</Text>
                <ChipRow
                  value={state.logs[restChip.block][restChip.item].chip}
                  onChange={chip => dispatch({ type: 'chip', ref: restChip, chip })}
                />
              </View>
            ) : null}
          </RestBanner>
        ) : null}
        {step.items.map(i => card(block.items[i], i))}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          disabled={state.step === 0}
          onPress={() => go(state.step - 1)}
          style={[styles.nav, state.step === 0 && styles.navDisabled]}
        >
          <Text style={styles.navText}>Back</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={last ? 'Finish' : 'Next'}
          onPress={last ? () => void finish() : () => go(state.step + 1)}
          style={[styles.nav, styles.next]}
        >
          <Text style={[styles.navText, styles.nextText]}>{last ? 'Finish' : 'Next'}</Text>
        </Pressable>
      </View>
      <ExerciseSheet
        exercise={optionsItem ? BY_ID.get(optionsItem.exerciseId) ?? null : null}
        swaps={swaps}
        feedback={optionsItem ? feedback[optionsItem.exerciseId] : undefined}
        onSwap={swapTo}
        onFeedback={value => void giveFeedback(value)}
        onClose={() => setOptions(null)}
      />
      <EndSheet visible={ending} onFinish={() => void finish()} onDiscard={discard} onClose={() => setEnding(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  top: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md, paddingHorizontal: tokens.space.lg, paddingTop: tokens.space.sm },
  kicker: { flex: 1, color: tokens.color.inkDim, fontSize: tokens.font.size.sub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  count: { color: tokens.color.inkDim, fontSize: tokens.font.size.sub, fontVariant: ['tabular-nums'] },
  end: { minHeight: 44, minWidth: 44, justifyContent: 'center', alignItems: 'flex-end' },
  endText: { color: tokens.color.accent, fontSize: tokens.font.size.body, fontWeight: '600' },
  scroll: { padding: tokens.space.lg, gap: tokens.space.lg, paddingBottom: tokens.space.xxl },
  card: { gap: tokens.space.xs },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
  more: { minHeight: 44, minWidth: 44, alignItems: 'center', justifyContent: 'center' },
  moreText: { color: tokens.color.inkDim, fontSize: tokens.font.size.lead, fontWeight: '700' },
  letter: { color: tokens.color.accent, fontSize: tokens.font.size.body, fontWeight: '700' },
  name: { flex: 1, color: tokens.color.ink, fontSize: tokens.font.size.lead, fontWeight: '700' },
  dose: { color: tokens.color.inkDim, fontSize: tokens.font.size.sub, marginBottom: tokens.space.xs },
  restChip: { gap: tokens.space.sm },
  restName: { color: tokens.color.inkDim, fontSize: tokens.font.size.sub },
  footer: {
    flexDirection: 'row', gap: tokens.space.md, padding: tokens.space.lg, borderTopColor: tokens.color.line, borderTopWidth: 1,
  },
  nav: { flex: 1, minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.bgElevated },
  navDisabled: { opacity: 0.4 },
  navText: { color: tokens.color.ink, fontSize: tokens.font.size.body, fontWeight: '700' },
  next: { backgroundColor: tokens.color.accent },
  nextText: { color: tokens.color.bg },
});
