import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  GROUP_LABEL, GROUP_MUSCLES, GROUPS, INCREMENT_KG, groupCredit, isBodyweight, groupStatus, lastLogBefore, pickGroup, tonightSummary,
  type CardPick, type GroupId, type GroupStatus, type LoggedSet, type Target,
} from '../../builder';
import { daysBetween } from '../../builder/dates';
import { BUDGET_TO_REGION, warmup } from '../../builder/parts';
import { DetailSheet } from '../../features/exercise/DetailSheet';
import { EditSheet, type EditValues } from '../../features/exercise/EditSheet';
import { ExerciseCard } from '../../features/exercise/ExerciseCard';
import { EnoughCard, MoreList, WarmupCard } from '../../features/exercise/GroupExtras';
import { RestPanel } from '../../features/exercise/RestPanel';
import { lastText, targetText } from '../../features/exercise/text';
import { TonightBar } from '../../features/exercise/TonightBar';
import { useTonight } from '../../features/tonight/useTonight';
import { tokens } from '../../theme/tokens';
import { setsText } from '../../ui/labels';
import { LIBRARY } from '../../ui/library';
import { Bar, RECENCY_COLOR, RECENCY_LABEL } from '../../ui/Panel';

// Tunable (spec 6.2): the soft "enough for tonight" mark, in direct sets for the group.
const ENOUGH_SETS = 8;

const BY_ID = new Map(LIBRARY.map(e => [e.id, e]));
const NAMES = new Map(LIBRARY.map(e => [e.id, e.name]));
const ROLE_LABEL = { main: 'MAIN LIFT', accessory: 'ACCESSORY' } as const;

type Editing = { id: string; mode: 'weight' | 'full'; then?: 'dot' | 'complete'; index?: number };

function workedText(s: GroupStatus): string {
  if (s.daysSince === null) return RECENCY_LABEL.never;
  const when = s.daysSince === 0 ? 'today' : s.daysSince === 1 ? 'yesterday' : `${s.daysSince} days ago`;
  return `${RECENCY_LABEL[s.recency]} · last worked ${when}`;
}

const isGroup = (v: unknown): v is GroupId => typeof v === 'string' && (GROUPS as readonly string[]).includes(v);

