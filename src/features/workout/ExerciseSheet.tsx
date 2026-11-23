import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Feedback } from '../../builder';
import type { Exercise } from '../../library/types';
import { tokens } from '../../theme/tokens';
import { FEEDBACK_LABEL } from '../../ui/labels';

const FEEDBACK: Feedback[] = ['more', 'less', 'never'];
const SWAP_LIMIT = 5;

/**
 * Options for one exercise: swap it (only before its first set), say more / less / never for future sessions, and
 * open the Instagram post it came from.
 */
export function ExerciseSheet({ exercise, swaps, feedback, onSwap, onFeedback, onClose }: {
  exercise: Exercise | null;
  /** null when swapping is not offered. */
  swaps: Exercise[] | null;
  feedback: Feedback | undefined;
  onSwap: (exerciseId: string) => void;
  onFeedback: (value: Feedback | null) => void;
  onClose: () => void;
}) {
  const [listing, setListing] = useState(false);
  const close = () => {
    setListing(false);
    onClose();
  };
  const row = (label: string, onPress: () => void, selected?: boolean) => (
    <Pressable
      key={label}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={selected === undefined ? undefined : { selected }}
      onPress={onPress}
      style={[styles.row, selected && styles.rowOn]}
    >
      <Text style={[styles.text, selected && styles.textOn]}>{label}</Text>
    </Pressable>
  );

  return (
    <Modal visible={exercise !== null} transparent animationType="fade" onRequestClose={close}>
      <Pressable style={styles.scrim} onPress={close} accessibilityElementsHidden importantForAccessibility="no">
        <View />
      </Pressable>
      {exercise ? (
        <View style={styles.sheet}>
          <Text style={styles.title}>{exercise.name}</Text>
          <ScrollView style={styles.list}>
            {swaps && swaps.length > 0 ? row('Swap', () => setListing(l => !l)) : null}
            {listing && swaps ? swaps.slice(0, SWAP_LIMIT).map(e => (
              <Pressable
                key={e.id}
                accessibilityRole="button"
                accessibilityLabel={`Swap to ${e.name}`}
                onPress={() => {
                  setListing(false);
                  onSwap(e.id);
                }}
                style={[styles.row, styles.candidate]}
              >
                <Text style={styles.text}>{e.name}</Text>
              </Pressable>
            )) : null}
            {FEEDBACK.map(f => row(FEEDBACK_LABEL[f], () => onFeedback(feedback === f ? null : f), feedback === f))}
            {exercise.sourceUrl ? row('Open the original post', () => void Linking.openURL(exercise.sourceUrl!)) : null}
          </ScrollView>
          {row('Close', close)}
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: {
    backgroundColor: tokens.color.bgElevated, padding: tokens.space.lg, gap: tokens.space.xs, maxHeight: '75%',
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
  },
  title: { color: tokens.color.inkDim, fontSize: tokens.font.size.sub, fontWeight: '600', marginBottom: tokens.space.xs },
  list: { flexGrow: 0 },
  row: { minHeight: 52, justifyContent: 'center', paddingHorizontal: tokens.space.sm, borderRadius: 12 },
  rowOn: { backgroundColor: tokens.color.line },
  candidate: { paddingLeft: tokens.space.xl },
  text: { color: tokens.color.ink, fontSize: tokens.font.size.body, fontWeight: '600' },
  textOn: { color: tokens.color.accent },
});
