import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { cardioPicks, cardioWeek, isInterval, lastLogBefore, type LoggedSet } from '../builder';
import { daysBetween } from '../builder/dates';
import { CardioTimer } from '../features/exercise/CardioTimer';
import { DetailSheet } from '../features/exercise/DetailSheet';
import { EditSheet, type EditValues } from '../features/exercise/EditSheet';
import { ExerciseCard } from '../features/exercise/ExerciseCard';
import { RestPanel } from '../features/exercise/RestPanel';
import { lastText } from '../features/exercise/text';
import { useTonight } from '../features/tonight/useTonight';
import { tokens } from '../theme/tokens';
import { LIBRARY } from '../ui/library';
import { Bar, Panel } from '../ui/Panel';

const BY_ID = new Map(LIBRARY.map(e => [e.id, e]));

/** Zone 2 minutes toward the weekly target and the interval cap, then every Zone 2 and interval item. */
export default function CardioScreen() {
  const api = useTonight();
  const { ready, input, history, today, state } = api;
  const week = useMemo(() => cardioWeek(input), [input]);
  const picks = useMemo(() => cardioPicks(input), [input]);
  const [editing, setEditing] = useState<string | null>(null);
  const [detail, setDetail] = useState<string | null>(null);
  if (!ready) return <View testID="screen-cardio" style={styles.root} />;

  const intervalsOf = (id: string) => isInterval(BY_ID.get(id)!);
  const last = (id: string) => {
    const l = lastLogBefore(id, history, today);
    return lastText(l ? { days: daysBetween(l.date, today), sets: l.log.sets } : null);
  };
  const card = (id: string) => {
    const e = BY_ID.get(id)!;
    const target = api.targetOf(id);
    const timed = target.minutes !== null;
    return (
      <ExerciseCard
        key={id}
        exerciseId={id}
        name={e.name}
        role={!intervalsOf(id) ? 'STEADY' : timed ? 'TIMED' : 'ROUNDS'}
        target={target}
        done={api.doneSets(id)}
        last={last(id)}
        onDot={i => i === api.doneSets(id).length && void api.logDot(id, i, target, intervalsOf(id))}
        onComplete={() => void api.complete(id, target, intervalsOf(id))}
        onEdit={() => setEditing(id)}
        onUndo={() => void api.undo(id)}
        onPhoto={() => setDetail(id)}
        timer={timed ? <CardioTimer onEdit={() => setEditing(id)} /> : undefined}
      />
    );
  };

  const editTarget = editing ? api.targetOf(editing) : null;
  const editDone: LoggedSet[] = editing ? api.doneSets(editing) : [];
  const initial: EditValues = editTarget ? {
    weight: null,
    reps: editTarget.reps === null ? null : editDone[0]?.reps ?? editTarget.reps,
    minutes: editTarget.minutes === null ? null : editDone[0]?.seconds ? Math.round(editDone[0].seconds / 60) : editTarget.minutes,
    sets: editDone.length || editTarget.sets,
  } : { weight: null, reps: null, minutes: null, sets: 0 };
  const save = (v: EditValues) => {
    if (!editing || !editTarget) return;
    const set: LoggedSet = { weight: null, reps: v.reps, seconds: v.minutes === null ? null : v.minutes * 60 };
    void api.edit(editing, Array.from({ length: v.sets }, () => set), editTarget, intervalsOf(editing));
    setEditing(null);
  };

  return (
    <SafeAreaView testID="screen-cardio" style={styles.root} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Panel style={styles.header}>
          <Text style={styles.title}>Cardio</Text>
          <Text style={styles.line}>{`Zone 2 · ${week.zone2Minutes}/${week.zone2Target} min`}</Text>
          <Bar fraction={week.zone2Minutes / week.zone2Target} />
          <Text style={styles.line}>{`Intervals · ${week.intervalDays}/${week.intervalCap} this week`}</Text>
        </Panel>
        <Text style={styles.section}>ZONE 2</Text>
        {picks.zone2.map(card)}
        <Text style={styles.section}>INTERVALS</Text>
        {week.intervalDays >= week.intervalCap ? <Text style={styles.note}>{`${week.intervalDays} of ${week.intervalCap} done this week`}</Text> : null}
        {picks.intervals.map(card)}
      </ScrollView>
      {state.rest ? (
        <View style={styles.bottom}>
          <RestPanel rest={state.rest} name={BY_ID.get(state.rest.exerciseId)?.name ?? ''} onPlus={() => api.restPlus(15)} onSkip={api.restSkip} />
        </View>
      ) : null}
      <EditSheet
        visible={editing !== null}
        mode="full"
        title={editing ? `Edit ${BY_ID.get(editing)?.name}` : ''}
        initial={initial}
        showWeight={false}
        weightStep={2.5}
        maxSets={editTarget?.sets ?? 1}
        onSave={save}
        onClose={() => setEditing(null)}
      />
      <DetailSheet
        exercise={detail ? BY_ID.get(detail) ?? null : null}
        history={history}
        feedback={detail ? history.feedback[detail] : undefined}
        onFeedback={() => {}}
        onClose={() => setDetail(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  scroll: { padding: tokens.space.md, gap: 10, paddingBottom: tokens.space.xl },
  header: { gap: tokens.space.sm, paddingHorizontal: tokens.space.lg },
  title: { color: tokens.color.on, fontSize: tokens.font.size.title, fontWeight: '500' },
  line: { color: tokens.color.onv, fontSize: 14 },
  section: { color: tokens.color.onv, fontSize: tokens.font.size.label, fontWeight: '700', letterSpacing: 1, marginTop: tokens.space.sm, marginLeft: 4 },
  note: { color: tokens.color.onv, fontSize: tokens.font.size.sub, marginLeft: 4 },
  bottom: { backgroundColor: tokens.color.sch, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: tokens.space.md },
});
