import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GROUP_LABEL, trainingDaysList, type LoggedSet } from '../builder';
import { exportFileName, historyExport } from '../backup/export';
import { saveToFolder } from '../backup/saveFile';
import { setText } from '../features/exercise/text';
import { useTonight } from '../features/tonight/useTonight';
import { useDb } from '../store/DbContext';
import { tokens } from '../theme/tokens';
import { dayLabel } from '../ui/labels';
import { LIBRARY } from '../ui/library';
import { Panel } from '../ui/Panel';

const NAMES = new Map(LIBRARY.map(e => [e.id, e.name]));

type ExportState = { kind: 'idle' } | { kind: 'busy' } | { kind: 'saved'; name: string } | { kind: 'failed' };

/** "60 kg × 6, 6, 6", "12 reps, 12, 10", "25 min". */
function setsLine(sets: LoggedSet[]): string {
  const [first, ...rest] = sets;
  if (first.seconds !== null || rest.length === 0) return setText(first);
  return `${setText(first)}, ${rest.map(s => s.reps).join(', ')}`;
}

/** Training days, newest first; tap a day for its exercises. The one-tap export lives here. Read-only. */
export default function HistoryScreen() {
  const db = useDb();
  const { ready, input, today } = useTonight();
  const days = useMemo(() => trainingDaysList(input), [input]);
  const [open, setOpen] = useState<string | null>(null);
  const [exported, setExported] = useState<ExportState>({ kind: 'idle' });

  const exportHistory = async () => {
    setExported({ kind: 'busy' });
    try {
      const name = exportFileName(today);
      const result = await saveToFolder(db, name, await historyExport(db, new Date()));
      setExported(result === 'saved' ? { kind: 'saved', name } : { kind: 'idle' });
    } catch (e) {
      console.warn('export failed', e);
      setExported({ kind: 'failed' });
    }
  };

  if (!ready) return <View testID="screen-history" style={styles.root} />;
  return (
    <SafeAreaView testID="screen-history" style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>History</Text>
        {days.length === 0 ? (
          <Panel><Text style={styles.sub}>Nothing logged yet</Text></Panel>
        ) : days.map(d => {
          const groups = d.groups.map(g => GROUP_LABEL[g]).join(', ') || 'Cardio';
          const expanded = open === d.date;
          return (
            <Panel key={d.date} onPress={() => setOpen(expanded ? null : d.date)} style={styles.day}>
              <Text style={styles.dayText}>{`${dayLabel(d.date)} · ${groups} · ${d.sets} ${d.sets === 1 ? 'set' : 'sets'}`}</Text>
              {expanded ? d.exercises.map((x, i) => (
                <Text key={`${x.exerciseId}-${i}`} style={styles.sub}>{`${NAMES.get(x.exerciseId) ?? x.exerciseId} · ${setsLine(x.sets)}`}</Text>
              )) : null}
            </Panel>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        {exported.kind === 'saved' ? <Text style={styles.status}>{`Saved ${exported.name}`}</Text> : null}
        {exported.kind === 'failed' ? <Text style={styles.status}>Export failed. Try again.</Text> : null}
        <Pressable
          accessibilityRole="button"
          disabled={exported.kind === 'busy'}
          onPress={() => void exportHistory()}
          style={[styles.export, exported.kind === 'busy' && styles.busy]}
        >
          <Text style={styles.exportText}>Export history</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  scroll: { padding: tokens.space.md, gap: tokens.space.sm, paddingBottom: tokens.space.xl },
  title: { color: tokens.color.on, fontSize: tokens.font.size.title, fontWeight: '500', marginLeft: 4, marginBottom: tokens.space.sm },
  day: { gap: tokens.space.sm, paddingHorizontal: tokens.space.lg, minHeight: 52, justifyContent: 'center' },
  dayText: { color: tokens.color.on, fontSize: tokens.font.size.body, fontWeight: '500' },
  sub: { color: tokens.color.onv, fontSize: 14 },
  footer: { padding: tokens.space.md, gap: tokens.space.sm },
  status: { color: tokens.color.onv, fontSize: tokens.font.size.sub, textAlign: 'center' },
  export: { minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: tokens.color.pri },
  busy: { opacity: 0.4 },
  exportText: { color: tokens.color.pri, fontSize: tokens.font.size.body, fontWeight: '500' },
});
