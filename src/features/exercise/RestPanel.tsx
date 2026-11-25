import { useKeepAwake } from 'expo-keep-awake';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import type { Rest } from '../../tonight';
import { clock } from '../../ui/format';
import { Bar } from '../../ui/Panel';
import { useRemaining } from '../../ui/useRemaining';

/** The running rest, pinned at the bottom: countdown, progress, +15 s and Skip. Keeps the screen awake. */
export function RestPanel({ rest, name, onPlus, onSkip }: { rest: Rest; name: string; onPlus(): void; onSkip(): void }) {
  useKeepAwake();
  // The provider ends the rest at endsAt; this only reads the clock for the display.
  const remaining = useRemaining(rest.endsAt, () => {}) ?? rest.seconds;
  return (
    <View testID="rest-panel" style={styles.panel}>
      <View style={styles.head}>
        <View style={styles.what}>
          <Text style={styles.kicker}>REST</Text>
          <Text style={styles.sub}>{`${name} · set ${rest.set} of ${rest.of} done`}</Text>
        </View>
        <Text style={styles.time} accessibilityLiveRegion="polite">{clock(remaining)}</Text>
      </View>
      <Bar fraction={remaining / rest.seconds} color={tokens.color.onpric} />
      <View style={styles.buttons}>
        <Pressable accessibilityRole="button" onPress={onPlus} style={styles.plus}>
          <Text style={styles.plusText}>+15 s</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onSkip} style={styles.skip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: tokens.color.pric, borderRadius: tokens.radius.card, padding: tokens.space.md, gap: 10 },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  what: { flex: 1, gap: 2 },
  kicker: { color: tokens.color.onpric, fontSize: tokens.font.size.sub, fontWeight: '700', letterSpacing: 1 },
  sub: { color: tokens.color.onpric, fontSize: 14 },
  time: { color: tokens.color.onpric, fontSize: 44, fontWeight: '700', fontVariant: ['tabular-nums'] },
  buttons: { flexDirection: 'row', gap: 10 },
  plus: { flex: 1, minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.onpric },
  plusText: { color: tokens.color.pric, fontSize: 16, fontWeight: '500' },
  skip: {
    flex: 1, minHeight: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: tokens.color.onpric,
  },
  skipText: { color: tokens.color.onpric, fontSize: 16, fontWeight: '500' },
});
