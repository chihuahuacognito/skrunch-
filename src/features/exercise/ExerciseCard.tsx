import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { GroupId, LoggedSet, Target } from '../../builder';
import { tokens } from '../../theme/tokens';
import { ExercisePhoto } from '../photo/ExercisePhoto';
import { SetDots } from './SetDots';
import { doneText, targetText } from './text';

const CHECK = 'M5 12.5l4.5 4.5L19 7.5';

function Check({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round">
      <Path d={CHECK} />
    </Svg>
  );
}

/**
 * One exercise: role, photo, name, exact target, last time, set dots, Completed, and the green Completed row with Undo.
 * `timer` replaces the dots for timed work (Cardio).
 */
export function ExerciseCard({ exerciseId, name, group, role, target, done, last, onDot, onComplete, onEdit, onUndo, onPhoto, timer }: {
  exerciseId: string; name: string; group?: GroupId; role: string; target: Target; done: LoggedSet[]; last: string;
  onDot(i: number): void; onComplete(): void; onEdit(): void; onUndo(): void; onPhoto(): void; timer?: ReactNode;
}) {
  const complete = done.length >= target.sets;
  return (
    <View testID={`exercise-card-${exerciseId}`} style={styles.card}>
      <Text style={styles.role}>{role}</Text>
      <View style={styles.top}>
        <Pressable testID={`photo-${exerciseId}`} accessibilityRole="button" accessibilityLabel={`Enlarge ${name} demo`} onPress={onPhoto}>
          <ExercisePhoto exerciseId={exerciseId} size={96} group={group} initial={group ? undefined : name[0]} />
          <View style={styles.enlarge}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke={tokens.color.on} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
            </Svg>
          </View>
        </Pressable>
        <View style={styles.text}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.target}>{targetText(target)}</Text>
          <Text style={styles.last}>{last}</Text>
        </View>
      </View>
      {complete ? (
        <View style={styles.doneRow}>
          <Check color={tokens.color.onokc} />
          <Text style={styles.doneText}>{`Completed · ${doneText(done)}`}</Text>
          <Pressable testID={`undo-${exerciseId}`} accessibilityRole="button" accessibilityLabel="Undo" onPress={onUndo} style={styles.undo}>
            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={tokens.color.onokc} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" />
            </Svg>
            <Text style={styles.undoText}>Undo</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {timer ?? <SetDots exerciseId={exerciseId} count={target.sets} done={done.length} onTap={onDot} onEdit={onEdit} />}
          <Pressable
            testID={`complete-${exerciseId}`}
            accessibilityRole="button"
            accessibilityLabel={`Completed ${name}`}
            onPress={onComplete}
            style={({ pressed }) => [styles.complete, pressed && styles.pressed]}
          >
            <Check color={tokens.color.onpri} />
            <Text style={styles.completeText}>Completed</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: tokens.color.sc, borderRadius: tokens.radius.card, padding: tokens.space.md, gap: 10 },
  role: { color: tokens.color.onv, fontSize: tokens.font.size.label, fontWeight: '700', letterSpacing: 1 },
  top: { flexDirection: 'row', gap: tokens.space.md, alignItems: 'flex-start' },
  enlarge: {
    position: 'absolute', right: 4, bottom: 4, width: 22, height: 22, borderRadius: 6, backgroundColor: tokens.color.sc,
    alignItems: 'center', justifyContent: 'center',
  },
  text: { flex: 1, gap: 3 },
  name: { color: tokens.color.on, fontSize: tokens.font.size.name, fontWeight: '500' },
  target: { color: tokens.color.on, fontSize: tokens.font.size.target, fontWeight: '700', fontVariant: ['tabular-nums'] },
  last: { color: tokens.color.onv, fontSize: tokens.font.size.sub },
  complete: {
    backgroundColor: tokens.color.pri, borderRadius: tokens.radius.pill, minHeight: 56, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: tokens.space.sm,
  },
  pressed: { opacity: 0.85 },
  completeText: { color: tokens.color.onpri, fontSize: 17, fontWeight: '500' },
  doneRow: {
    backgroundColor: tokens.color.okc, borderRadius: 16, paddingVertical: 6, paddingRight: 6, paddingLeft: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  doneText: { flex: 1, color: tokens.color.onokc, fontSize: tokens.font.size.body, fontWeight: '500' },
  undo: {
    flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: tokens.space.lg,
    borderRadius: 20, borderWidth: 1, borderColor: tokens.color.onokc,
  },
  undoText: { color: tokens.color.onokc, fontSize: 14, fontWeight: '500' },
});
