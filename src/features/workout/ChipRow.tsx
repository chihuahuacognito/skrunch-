import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Chip } from '../../builder';
import { tokens } from '../../theme/tokens';
import { CHIP_LABEL } from '../../ui/labels';

const CHIPS: Chip[] = ['easy', 'right', 'hard'];

/** The optional last-set chip: easy / right / hard. Tapping the selected chip clears it. */
export function ChipRow({ value, onChange }: { value: Chip | null; onChange: (chip: Chip | null) => void }) {
  return (
    <View style={styles.row}>
      {CHIPS.map(c => {
        const on = value === c;
        return (
          <Pressable
            key={c}
            accessibilityRole="button"
            accessibilityLabel={CHIP_LABEL[c]}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(on ? null : c)}
            style={[styles.chip, on && styles.chipOn]}
          >
            <Text style={[styles.text, on && styles.textOn]}>{CHIP_LABEL[c]}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: tokens.space.sm },
  chip: {
    minHeight: 44, minWidth: 72, paddingHorizontal: tokens.space.md, borderRadius: 22, borderWidth: 1,
    borderColor: tokens.color.line, alignItems: 'center', justifyContent: 'center',
  },
  chipOn: { backgroundColor: tokens.color.accent, borderColor: tokens.color.accent },
  text: { color: tokens.color.ink, fontSize: tokens.font.size.body, fontWeight: '600' },
  textOn: { color: tokens.color.bg },
});