/** One muscle group tonight: header, warm-up, three exercise cards, enough mark, More, rest panel and tonight bar. */
export default function GroupScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const api = useTonight();
  const group = isGroup(id) ? id : null;
  const { ready, openGroup, claimReopen } = api;
  useEffect(() => {
    if (!ready || !group) return;
    // The launch already landed in a group, so Home must not reopen one later.
    claimReopen();
    openGroup(group);
    // Open once per group visit; openGroup changes identity as history reloads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, group]);
  if (!group) return <Redirect href="/" />;
  if (!ready) return <View style={styles.root} />;
  return <Group group={group} />;
}

function Group({ group }: { group: GroupId }) {
  const router = useRouter();
  const api = useTonight();
  const { input, state, today, history } = api;
  const [editing, setEditing] = useState<Editing | null>(null);
  const [detail, setDetail] = useState<string | null>(null);

  const status = useMemo(() => groupStatus(input)[group], [input, group]);
  const summary = useMemo(() => tonightSummary(input), [input]);
  const frozen: CardPick[] = state.cards[group] ?? [];
  const cards: CardPick[] = [
    ...frozen,
    ...(state.promoted[group] ?? []).filter(p => !frozen.some(c => c.exerciseId === p)).map(p => ({ exerciseId: p, role: 'accessory' as const })),
  ];
  const pick = useMemo(() => pickGroup(input, group), [input, group]);
  const moreIds = [...pick.cards.map(c => c.exerciseId), ...pick.more].filter(x => !cards.some(c => c.exerciseId === x));
  const warmupItems = useMemo(() => {
    const regions = [...new Set(GROUP_MUSCLES[group].map(m => BUDGET_TO_REGION[m]))];
    return warmup({ lib: LIBRARY, today, place: 'gym', used: new Set() }, regions, 3).items;
  }, [group, today]);
  const directTonight = history.sessions.filter(s => s.date === today).flatMap(s => s.exercises)
    .reduce((n, x) => n + (BY_ID.get(x.exerciseId) && groupCredit(BY_ID.get(x.exerciseId)!)[group] === 1 ? x.sets.length : 0), 0);

  const last = (id: string) => {
    const l = lastLogBefore(id, history, today);
    return lastText(l ? { days: daysBetween(l.date, today), sets: l.log.sets } : null);
  };

  const onDot = (id: string, i: number) => {
    if (i !== api.doneSets(id).length) return;
    const t = api.targetOf(id);
    if (t.needsWeight) return setEditing({ id, mode: 'weight', then: 'dot', index: i });
    void api.logDot(id, i, t, false);
  };
  const onComplete = (id: string) => {
    const t = api.targetOf(id);
    if (t.needsWeight) return setEditing({ id, mode: 'weight', then: 'complete' });
    void api.complete(id, t, false);
  };

  const editTarget: Target | null = editing ? api.targetOf(editing.id) : null;
  const editDone: LoggedSet[] = editing ? api.doneSets(editing.id) : [];
  const editExercise = editing ? BY_ID.get(editing.id) : undefined;
  const editInitial: EditValues = editTarget ? {
    weight: editDone[0]?.weight ?? editTarget.weight ?? (editExercise?.equipment[0] === 'barbell' ? 20 : 10),
    reps: editTarget.reps === null ? null : editDone[0]?.reps ?? editTarget.reps,
    minutes: editTarget.minutes === null ? null : editDone[0]?.seconds ? Math.round(editDone[0].seconds / 60) : editTarget.minutes,
    // Sets done tonight so far: opening Edit before any set and saving must not mark the exercise completed.
    sets: editDone.length,
  } : { weight: null, reps: null, minutes: null, sets: 0 };
  // Loaded lifts always show their weight, even one once saved at 0 kg; bodyweight lifts never do.
  const showWeight = !!editExercise && !isBodyweight(editExercise);
  const save = (v: EditValues) => {
    if (!editing || !editTarget) return;
    const { id } = editing;
    setEditing(null);
    if (editing.mode === 'weight') {
      const t = { ...editTarget, weight: v.weight, needsWeight: false };
      if (editing.then === 'dot') void api.logDot(id, editing.index ?? 0, t, false);
      else void api.complete(id, t, false);
      return;
    }
    const set: LoggedSet = { weight: showWeight ? v.weight : editTarget.weight, reps: v.reps, seconds: v.minutes === null ? null : v.minutes * 60 };
    void api.edit(id, Array.from({ length: v.sets }, () => set), editTarget, false);
  };

  const home = () => (router.canGoBack() ? router.back() : router.replace('/'));
  return (
    <SafeAreaView testID={`screen-group-${group}`} style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>{GROUP_LABEL[group]}</Text>
          <View style={styles.line}>
            <View style={[styles.dot, { backgroundColor: RECENCY_COLOR[status.recency] }]} />
            <Text style={styles.sub}>{workedText(status)}</Text>
          </View>
          <View style={styles.line}>
            <Text style={styles.sub}>
              <Text style={styles.sets}>{`${setsText(status.sets)}/${status.target}`}</Text> sets this week
            </Text>
            {status.behind ? <Text style={styles.behind}>BEHIND</Text> : null}
          </View>
          <Bar fraction={status.target > 0 ? status.sets / status.target : 0} />
        </View>
        {summary.sets === 0 && warmupItems.length > 0 ? <WarmupCard items={warmupItems} names={NAMES} /> : null}
        {cards.map(c => {
          const e = BY_ID.get(c.exerciseId);
          if (!e) return null;
          return (
            <ExerciseCard
              key={c.exerciseId}
              exerciseId={c.exerciseId}
              name={e.name}
              group={group}
              role={ROLE_LABEL[c.role]}
              target={api.targetOf(c.exerciseId)}
              done={api.doneSets(c.exerciseId)}
              last={last(c.exerciseId)}
              onDot={i => onDot(c.exerciseId, i)}
              onComplete={() => onComplete(c.exerciseId)}
              onEdit={() => setEditing({ id: c.exerciseId, mode: 'full' })}
              onUndo={() => void api.undo(c.exerciseId)}
              onPhoto={() => setDetail(c.exerciseId)}
            />
          );
        })}
        <EnoughCard label={GROUP_LABEL[group]} sets={directTonight} enough={ENOUGH_SETS} />
        <MoreList
          group={group}
          rows={moreIds.map(x => ({ id: x, name: NAMES.get(x) ?? x, target: targetText(api.targetOf(x)), last: last(x) }))}
          onPromote={x => api.promote(group, x)}
        />
      </ScrollView>
      <View style={styles.bottom}>
        {state.rest ? (
          <RestPanel rest={state.rest} name={NAMES.get(state.rest.exerciseId) ?? state.rest.exerciseId} onPlus={() => api.restPlus(15)} onSkip={api.restSkip} />
        ) : null}
        <TonightBar
          opened={state.opened}
          current={group}
          sets={summary.sets}
          firstSetAt={state.firstSetAt}
          onHome={home}
          onGroup={g => router.replace(`/group/${g}`)}
        />
      </View>
      <EditSheet
        visible={editing !== null}
        mode={editing?.mode ?? 'full'}
        title={editing ? (editing.mode === 'weight' ? `Weight for ${NAMES.get(editing.id)}` : `Edit ${NAMES.get(editing.id)}`) : ''}
        initial={editInitial}
        showWeight={showWeight}
        weightStep={INCREMENT_KG[editExercise?.equipment[0] ?? 'other']}
        maxSets={editTarget?.sets ?? 3}
        onSave={save}
        onClose={() => setEditing(null)}
      />
      <DetailSheet
        exercise={detail ? BY_ID.get(detail) ?? null : null}
        group={group}
        history={history}
        feedback={detail ? history.feedback[detail] : undefined}
        onFeedback={v => detail && void api.setFeedback(detail, v)}
        onClose={() => setDetail(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  scroll: { padding: tokens.space.md, gap: 10, paddingBottom: tokens.space.xl },
  header: { backgroundColor: tokens.color.sc, borderRadius: tokens.radius.card, paddingVertical: 14, paddingHorizontal: tokens.space.lg, gap: tokens.space.sm },
  title: { color: tokens.color.on, fontSize: tokens.font.size.title, fontWeight: '500' },
  line: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sub: { color: tokens.color.onv, fontSize: 14 },
  sets: { color: tokens.color.on, fontSize: tokens.font.size.name, fontWeight: '700' },
  behind: {
    color: tokens.color.onerrc, backgroundColor: tokens.color.errc, fontSize: 10, fontWeight: '700',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden',
  },
  bottom: {
    backgroundColor: tokens.color.sch, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: tokens.space.md, gap: 10,
    shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 24, shadowOffset: { width: 0, height: -6 }, elevation: 12,
  },
});
