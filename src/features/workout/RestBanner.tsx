import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { clock } from '../../ui/format';

/** The running rest: time left, +15 s and Skip. children carries the just-finished exercise's chip, when it has one. */
export function RestBanner({ remaining, onPlus, onSkip, children }: {
  remaining: number;
  onPlus: () => void;
  onSkip: () => void;
  children?: ReactNode;
}) {
  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Text style={styles.kicker}>Rest</Text>
        <Text style={styles.time} accessibilityRole="timer">{clock(remaining)}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="+15 s" onPress={onPlus} style={styles.btn}>
          <Text style={styles.btnText}>+15 s</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Skip" onPress={onSkip} style={styles.btn}>
          <Text style={styles.btnText}>Skip</Text>
        </Pressable>
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: tokens.space.sm, padding: tokens.space.md, borderRadius: 16, backgroundColor: tokens.color.bgElevated },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md },
  kicker: { color: tokens.color.inkDim, fontSize: tokens.font.size.sub, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  time: { flex: 1, color: tokens.color.ink, fontSize: tokens.font.size.title, fontWeight: '700', fontVariant: ['tabular-nums'] },
  btn: { minHeight: 44, minWidth: 56, justifyContent: 'center', alignItems: 'center' },
  btnText: { color: tokens.color.accent, fontSize: tokens.font.size.body, fontWeight: '700' },
});
