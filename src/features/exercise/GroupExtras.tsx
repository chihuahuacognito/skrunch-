import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import type { GroupId, PlannedExercise } from '../../builder';
import { tokens } from '../../theme/tokens';
import { doseText } from '../../ui/format';
import { ExercisePhoto } from '../photo/ExercisePhoto';

const Chevron = ({ open }: { open: boolean }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={tokens.color.on} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
    <Path d="M6 9l6 6 6-6" />
  </Svg>
);

/** Collapsed "Warm-up · 3 moves · ~5 min"; expands to the moves. Nothing is logged. */
export function WarmupCard({ items, names }: { items: PlannedExercise[]; names: Map<string, string> }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={styles.head}>
        <Text style={styles.title}>{`Warm-up · ${items.length} moves · ~5 min`}</Text>
        <Chevron open={open} />
      </Pressable>
      {open ? items.map(i => (
        <Text key={i.exerciseId} style={styles.item}>{`${names.get(i.exerciseId) ?? i.exerciseId} · ${doseText(i.sets, i.dose)}`}</Text>
      )) : null}
    </View>
  );
}

/** "About 8 sets is enough for tonight"; turns green at the mark. Never blocks anything. */
export function EnoughCard({ label, sets, enough }: { label: string; sets: number; enough: number }) {
  const reached = sets >= enough;
  const color = reached ? tokens.color.onokc : tokens.color.on;
  return (
    <View testID="enough-card" accessibilityState={{ checked: reached }} style={[styles.enough, reached && styles.enoughDone]}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
        <Path d="M4 21V4M4 4h12l-2 4 2 4H4" />
      </Svg>
      <View style={styles.enoughText}>
        <Text style={[styles.title, { color }]}>{`About ${enough} sets is enough for tonight`}</Text>
        <Text style={[styles.sub, { color }]}>{`${label} tonight: ${sets} sets. Anything past here is a bonus.`}</Text>
      </View>
    </View>
  );
}

/** Collapsed "More exercises"; each row promotes that exercise to a full card for tonight. */
export function MoreList({ group, rows, onPromote }: {
  group: GroupId; rows: { id: string; name: string; target: string; last: string }[]; onPromote(id: string): void;
}) {
  const [open, setOpen] = useState(false);
  if (rows.length === 0) return null;
  return (
    <View style={styles.card}>
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} style={styles.head}>
        <Text style={styles.title}>More exercises</Text>
        <Chevron open={open} />
      </Pressable>
      {open ? rows.map(r => (
        <Pressable key={r.id} testID={`more-row-${r.id}`} accessibilityRole="button" accessibilityLabel={`Add ${r.name}`} onPress={() => onPromote(r.id)} style={styles.row}>
          <ExercisePhoto exerciseId={r.id} size={48} group={group} animate={false} />
          <View style={styles.rowText}>
            <Text style={styles.rowName}>{r.name}</Text>
            <Text style={styles.sub}>{`${r.target} · ${r.last}`}</Text>
          </View>
        </Pressable>
      )) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: tokens.color.sc, borderRadius: 16, paddingHorizontal: tokens.space.lg, paddingVertical: 4, gap: tokens.space.sm },
  head: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: tokens.color.on, fontSize: tokens.font.size.body, fontWeight: '500' },
  item: { color: tokens.color.onv, fontSize: 14, paddingBottom: tokens.space.sm },
  sub: { color: tokens.color.onv, fontSize: tokens.font.size.sub },
  enough: {
    borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: tokens.color.ol, padding: tokens.space.md,
    paddingHorizontal: tokens.space.lg, flexDirection: 'row', alignItems: 'center', gap: tokens.space.md,
  },
  enoughDone: { backgroundColor: tokens.color.okc },
  enoughText: { flex: 1, gap: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.md, minHeight: 56, paddingBottom: tokens.space.sm },
  rowText: { flex: 1, gap: 2 },
  rowName: { color: tokens.color.on, fontSize: tokens.font.size.body, fontWeight: '500' },
});
