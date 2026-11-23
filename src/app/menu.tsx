import { Redirect, useRouter } from 'expo-router';
import { useOnceUntilFocus } from '../ui/useOnceUntilFocus';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { buildSession, rankFocuses, type BuilderInput } from '../builder';
import { ThumbArc, type ArcItem } from '../features/arc/ThumbArc';
import { useToday } from '../ui/useToday';
import { useDb } from '../store/DbContext';
import { checkInFor, loadHistory } from '../store/history';
import { loadDraft } from '../store/workout';
import { tokens } from '../theme/tokens';
import { CHECKIN_LABEL, DESK_RESET_HINT, DOSE_LABEL, FOCUS_LABEL } from '../ui/labels';
import { LIBRARY } from '../ui/library';
import { useLoad } from '../ui/useLoad';

const REST_HINT = 'Walk, stretch, sleep';

/** Tonight's options in the builder's order (id "<focus>:<dose>"), then the desk reset. */
export function menuItems(input: BuilderInput): ArcItem[] {
  const options = rankFocuses(input).map(option => {
    const minutes = `~${buildSession(input, option).estimatedMinutes} min`;
    const hint = option.focus === 'rest' ? REST_HINT : option.dose === 'full' ? minutes : `${DOSE_LABEL[option.dose]} · ${minutes}`;
    return { id: `${option.focus}:${option.dose}`, label: FOCUS_LABEL[option.focus], hint, accent: tokens.focusAccent[option.focus] };
  });
  return [...options, { id: 'desk-reset', label: FOCUS_LABEL['desk-reset'], hint: DESK_RESET_HINT, accent: tokens.focusAccent['desk-reset'] }];
}

export default function MenuScreen() {
  const db = useDb();
  const router = useRouter();
  const today = useToday();
  const once = useOnceUntilFocus();
  const data = useLoad(async () => ({
    draft: await loadDraft(db, today),
    checkIn: await checkInFor(db, today),
    history: await loadHistory(db),
  }), [db, today]);

  const items = useMemo(() => {
    if (!data?.checkIn) return [];
    return menuItems({ library: LIBRARY, history: data.history, today, checkIn: data.checkIn.value, place: data.checkIn.place });
  }, [data, today]);

  if (data === undefined) return <View style={styles.root} />;
  // Tonight's workout is already under way: picking another focus would only resume it.
  if (data.draft) return <Redirect href="/workout" />;
  if (!data.checkIn) return <Redirect href="/" />;
  const { value, place } = data.checkIn;

  const onSelect = (id: string) => {
    if (!once.claim()) return;
    if (id === 'desk-reset') {
      router.push('/desk');
      return;
    }
    const [focus, dose] = id.split(':');
    router.push({ pathname: '/preview', params: { focus, dose } });
  };

  const header = (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Checked in ${CHECKIN_LABEL[value]} at ${place}. Change`}
        onPress={() => router.replace({ pathname: '/', params: { redo: '1' } })}
        style={styles.checkIn}
      >
        <Text style={styles.checkInText}>
          {CHECKIN_LABEL[value]} · {place === 'gym' ? 'Gym' : 'Home'}
        </Text>
        <Text style={styles.change}>Change</Text>
      </Pressable>
      <Text style={styles.title}>Tonight</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <ThumbArc items={items} onSelect={onSelect} header={header} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  header: { gap: tokens.space.sm },
  checkIn: { flexDirection: 'row', alignItems: 'center', gap: tokens.space.sm, minHeight: 44, alignSelf: 'flex-start' },
  checkInText: { color: tokens.color.inkDim, fontSize: tokens.font.size.body },
  change: { color: tokens.color.accent, fontSize: tokens.font.size.body, fontWeight: '600' },
  title: { color: tokens.color.ink, fontSize: tokens.font.size.title, fontWeight: '700' },
});
