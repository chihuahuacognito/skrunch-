import { Pressable, StyleSheet, Text, View } from 'react-native';
import { GROUP_LABEL, type GroupId } from '../../builder';
import { tokens } from '../../theme/tokens';
import { useMinutesSince } from '../home/TonightStrip';

/** "Tonight", a Home chip, a chip per group opened tonight (current one selected), and "N sets · M min". */
export function TonightBar({ opened, current, sets, firstSetAt, onHome, onGroup }: {
  opened: GroupId[]; current: GroupId; sets: number; firstSetAt: number | null; onHome(): void; onGroup(g: GroupId): void;
}) {
  const minutes = useMinutesSince(firstSetAt);
  return (
    <View style={styles.row}>
      <Text style={styles.label}>Tonight</Text>
      <Pressable testID="chip-home" accessibilityRole="button" accessibilityLabel="Home" onPress={onHome} style={styles.chip}>
        <Text style={styles.chipText}>Home</Text>
      </Pressable>
      {opened.map(g => {
        const on = g === current;
        return (
          <Pressable
            key={g}
            testID={`chip-${g}`}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            onPress={() => !on && onGroup(g)}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.chipText, on && styles.chipTextOn]}>{on ? `✓ ${GROUP_LABEL[g]}` : GROUP_LABEL[g]}</Text>
          </Pressable>
        );
      })}
      <Text style={styles.count}>{`${sets} sets · ${minutes} min`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm, flexWrap: 'wrap' },
  label: { color: tokens.color.onv, fontSize: 12, fontWeight: '500' },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: tokens.color.ol, justifyContent: 'center' },
  chipOn: { backgroundColor: tokens.color.pric, borderColor: tokens.color.pric },
  chipText: { color: tokens.color.on, fontSize: 14, fontWeight: '500' },
  chipTextOn: { color: tokens.color.onpric },
  count: { marginLeft: 'auto', color: tokens.color.onv, fontSize: tokens.font.size.sub, fontVariant: ['tabular-nums'] },
});
