import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tokens } from '../../theme/tokens';
import { Bar, Panel } from '../../ui/Panel';

const HEART = 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10zM5 12h3l2-3 3 6 2-3h4';
const FIGURE = 'M12 4.5a1.5 1.5 0 1 0 0-.01M5 8h14M12 8v6M8 21l4-7 4 7';

function Icon({ d }: { d: string }) {
  return (
    <Svg width={28} height={28} viewBox="0 0 24 24" fill="none" stroke={tokens.color.on} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} />
    </Svg>
  );
}

/** Cardio (Zone 2 minutes this week) and Stretch, side by side. */
export function ActivityCards({ zone2Minutes, zone2Target, onCardio, onStretch }: {
  zone2Minutes: number; zone2Target: number; onCardio(): void; onStretch(): void;
}) {
  return (
    <View style={styles.row}>
      <Panel onPress={onCardio} label={`Cardio, Zone 2 ${zone2Minutes} of ${zone2Target} minutes`} style={styles.card}>
        <Icon d={HEART} />
        <View style={styles.text}>
          <Text style={styles.title}>Cardio</Text>
          <Text style={styles.sub}>{`Zone 2 · ${zone2Minutes}/${zone2Target} min`}</Text>
          <Bar fraction={zone2Minutes / zone2Target} height={4} />
        </View>
      </Panel>
      <Panel onPress={onStretch} label="Stretch, desk and back routine" style={styles.card}>
        <Icon d={FIGURE} />
        <View style={styles.text}>
          <Text style={styles.title}>Stretch</Text>
          <Text style={styles.sub}>Desk & back routine</Text>
        </View>
      </Panel>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: tokens.space.sm },
  card: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: tokens.space.md, minHeight: 72 },
  text: { flex: 1, gap: 4 },
  title: { color: tokens.color.on, fontSize: tokens.font.size.name, fontWeight: '500' },
  sub: { color: tokens.color.onv, fontSize: tokens.font.size.sub },
});
