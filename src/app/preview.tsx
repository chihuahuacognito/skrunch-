import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildSession, type Block, type PlannedSession } from '../builder';
import { useToday } from '../ui/useToday';
import { useDb } from '../store/DbContext';
import { checkInFor, loadHistory } from '../store/history';
import { tokens } from '../theme/tokens';
import { blockTitle, doseText, parseOption, weightText } from '../ui/format';
import { FOCUS_LABEL } from '../ui/labels';
import { LIBRARY } from '../ui/library';
import { useLoad } from '../ui/useLoad';

const NAME = new Map(LIBRARY.map(e => [e.id, e.name]));

function tags(s: PlannedSession): string[] {
  const out: string[] = [];
  if (s.deload) out.push('Deload week');
  if (s.calibration) out.push('Calibration week');
  const rir = s.blocks.find(b => b.kind === 'main')?.items[0]?.rir;
  if (rir) out.push(`RIR ${rir[0] === rir[1] ? rir[0] : `${rir[0]}-${rir[1]}`}`);
  return out;
}

/** Tonight's built session, rebuilt from the same inputs the menu used (the builder is deterministic). */
export default function PreviewScreen() {
  const db = useDb();
  const router = useRouter();
  const params = useLocalSearchParams();
  const option = parseOption(params.focus, params.dose);
  const today = useToday();
  const data = useLoad(async () => ({ checkIn: await checkInFor(db, today), history: await loadHistory(db) }), [db, today]);

  const session = useMemo(() => {
    if (!option || !data?.checkIn) return null;
    const input = { library: LIBRARY, history: data.history, today, checkIn: data.checkIn.value, place: data.checkIn.place };
    return buildSession(input, option);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [option?.focus, option?.dose, data, today]);

  if (!option) return <Redirect href="/menu" />;
  if (data === undefined) return <View style={styles.root} />;
  if (!data.checkIn || !session) return <Redirect href="/" />;

  if (session.focus === 'rest') {
    return (
      <SafeAreaView style={[styles.root, styles.rest]}>
        <Text style={styles.restText}>Rest tonight. Walk, stretch, sleep.</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to the menu" onPress={() => router.replace('/menu')} style={styles.secondary}>
          <Text style={styles.secondaryText}>Back to the menu</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  let supersetIndex = 0;
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>{FOCUS_LABEL[session.focus]}</Text>
        <View style={styles.tags}>
          <Text style={styles.minutes}>~{session.estimatedMinutes} min</Text>
          {tags(session).map(t => (
            <Text key={t} style={styles.tag}>{t}</Text>
          ))}
        </View>
        {session.blocks.map((block, i) => {
          const letter = block.kind === 'superset' ? String.fromCharCode(65 + supersetIndex++) : null;
          return <BlockView key={i} block={block} letter={letter} />;
        })}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable accessibilityRole="button" accessibilityLabel="Start" disabled style={[styles.start, styles.startDisabled]}>
          <Text style={styles.startText}>Start</Text>
        </Pressable>
        <Text style={styles.caption}>Logging arrives in the next update</Text>
      </View>
    </SafeAreaView>
  );
}

function BlockView({ block, letter }: { block: Block; letter: string | null }) {
  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>{blockTitle(block.kind)}</Text>
      {block.items.map((item, j) => {
        const weight = weightText(item.weight);
        return (
          <View key={`${item.exerciseId}-${j}`} style={styles.item}>
            {letter ? <Text style={styles.letter}>{`${letter}${j + 1}`}</Text> : null}
            <Text style={styles.name} numberOfLines={2}>{NAME.get(item.exerciseId) ?? item.exerciseId}</Text>
            <Text style={styles.dose}>{doseText(item.sets, item.dose)}</Text>
            {weight ? <Text style={styles.weight}>{weight}</Text> : null}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  scroll: { padding: tokens.space.lg, gap: tokens.space.lg, paddingBottom: tokens.space.xxl },
  title: { color: tokens.color.ink, fontSize: tokens.font.size.title, fontWeight: '700' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm, alignItems: 'center' },
  minutes: { color: tokens.color.ink, fontSize: tokens.font.size.lead, fontWeight: '600' },
  tag: {
    color: tokens.color.inkDim, fontSize: tokens.font.size.sub, borderColor: tokens.color.line, borderWidth: 1,
    borderRadius: 12, paddingHorizontal: tokens.space.sm, paddingVertical: 2,
  },
  block: { gap: tokens.space.sm },
  blockTitle: { color: tokens.color.inkDim, fontSize: tokens.font.size.sub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  item: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm, minHeight: 36 },
  letter: { color: tokens.color.accent, fontSize: tokens.font.size.sub, fontWeight: '700', width: 24 },
  name: { flex: 1, color: tokens.color.ink, fontSize: tokens.font.size.body },
  dose: { color: tokens.color.ink, fontSize: tokens.font.size.body, fontVariant: ['tabular-nums'] },
  weight: { color: tokens.color.inkDim, fontSize: tokens.font.size.sub, minWidth: 56, textAlign: 'right' },
  footer: { padding: tokens.space.lg, gap: tokens.space.xs, borderTopColor: tokens.color.line, borderTopWidth: 1 },
  start: { minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.accent },
  startDisabled: { opacity: 0.4 },
  startText: { color: tokens.color.bg, fontSize: tokens.font.size.body, fontWeight: '700' },
  caption: { color: tokens.color.inkDim, fontSize: tokens.font.size.sub, textAlign: 'center' },
  rest: { justifyContent: 'center', alignItems: 'center', gap: tokens.space.xl, padding: tokens.space.lg },
  restText: { color: tokens.color.ink, fontSize: tokens.font.size.lead, textAlign: 'center' },
  secondary: { minHeight: 44, justifyContent: 'center', paddingHorizontal: tokens.space.lg },
  secondaryText: { color: tokens.color.accent, fontSize: tokens.font.size.body, fontWeight: '600' },
});
