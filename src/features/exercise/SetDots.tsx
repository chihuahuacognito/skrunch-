import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '../../theme/tokens';

/** "Sets" + one numbered dot per planned set (filled = done), "tap = start rest", and Edit. */
export function SetDots({ exerciseId, count, done, onTap, onEdit, hint = 'tap = start rest' }: {
  exerciseId: string; count: number; done: number; onTap(i: number): void; onEdit(): void; hint?: string;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>Sets</Text>
      {Array.from({ length: count }, (_, i) => {
        const filled = i < done;
        const next = i === done;
        return (
          <Pressable
            key={i}
            testID={`dot-${exerciseId}-${i}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: filled }}
            accessibilityLabel={filled ? `Set ${i + 1} done` : `Set ${i + 1}, tap to log and start rest`}
            onPress={() => onTap(i)}
            style={styles.hit}
          >
            <View style={[styles.dot, filled && styles.filled, (filled || next) && styles.ring]}>
              <Text style={[styles.n, filled ? styles.nFilled : next ? styles.nNext : null]}>{i + 1}</Text>
            </View>
          </Pressable>
        );
      })}
      <Text style={styles.hint} numberOfLines={1}>{hint}</Text>
      <Pressable testID={`edit-${exerciseId}`} accessibilityRole="button" accessibilityLabel="Edit" onPress={onEdit} style={styles.edit}>
        <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={tokens.color.pri} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" />
        </Svg>
        <Text style={styles.editText}>Edit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  label: { color: tokens.color.onv, fontSize: 12, fontWeight: '500', marginRight: 4 },
  hit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  dot: {
    width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: tokens.color.ol, alignItems: 'center', justifyContent: 'center',
  },
  ring: { borderColor: tokens.color.pri },
  filled: { backgroundColor: tokens.color.pri },
  n: { color: tokens.color.onv, fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  nFilled: { color: tokens.color.onpri },
  nNext: { color: tokens.color.pri },
  hint: { flex: 1, color: tokens.color.onv, fontSize: 12 },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 4, minHeight: 44, paddingHorizontal: tokens.space.sm },
  editText: { color: tokens.color.pri, fontSize: 14, fontWeight: '500' },
});
