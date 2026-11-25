import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';
import { weekRangeLabel } from '../../ui/labels';
import { Panel } from '../../ui/Panel';

const LEGEND = [
  { label: 'Just trained', color: tokens.color.just },
  { label: 'Recovering', color: tokens.color.recov },
  { label: 'Rested', color: tokens.color.rest },
];

/** "Last 7 days", the date range, the colour legend. Tapping it opens History. */
export function WeekCard({ today, deload, onPress }: { today: string; deload: boolean; onPress(): void }) {
  return (
    <Panel onPress={onPress} label="Last 7 days. Open history" style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.title}>Last 7 days</Text>
        <Text style={styles.range}>{weekRangeLabel(today)}</Text>
      </View>
      <View style={styles.legend}>
        {LEGEND.map(l => (
          <View key={l.label} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: l.color }]} />
            <Text style={styles.sub}>{l.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.sub}>Fill height = sets vs target</Text>
      {deload ? <Text style={styles.deload}>Lighter week: 2 sets per exercise</Text> : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  card: { gap: tokens.space.sm, paddingHorizontal: tokens.space.lg },
  head: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  title: { color: tokens.color.on, fontSize: tokens.font.size.name, fontWeight: '500' },
  range: { color: tokens.color.onv, fontSize: tokens.font.size.body },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: tokens.space.md },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  sub: { color: tokens.color.onv, fontSize: tokens.font.size.sub },
  deload: { color: tokens.color.pri, fontSize: tokens.font.size.sub, fontWeight: '500' },
});
