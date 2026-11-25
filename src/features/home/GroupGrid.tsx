import { StyleSheet, Text, View } from 'react-native';
import { GROUP_LABEL, GROUPS, type GroupId, type GroupStatus } from '../../builder';
import { tokens } from '../../theme/tokens';
import { agoText, setsText } from '../../ui/labels';
import { Bar, Panel, RECENCY_COLOR } from '../../ui/Panel';

/** Three rows of three group cards: recency, sets vs target, a bar, BEHIND. */
export function GroupGrid({ status, selected, onSelect }: {
  status: Record<GroupId, GroupStatus>; selected: GroupId | null; onSelect(g: GroupId): void;
}) {
  return (
    <View style={styles.grid}>
      {GROUPS.map(g => {
        const s = status[g];
        return (
          <Panel
            key={g}
            testID={`group-card-${g}`}
            label={`${GROUP_LABEL[g]}, ${agoText(s.daysSince)}, ${setsText(s.sets)} of ${s.target} sets${s.behind ? ', behind' : ''}`}
            onPress={() => onSelect(g)}
            style={[styles.card, selected === g && styles.selected]}
          >
            <Text style={styles.name} numberOfLines={1}>{GROUP_LABEL[g]}</Text>
            <View style={styles.ago}>
              <View style={[styles.dot, { backgroundColor: RECENCY_COLOR[s.recency] }]} />
              <Text style={styles.agoText}>{agoText(s.daysSince)}</Text>
            </View>
            <View style={styles.numbers}>
              <Text style={styles.sets}>{`${setsText(s.sets)}/${s.target}`}</Text>
              {s.behind ? <Text style={styles.behind}>BEHIND</Text> : null}
            </View>
            <Bar fraction={s.target > 0 ? s.sets / s.target : 0} height={4} />
          </Panel>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.sm },
  card: { width: '31.5%', backgroundColor: tokens.color.sch, borderRadius: 16, gap: 4, padding: tokens.space.md },
  selected: { borderWidth: 2, borderColor: tokens.color.pri },
  name: { color: tokens.color.on, fontSize: tokens.font.size.body, fontWeight: '500' },
  ago: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  agoText: { color: tokens.color.onv, fontSize: tokens.font.size.sub },
  numbers: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  sets: { color: tokens.color.on, fontSize: tokens.font.size.name, fontWeight: '700', fontVariant: ['tabular-nums'] },
  behind: {
    color: tokens.color.onerrc, backgroundColor: tokens.color.errc, fontSize: 10, fontWeight: '700',
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden',
  },
});
