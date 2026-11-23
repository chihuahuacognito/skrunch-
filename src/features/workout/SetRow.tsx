import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { clock, secondsText, weightText } from '../../ui/format';
import type { SetEntry } from '../../workout';

/**
 * One set: its number, the weight and reps (or time) cells that open the editor, an optional timer for holds and timed
 * work, and the tick. A tap on a done tick does nothing; a long-press undoes it.
 */
export function SetRow({ index, entry, showWeight, timer, onTick, onUntick, onEdit }: {
  index: number;
  entry: SetEntry;
  showWeight: boolean;
  timer?: { remaining: number | null; onStart: () => void; onStop: () => void };
  onTick: () => void;
  onUntick: () => void;
  onEdit: (field: 'weight' | 'reps' | 'seconds') => void;
}) {
  const n = index + 1;
  const timed = entry.seconds !== null;
  const running = timer?.remaining != null;
  return (
    <View style={[styles.row, entry.done && styles.rowDone]}>
      <Text style={styles.label}>{`Set ${n}`}</Text>
      {showWeight ? (
        <Pressable accessibilityRole="button" accessibilityLabel={`Weight, set ${n}`} onPress={() => onEdit('weight')} style={styles.cell}>
          <Text style={[styles.value, entry.weight === null && styles.missing]}>{weightText(entry.weight) ?? 'Add kg'}</Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={timed ? `Time, set ${n}` : `Reps, set ${n}`}
        onPress={() => onEdit(timed ? 'seconds' : 'reps')}
        style={styles.cell}
      >
        <Text style={styles.value}>{timed ? secondsText(entry.seconds ?? 0) : `${entry.reps ?? 0} reps`}</Text>
      </Pressable>
      {timer && !entry.done ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={running ? 'Stop timer' : `Start ${secondsText(entry.seconds ?? 0)}`}
          onPress={running ? timer.onStop : timer.onStart}
          style={styles.timer}
        >
          <Text style={styles.timerText}>{running ? clock(timer.remaining ?? 0) : 'Start'}</Text>
        </Pressable>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={entry.done ? `Set ${n} done` : `Log set ${n}`}
        accessibilityHint={entry.done ? 'Long-press to undo' : undefined}
        onPress={entry.done ? undefined : onTick}
        onLongPress={entry.done ? onUntick : undefined}
        style={[styles.tick, entry.done && styles.tickDone]}
      >
        <Text style={[styles.tickText, entry.done && styles.tickTextDone]}>✓</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm, minHeight: 52 },
  rowDone: { opacity: 0.6 },
  label: { width: 48, color: tokens.color.inkDim, fontSize: tokens.font.size.sub },
  cell: { flex: 1, minHeight: 44, justifyContent: 'center' },
  value: { color: tokens.color.ink, fontSize: tokens.font.size.body, fontVariant: ['tabular-nums'] },
  missing: { color: tokens.color.accent },
  timer: { minHeight: 44, minWidth: 64, justifyContent: 'center', alignItems: 'center' },
  timerText: { color: tokens.color.accent, fontSize: tokens.font.size.body, fontWeight: '700', fontVariant: ['tabular-nums'] },
  tick: {
    width: 52, height: 52, borderRadius: 26, borderWidth: 2, borderColor: tokens.color.line,
    alignItems: 'center', justifyContent: 'center',
  },
  tickDone: { backgroundColor: tokens.color.accent, borderColor: tokens.color.accent },
  tickText: { color: tokens.color.inkDim, fontSize: tokens.font.size.lead, fontWeight: '700' },
  tickTextDone: { color: tokens.color.bg },
});
