import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { tokens } from '../../theme/tokens';

/** Minutes since the first set tonight, refreshed every 30 s. */
export function useMinutesSince(since: number | null): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (since === null) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, [since]);
  return since === null ? 0 : Math.max(0, Math.floor((now - since) / 60_000));
}

/** "Tonight  1 group  6 sets  34 min", pinned at the bottom of Home. */
export function TonightStrip({ groups, sets, firstSetAt }: { groups: number; sets: number; firstSetAt: number | null }) {
  const minutes = useMinutesSince(firstSetAt);
  return (
    <View testID="tonight-strip" style={styles.strip} accessibilityLabel={`Tonight: ${groups} groups, ${sets} sets, ${minutes} minutes`}>
      <Text style={styles.label}>Tonight</Text>
      <Text style={styles.value}>{`${groups} ${groups === 1 ? 'group' : 'groups'}`}</Text>
      <Text style={styles.value}>{`${sets} ${sets === 1 ? 'set' : 'sets'}`}</Text>
      <Text style={styles.value}>{`${minutes} min`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: tokens.color.pric,
    borderRadius: tokens.radius.card, paddingHorizontal: tokens.space.lg, minHeight: 52,
  },
  label: { color: tokens.color.onpric, fontSize: tokens.font.size.body, fontWeight: '500' },
  value: { color: tokens.color.onpric, fontSize: tokens.font.size.body, fontVariant: ['tabular-nums'] },
});
