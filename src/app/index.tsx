import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { useOnceUntilFocus } from '../ui/useOnceUntilFocus';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CheckIn, Place } from '../builder';
import { ThumbArc, type ArcItem } from '../features/arc/ThumbArc';
import { useToday } from '../ui/useToday';
import { useDb } from '../store/DbContext';
import { clearRest } from '../notify/rest';
import { checkInFor, saveCheckIn } from '../store/history';
import { loadDraft } from '../store/workout';
import { tokens } from '../theme/tokens';
import { CHECKIN_HINT, CHECKIN_LABEL, DESK_RESET_HINT, FOCUS_LABEL, dayLabel } from '../ui/labels';
import { useLoad } from '../ui/useLoad';

const CHECK_INS: CheckIn[] = ['good', 'ok', 'wrecked'];
const CHECKIN_ACCENT: Record<CheckIn, string> = { good: '#34C759', ok: '#FFB454', wrecked: '#FF6B6B' };

const ITEMS: ArcItem[] = [
  ...CHECK_INS.map(c => ({ id: c, label: CHECKIN_LABEL[c], hint: CHECKIN_HINT[c], accent: CHECKIN_ACCENT[c] })),
  { id: 'desk-reset', label: FOCUS_LABEL['desk-reset'], hint: DESK_RESET_HINT, accent: tokens.focusAccent['desk-reset'] },
];

/** Opening screen: tonight's check-in, once per day. Desk reset needs no check-in. */
export default function CheckInScreen() {
  const db = useDb();
  const router = useRouter();
  const { redo } = useLocalSearchParams<{ redo?: string }>();
  const today = useToday();
  const loaded = useLoad(async () => {
    const draft = await loadDraft(db, today);
    // No workout in progress (none, or last night's was just settled): a rest notice left by a killed app is stale.
    if (!draft) void clearRest().catch(e => console.warn('clearing the rest notification failed', e));
    return { draft, saved: await checkInFor(db, today) };
  }, [db, today]);
  const [place, setPlace] = useState<Place | null>(null);
  const once = useOnceUntilFocus();

  if (loaded === undefined) return <View style={styles.root} />;
  const { draft, saved } = loaded;
  if (draft) return <Redirect href="/workout" />;
  if (saved && redo !== '1') return <Redirect href="/menu" />;
  const current: Place = place ?? saved?.place ?? 'gym';

  const onSelect = async (id: string) => {
    if (!once.claim()) return;
    if (id === 'desk-reset') {
      router.push('/desk');
      return;
    }
    try {
      await saveCheckIn(db, today, id as CheckIn, current);
    } catch (e) {
      once.release();
      throw e;
    }
    router.replace('/menu');
  };

  const header = (
    <View style={styles.header}>
      <Text style={styles.day}>{dayLabel(today)}</Text>
      <Text style={styles.question}>How do you feel?</Text>
      <View style={styles.toggle} accessibilityRole="radiogroup">
        {(['gym', 'home'] as const).map(p => {
          const label = p === 'gym' ? 'Gym' : 'Home';
          const on = current === p;
          return (
            <Pressable
              key={p}
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityState={{ selected: on }}
              onPress={() => setPlace(p)}
              style={[styles.segment, on && styles.segmentOn]}
            >
              <Text style={[styles.segmentText, on && styles.segmentTextOn]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <ThumbArc items={ITEMS} onSelect={onSelect} header={header} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: tokens.color.bg },
  header: { gap: tokens.space.sm },
  day: { color: tokens.color.inkDim, fontSize: tokens.font.size.sub },
  question: { color: tokens.color.ink, fontSize: tokens.font.size.title, fontWeight: '700' },
  toggle: { flexDirection: 'row', alignSelf: 'flex-start', borderRadius: 22, backgroundColor: tokens.color.bgElevated, padding: 2 },
  segment: { minWidth: 72, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 20, paddingHorizontal: tokens.space.md },
  segmentOn: { backgroundColor: tokens.color.line },
  segmentText: { color: tokens.color.inkDim, fontSize: tokens.font.size.body, fontWeight: '600' },
  segmentTextOn: { color: tokens.color.ink },
});
