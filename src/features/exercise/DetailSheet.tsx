import { Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { Feedback, GroupId, History } from '../../builder';
import type { Exercise } from '../../library/types';
import { tokens } from '../../theme/tokens';
import { dayLabel, FEEDBACK_LABEL } from '../../ui/labels';
import { ExercisePhoto } from '../photo/ExercisePhoto';
import { setText } from './text';

const FEEDBACK: Feedback[] = ['more', 'less', 'never'];

/** The last `n` days an exercise was logged, newest first: "Wed 25 Nov · 60 kg × 8, 8, 8". */
export function recentLogs(id: string, history: History, n = 5): string[] {
  return history.sessions
    .flatMap(s => s.exercises.filter(x => x.exerciseId === id && x.sets.length > 0).map(x => ({ date: s.date, sets: x.sets })))
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, n)
    .map(({ date, sets }) => {
      const first = sets[0];
      const tail = first.reps !== null && first.seconds === null ? `, ${sets.slice(1).map(s => s.reps).join(', ')}` : '';
      return `${dayLabel(date)} · ${setText(first)}${sets.length > 1 ? tail : ''}`;
    });
}

/** Large photos, instructions, the last 5 logs, More / Less / Never, and the post link for Instagram exercises. */
export function DetailSheet({ exercise, group, history, feedback, onFeedback, onClose }: {
  exercise: Exercise | null; group: GroupId; history: History; feedback: Feedback | undefined;
  onFeedback(v: Feedback | null): void; onClose(): void;
}) {
  const logs = exercise ? recentLogs(exercise.id, history) : [];
  return (
    <Modal visible={exercise !== null} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} accessibilityElementsHidden importantForAccessibility="no">
        <View />
      </Pressable>
      {exercise ? (
        <View style={styles.sheet}>
          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.photo}>
              <ExercisePhoto exerciseId={exercise.id} size={240} group={group} />
            </View>
            <Text style={styles.title}>{exercise.name}</Text>
            {exercise.instructions.map((line, i) => <Text key={i} style={styles.line}>{line}</Text>)}
            <Text style={styles.heading}>Last 5</Text>
            {logs.length === 0 ? <Text style={styles.line}>Never done</Text> : logs.map(l => <Text key={l} style={styles.line}>{l}</Text>)}
            <View style={styles.chips}>
              {FEEDBACK.map(f => {
                const on = feedback === f;
                return (
                  <Pressable
                    key={f}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    onPress={() => onFeedback(on ? null : f)}
                    style={[styles.chip, on && styles.chipOn]}
                  >
                    <Text style={[styles.chipText, on && styles.chipTextOn]}>{FEEDBACK_LABEL[f]}</Text>
                  </Pressable>
                );
              })}
            </View>
            {exercise.sourceUrl ? (
              <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(exercise.sourceUrl!)} style={styles.link}>
                <Text style={styles.linkText}>Open the original post</Text>
              </Pressable>
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet: { maxHeight: '85%', backgroundColor: tokens.color.sch, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  body: { padding: tokens.space.lg, gap: tokens.space.sm },
  photo: { alignItems: 'center', marginBottom: tokens.space.sm },
  title: { color: tokens.color.on, fontSize: tokens.font.size.target, fontWeight: '500' },
  heading: { color: tokens.color.onv, fontSize: tokens.font.size.label, fontWeight: '700', letterSpacing: 1, marginTop: tokens.space.md },
  line: { color: tokens.color.onv, fontSize: tokens.font.size.body, lineHeight: 22 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm, marginTop: tokens.space.md },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, borderColor: tokens.color.ol, justifyContent: 'center' },
  chipOn: { backgroundColor: tokens.color.pric, borderColor: tokens.color.pric },
  chipText: { color: tokens.color.on, fontSize: 14, fontWeight: '500' },
  chipTextOn: { color: tokens.color.onpric },
  link: { minHeight: 44, justifyContent: 'center' },
  linkText: { color: tokens.color.pri, fontSize: tokens.font.size.body, fontWeight: '500' },
});
