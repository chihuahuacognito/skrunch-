import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tokens } from '../theme/tokens';
import { GUIDANCE } from '../ui/labels';

const count = (v: unknown): number | null => (typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : null);

/** After a saved session: one line, the static guidance note, and a way out. */
export default function SummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const minutes = count(params.minutes);
  const sets = count(params.sets);
  const exercises = count(params.exercises);
  if (minutes === null || sets === null || exercises === null) return <Redirect href="/" />;

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
  done: { minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.accent },
  doneText: { color: tokens.color.bg, fontSize: tokens.font.size.body, fontWeight: '700' },
});
