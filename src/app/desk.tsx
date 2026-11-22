import { useRouter } from 'expo-router';
import { useKeepAwake } from 'expo-keep-awake';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildDeskReset } from '../builder';
import { impact } from '../haptics';
import { useToday } from '../ui/useToday';
import { tokens } from '../theme/tokens';
import { doseText } from '../ui/format';
import { LIBRARY } from '../ui/library';
import { useCountdown } from '../ui/useCountdown';

const BY_ID = new Map(LIBRARY.map(e => [e.id, e]));

/** The desk reset, one item at a time. Holds have a timer that moves on by itself. Nothing is saved. */
export default function DeskScreen() {
  // Holds run hands-free; a screen timeout would lock the phone mid-hold.
  useKeepAwake();
  const router = useRouter();
  const today = useToday();
  const items = useMemo(() => buildDeskReset(LIBRARY, today).blocks.flatMap(b => b.items), [today]);
  const [index, setIndex] = useState(0);
  const timer = useCountdown(() => {
    impact();
    setIndex(i => Math.min(i + 1, items.length - 1));
  });

  const item = items[index];
  const exercise = BY_ID.get(item.exerciseId);
  const last = index === items.length - 1;

  const leave = () => (router.canGoBack() ? router.back() : router.replace('/'));
  const go = (to: number) => {
    timer.stop();
    setIndex(to);
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.top}>
        <Text style={styles.kicker}>Desk reset</Text>
        <Text style={styles.count}>{`${index + 1} / ${items.length}`}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{exercise?.name ?? item.exerciseId}</Text>
        <Text style={styles.dose}>{doseText(item.sets, item.dose)}</Text>
        {exercise?.instructions.slice(0, 2).map((line, i) => (
          <Text key={i} style={styles.instruction}>{line}</Text>
        ))}
        {item.dose.format === 'hold' ? (
          timer.remaining !== null ? (
            <Text style={styles.timer} accessibilityLiveRegion="polite">{`${timer.remaining}`}</Text>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Start ${item.dose.seconds} s`}
              onPress={() => item.dose.format === 'hold' && timer.start(item.dose.seconds)}
              style={styles.startHold}
            >
              <Text style={styles.startHoldText}>{`Start ${item.dose.seconds} s`}</Text>
            </Pressable>
          )
        ) : null}
      </View>
      <View style={styles.nav}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          disabled={index === 0}
          onPress={() => go(index - 1)}
          style={[styles.navButton, index === 0 && styles.hidden]}
        >
          <Text style={styles.navText}>Back</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={last ? 'Done' : 'Next'}
          onPress={() => (last ? (timer.stop(), leave()) : go(index + 1))}
          style={[styles.navButton, styles.primary]}
        >
          <Text style={[styles.navText, styles.primaryText]}>{last ? 'Done' : 'Next'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg, padding: tokens.space.lg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kicker: { color: tokens.focusAccent['desk-reset'], fontSize: tokens.font.size.sub, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  count: { color: tokens.color.inkDim, fontSize: tokens.font.size.body, fontVariant: ['tabular-nums'] },
  body: { flex: 1, justifyContent: 'center', gap: tokens.space.md },
  name: { color: tokens.color.ink, fontSize: tokens.font.size.title, fontWeight: '700' },
  dose: { color: tokens.color.ink, fontSize: tokens.font.size.lead },
  instruction: { color: tokens.color.inkDim, fontSize: tokens.font.size.body, lineHeight: 22 },
  timer: { color: tokens.color.ink, fontSize: 72, fontWeight: '700', fontVariant: ['tabular-nums'] },
  startHold: {
    alignSelf: 'flex-start', minHeight: 48, justifyContent: 'center', paddingHorizontal: tokens.space.lg,
    borderRadius: 24, borderColor: tokens.focusAccent['desk-reset'], borderWidth: 2,
  },
  startHoldText: { color: tokens.color.ink, fontSize: tokens.font.size.body, fontWeight: '600' },
  nav: { flexDirection: 'row', justifyContent: 'space-between', gap: tokens.space.md },
  navButton: { flex: 1, minHeight: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.bgElevated },
  hidden: { opacity: 0 },
  primary: { backgroundColor: tokens.focusAccent['desk-reset'] },
  navText: { color: tokens.color.ink, fontSize: tokens.font.size.body, fontWeight: '700' },
  primaryText: { color: tokens.color.bg },
});
