import { useRouter } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { blockState, cardioWeek, groupStatus, tonightSummary, type GroupId } from '../builder';
import { BodyFigure } from '../features/body/BodyFigure';
import { ActivityCards } from '../features/home/ActivityCards';
import { GroupGrid } from '../features/home/GroupGrid';
import { TonightStrip } from '../features/home/TonightStrip';
import { WeekCard } from '../features/home/WeekCard';
import { useTonight } from '../features/tonight/useTonight';
import { tokens } from '../theme/tokens';
import { Panel } from '../ui/Panel';

// Tunable: reopening the app this soon after the last action lands back in the last group (spec 6).
const REOPEN_MS = 45 * 60 * 1000;

/** Home: the week at a glance on the body figure and the group grid; Cardio and Stretch; tonight so far. */
export default function Home() {
  const router = useRouter();
  const { ready, input, today, history, state, claimReopen } = useTonight();
  const status = useMemo(() => groupStatus(input), [input]);
  const cardio = useMemo(() => cardioWeek(input), [input]);
  const tonight = useMemo(() => tonightSummary(input), [input]);
  const deload = useMemo(() => blockState(history, today).deload, [history, today]);

  useEffect(() => {
    if (!ready || !claimReopen()) return;
    const recent = state.lastActionAt !== null && Date.now() - state.lastActionAt < REOPEN_MS;
    if (state.lastGroup && (state.rest || recent)) router.push(`/group/${state.lastGroup}`);
    // Only on the first ready render of this launch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const open = (g: GroupId) => router.push(`/group/${g}`);
  if (!ready) return <View style={styles.root} />;
  return (
    <SafeAreaView style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <WeekCard today={today} deload={deload} onPress={() => router.push('/history')} />
        <Panel style={styles.figure}>
          <BodyFigure status={status} selected={state.lastGroup} onSelect={open} />
        </Panel>
        <Panel>
          <GroupGrid status={status} selected={state.lastGroup} onSelect={open} />
        </Panel>
        <ActivityCards
          zone2Minutes={cardio.zone2Minutes}
          zone2Target={cardio.zone2Target}
          onCardio={() => router.push('/cardio')}
          onStretch={() => router.push('/stretch')}
        />
      </ScrollView>
      {tonight.sets > 0 ? (
        <View style={styles.bottom}>
          <TonightStrip groups={tonight.groups.length} sets={tonight.sets} firstSetAt={state.firstSetAt} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  scroll: { padding: tokens.space.md, gap: tokens.space.md, paddingBottom: tokens.space.xxl },
  figure: { paddingVertical: tokens.space.lg },
  bottom: { paddingHorizontal: tokens.space.md, paddingBottom: tokens.space.md },
});
