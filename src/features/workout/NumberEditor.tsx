import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { tokens } from '../../theme/tokens';

const round = (n: number) => Math.round(n * 100) / 100;

/** Inline number editor under a set row: minus, a typed value, plus, and Done. Never goes below 0. */
export function NumberEditor({ label, value, step, decimal, onChange, onClose }: {
  label: string;
  value: number | null;
  step: number;
  decimal: boolean;
  onChange: (value: number | null) => void;
  onClose: () => void;
}) {
  const [text, setText] = useState(value === null ? '' : String(value));

  const set = (n: number | null) => {
    setText(n === null ? '' : String(n));
    onChange(n);
  };
  const onText = (t: string) => {
    setText(t);
    const clean = t.replace(',', '.').trim();
    if (clean === '') return onChange(null);
    const n = decimal ? Number.parseFloat(clean) : Number.parseInt(clean, 10);
    if (Number.isFinite(n) && n >= 0) onChange(round(n));
  };

  return (
    <View style={styles.root}>
      <Pressable accessibilityRole="button" accessibilityLabel="Less" onPress={() => set(round(Math.max(0, (value ?? 0) - step)))} style={styles.btn}>
        <Text style={styles.btnText}>-</Text>
      </Pressable>
      <TextInput
        accessibilityLabel={label}
        value={text}
        onChangeText={onText}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        selectTextOnFocus
        autoFocus={value === null}
        style={styles.input}
      />
      <Pressable accessibilityRole="button" accessibilityLabel="More" onPress={() => set(round((value ?? 0) + step))} style={styles.btn}>
        <Text style={styles.btnText}>+</Text>
      </Pressable>
      <Pressable accessibilityRole="button" accessibilityLabel="Done" onPress={onClose} style={styles.done}>
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm, paddingVertical: tokens.space.xs },
  btn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.bgElevated },
  btnText: { color: tokens.color.ink, fontSize: tokens.font.size.lead, fontWeight: '600' },
  input: {
    flex: 1, minHeight: 44, borderRadius: 10, borderWidth: 1, borderColor: tokens.color.line, color: tokens.color.ink,
    fontSize: tokens.font.size.lead, textAlign: 'center', fontVariant: ['tabular-nums'],
  },
  done: { minHeight: 44, minWidth: 64, justifyContent: 'center', alignItems: 'center' },
  doneText: { color: tokens.color.accent, fontSize: tokens.font.size.body, fontWeight: '700' },
});
