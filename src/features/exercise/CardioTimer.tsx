import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { clock } from '../../ui/format';

/**
 * An optional elapsed-time timer for timed cardio, shown while the app is open. It never logs: Completed (or Edit)
 * does. No notification, so nothing fights the locked phone.
 */
export function CardioTimer({ onEdit }: { onEdit(): void }) {
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (startedAt === null) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [startedAt]);
  const running = startedAt !== null;
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setNow(Date.now());
          setStartedAt(running ? null : Date.now());
        }}
        style={[styles.button, running && styles.running]}
      >
        <Text style={[styles.buttonText, running && styles.runningText]}>{running ? 'Stop timer' : 'Start timer'}</Text>
      </Pressable>
      {running ? <Text style={styles.elapsed}>{clock((now - startedAt) / 1000)}</Text> : <View style={styles.spacer} />}
      <Pressable accessibilityRole="button" accessibilityLabel="Edit" onPress={onEdit} style={styles.edit}>
        <Text style={styles.editText}>Edit</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md },
  button: { minHeight: 44, paddingHorizontal: tokens.space.lg, borderRadius: 22, borderWidth: 1, borderColor: tokens.color.pri, justifyContent: 'center' },
  running: { backgroundColor: tokens.color.pric, borderColor: tokens.color.pric },
  buttonText: { color: tokens.color.pri, fontSize: 14, fontWeight: '500' },
  runningText: { color: tokens.color.onpric },
  elapsed: { flex: 1, color: tokens.color.on, fontSize: tokens.font.size.target, fontWeight: '700', fontVariant: ['tabular-nums'] },
  spacer: { flex: 1 },
  edit: { minHeight: 44, justifyContent: 'center', paddingHorizontal: tokens.space.sm },
  editText: { color: tokens.color.pri, fontSize: 14, fontWeight: '500' },
});
