import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { exportFileName, historyExport } from '../backup/export';
import { saveToFolder } from '../backup/saveFile';
import { useDb } from '../store/DbContext';
import { tokens } from '../theme/tokens';
import { GUIDANCE } from '../ui/labels';
import { useToday } from '../ui/useToday';

type ExportState = { kind: 'idle' } | { kind: 'busy' } | { kind: 'saved'; name: string } | { kind: 'failed' };

const count = (v: unknown): number | null => (typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : null);

/** After a saved session: one line, the static guidance note, and a way out. */
export default function SummaryScreen() {
  const router = useRouter();
  const db = useDb();
  const today = useToday();
  const [exported, setExported] = useState<ExportState>({ kind: 'idle' });
  const params = useLocalSearchParams();
  const minutes = count(params.minutes);
  const sets = count(params.sets);
  const exercises = count(params.exercises);
  if (minutes === null || sets === null || exercises === null) return <Redirect href="/" />;

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

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.body}>
        <Text style={styles.title}>Saved</Text>
        <Text style={styles.line}>{`${minutes} min · ${sets} sets · ${exercises} exercises`}</Text>
        <View style={styles.note}>
          {GUIDANCE.map(g => (
            <Text key={g} style={styles.guidance}>{g}</Text>
          ))}
        </View>
      </View>
      <View style={styles.footer}>
        {exported.kind === 'saved' ? <Text style={styles.status}>{`Saved ${exported.name}`}</Text> : null}
        {exported.kind === 'failed' ? <Text style={styles.status}>Export failed. Try again.</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Export history"
          disabled={exported.kind === 'busy'}
          onPress={() => void exportHistory()}
          style={[styles.secondary, exported.kind === 'busy' && styles.busy]}
        >
          <Text style={styles.secondaryText}>Export history</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={() => router.replace('/')} style={styles.done}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  body: { flex: 1, justifyContent: 'center', padding: tokens.space.lg, gap: tokens.space.md },
  title: { color: tokens.color.ink, fontSize: tokens.font.size.hero, fontWeight: '700' },
  line: { color: tokens.color.ink, fontSize: tokens.font.size.lead, fontVariant: ['tabular-nums'] },
  note: { marginTop: tokens.space.xl, gap: tokens.space.xs },
  guidance: { color: tokens.color.inkDim, fontSize: tokens.font.size.sub },
  footer: { padding: tokens.space.lg, gap: tokens.space.sm },
  status: { color: tokens.color.inkDim, fontSize: tokens.font.size.sub, textAlign: 'center' },
  secondary: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { color: tokens.color.accent, fontSize: tokens.font.size.body, fontWeight: '600' },
  busy: { opacity: 0.4 },
  done: { minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.accent },
  doneText: { color: tokens.color.bg, fontSize: tokens.font.size.body, fontWeight: '700' },
});
