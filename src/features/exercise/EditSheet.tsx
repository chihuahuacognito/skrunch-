import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { tokens } from '../../theme/tokens';

const round = (n: number) => Math.round(n * 100) / 100;

export interface EditValues { weight: number | null; reps: number | null; minutes: number | null; sets: number }

/** A labelled stepper: minus, a typed value, plus. Never below `min`. */
function Stepper({ label, noun, value, step, decimal, min = 0, max, onChange }: {
  label: string; noun: string; value: number | null; step: number; decimal: boolean; min?: number; max?: number;
  onChange(v: number | null): void;
}) {
  const [text, setText] = useState(value === null ? '' : String(value));
  useEffect(() => setText(value === null ? '' : String(value)), [value]);
  const clampTo = (n: number) => round(Math.min(max ?? Infinity, Math.max(min, n)));
  const onText = (t: string) => {
    setText(t);
    const clean = t.replace(',', '.').trim();
    if (clean === '') return onChange(null);
    const n = decimal ? Number.parseFloat(clean) : Number.parseInt(clean, 10);
    if (Number.isFinite(n) && n >= min) onChange(clampTo(n));
  };
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.stepper}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Fewer ${noun}`} onPress={() => onChange(clampTo((value ?? 0) - step))} style={styles.btn}>
          <Text style={styles.btnText}>-</Text>
        </Pressable>
        <TextInput
          accessibilityLabel={label}
          value={text}
          onChangeText={onText}
          keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
          selectTextOnFocus
          style={styles.input}
        />
        <Pressable accessibilityRole="button" accessibilityLabel={`More ${noun}`} onPress={() => onChange(clampTo((value ?? 0) + step))} style={styles.btn}>
          <Text style={styles.btnText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

/**
 * Bottom sheet to say what was really done. `weight` mode only asks for the weight (a first-time lift);
 * `full` edits weight, reps (or minutes) and how many sets were done.
 */
export function EditSheet({ visible, mode, title, initial, showWeight, weightStep, maxSets, onSave, onClose }: {
  visible: boolean; mode: 'weight' | 'full'; title: string; initial: EditValues; showWeight: boolean; weightStep: number;
  maxSets: number; onSave(v: EditValues): void; onClose(): void;
}) {
  const [v, setV] = useState(initial);
  useEffect(() => {
    if (visible) setV(initial);
    // Reset only when the sheet opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);
  const valid = (!showWeight || (v.weight !== null && v.weight >= 0)) && (mode === 'weight' || v.reps !== null || v.minutes !== null);
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityElementsHidden importantForAccessibility="no">
        <View />
      </Pressable>
      <View style={styles.sheet}>
        <Text style={styles.title}>{title}</Text>
        {showWeight ? (
          <Stepper label="Weight" noun="weight" value={v.weight} step={weightStep} decimal onChange={weight => setV({ ...v, weight })} />
        ) : null}
        {mode === 'full' && v.reps !== null ? (
          <Stepper label="Reps" noun="reps" value={v.reps} step={1} decimal={false} min={1} onChange={reps => setV({ ...v, reps: reps ?? 1 })} />
        ) : null}
        {mode === 'full' && v.minutes !== null ? (
          <Stepper label="Minutes" noun="minutes" value={v.minutes} step={5} decimal={false} min={1} onChange={minutes => setV({ ...v, minutes: minutes ?? 1 })} />
        ) : null}
        {mode === 'full' ? (
          <Stepper label="Sets" noun="sets" value={v.sets} step={1} decimal={false} min={0} max={maxSets} onChange={sets => setV({ ...v, sets: sets ?? 0 })} />
        ) : null}
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={onClose} style={styles.cancel}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
          <Pressable accessibilityRole="button" disabled={!valid} onPress={() => onSave(v)} style={[styles.save, !valid && styles.disabled]}>
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: tokens.color.sch, padding: tokens.space.lg, gap: tokens.space.md,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
  },
  title: { color: tokens.color.on, fontSize: tokens.font.size.name, fontWeight: '500' },
  field: { gap: tokens.space.xs },
  fieldLabel: { color: tokens.color.onv, fontSize: tokens.font.size.sub },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm },
  btn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.schh },
  btnText: { color: tokens.color.on, fontSize: tokens.font.size.target, fontWeight: '500' },
  input: {
    flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, borderColor: tokens.color.ol, color: tokens.color.on,
    fontSize: tokens.font.size.target, textAlign: 'center', fontVariant: ['tabular-nums'],
  },
  actions: { flexDirection: 'row', gap: tokens.space.md, marginTop: tokens.space.sm },
  cancel: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 26, borderWidth: 1, borderColor: tokens.color.ol },
  cancelText: { color: tokens.color.on, fontSize: tokens.font.size.body, fontWeight: '500' },
  save: { flex: 1, minHeight: 52, alignItems: 'center', justifyContent: 'center', borderRadius: 26, backgroundColor: tokens.color.pri },
  disabled: { opacity: 0.4 },
  saveText: { color: tokens.color.onpri, fontSize: tokens.font.size.body, fontWeight: '700' },
});
