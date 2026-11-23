import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';

/** Ending early: save what was done, throw it away, or carry on. */
export function EndSheet({ visible, onFinish, onDiscard, onClose }: {
  visible: boolean;
  onFinish: () => void;
  onDiscard: () => void;
  onClose: () => void;
}) {
  const row = (label: string, onPress: () => void, tone: 'main' | 'danger' | 'plain') => (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.row}>
      <Text style={[styles.text, tone === 'main' && styles.main, tone === 'danger' && styles.danger]}>{label}</Text>
    </Pressable>
  );
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityElementsHidden importantForAccessibility="no">
        <View />
      </Pressable>
      <View style={styles.sheet}>
        {row('Finish and save', onFinish, 'main')}
        {row('Discard workout', onDiscard, 'danger')}
        {row('Keep going', onClose, 'plain')}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: tokens.color.bgElevated, padding: tokens.space.lg, gap: tokens.space.xs,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  row: { minHeight: 52, justifyContent: 'center' },
  text: { color: tokens.color.ink, fontSize: tokens.font.size.body, fontWeight: '600' },
  main: { color: tokens.color.accent },
  danger: { color: '#FF6B6B' },
});
