import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GROUP_MUSCLES, GROUPS, tonightSummary } from '../builder';
import { BUDGET_TO_REGION, cooldown } from '../builder/parts';
import { ExercisePhoto } from '../features/photo/ExercisePhoto';
import { useTonight } from '../features/tonight/useTonight';
import { tokens } from '../theme/tokens';
import { doseText } from '../ui/format';
import { LIBRARY } from '../ui/library';
import { Panel } from '../ui/Panel';

const NAMES = new Map(LIBRARY.map(e => [e.id, e.name]));

/** The daily desk reset, and a cool-down for tonight's groups (all regions when nothing was trained). Nothing is logged. */
export default function StretchScreen() {
  const router = useRouter();
  const { ready, input, today } = useTonight();
  const items = useMemo(() => {
    const trained = tonightSummary(input).groups;
    const groups = trained.length > 0 ? trained : GROUPS;
    const regions = [...new Set(groups.flatMap(g => GROUP_MUSCLES[g]).map(m => BUDGET_TO_REGION[m]))];
    return cooldown({ lib: LIBRARY, today, place: 'home', used: new Set() }, regions, 5).items;
  }, [input, today]);
  if (!ready) return <View testID="screen-stretch" style={styles.root} />;
  return (
    <SafeAreaView testID="screen-stretch" style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Stretch</Text>
        <Panel onPress={() => router.push('/desk')} label="Desk reset, 5 to 10 minutes" style={styles.card}>
          <Text style={styles.name}>Desk reset</Text>
          <Text style={styles.sub}>Back, hips and hamstrings · 5-10 min</Text>
        </Panel>
        <Panel style={styles.card}>
          <Text style={styles.name}>Cool-down</Text>
          {items.map(i => (
            <View key={i.exerciseId} testID={`cooldown-${i.exerciseId}`} style={styles.row}>
              <ExercisePhoto exerciseId={i.exerciseId} size={56} initial={NAMES.get(i.exerciseId)?.[0]} animate={false} />
              <View style={styles.rowText}>
                <Text style={styles.rowName}>{NAMES.get(i.exerciseId) ?? i.exerciseId}</Text>
                <Text style={styles.sub}>{doseText(i.sets, i.dose)}</Text>
              </View>
            </View>
          ))}
        </Panel>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  scroll: { padding: tokens.space.md, gap: tokens.space.md, paddingBottom: tokens.space.xl },
  title: { color: tokens.color.on, fontSize: tokens.font.size.title, fontWeight: '500', marginLeft: 4 },
  card: { gap: tokens.space.sm, paddingHorizontal: tokens.space.lg },
  name: { color: tokens.color.on, fontSize: tokens.font.size.name, fontWeight: '500' },
  sub: { color: tokens.color.onv, fontSize: tokens.font.size.sub },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md, minHeight: 64 },
  rowText: { flex: 1, gap: 2 },
  rowName: { color: tokens.color.on, fontSize: tokens.font.size.body, fontWeight: '500' },
});
