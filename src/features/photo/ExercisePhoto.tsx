import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, AppState, Image, StyleSheet, Text, View } from 'react-native';
import { GROUP_LABEL, type GroupId } from '../../builder';
import { tokens } from '../../theme/tokens';
import { EXERCISE_IMAGES } from '../../ui/images';

// Tunable: how long each photo shows, and the cross-fade between them.
const FRAME_MS = 1200;
const FADE_MS = 140;

/**
 * The library's start and end photo, alternating like a slow GIF. Still (start photo) when animate is false, Reduce
 * Motion is on, or the app is in the background. Exercises without photos show the group's initial.
 */
export function ExercisePhoto({ exerciseId, size, group, animate = true }: {
  exerciseId: string; size: number; group: GroupId; animate?: boolean;
}) {
  const frames = EXERCISE_IMAGES[exerciseId];
  const [frame, setFrame] = useState<0 | 1>(0);
  const [reduceMotion, setReduceMotion] = useState(true);
  const [active, setActive] = useState(AppState.currentState !== 'background');
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let live = true;
    void AccessibilityInfo.isReduceMotionEnabled().then(v => live && setReduceMotion(v));
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    const app = AppState.addEventListener('change', s => setActive(s !== 'background'));
    return () => {
      live = false;
      sub.remove();
      app.remove();
    };
  }, []);

  const moving = !!frames && animate && !reduceMotion && active;
  useEffect(() => {
    if (!moving) {
      setFrame(0);
      return;
    }
    const id = setInterval(() => setFrame(f => (f === 0 ? 1 : 0)), FRAME_MS);
    return () => clearInterval(id);
  }, [moving]);

  useEffect(() => {
    Animated.timing(fade, { toValue: frame, duration: FADE_MS, useNativeDriver: true }).start();
  }, [fade, frame]);

  const box = { width: size, height: size, borderRadius: tokens.radius.inner };
  if (!frames) {
    return (
      <View testID="photo-placeholder" style={[styles.well, box, styles.center]}>
        <Text style={styles.initial}>{GROUP_LABEL[group][0]}</Text>
      </View>
    );
  }
  return (
    <View testID={`photo-frame-${frame}`} style={[styles.well, box]}>
      <Image source={frames[0]} style={StyleSheet.absoluteFill} resizeMode="cover" />
      <Animated.Image source={frames[1]} style={[StyleSheet.absoluteFill, { opacity: fade }]} resizeMode="cover" />
    </View>
  );
}

const styles = StyleSheet.create({
  well: { overflow: 'hidden', backgroundColor: '#FFFFFF' },
  center: { alignItems: 'center', justifyContent: 'center', backgroundColor: tokens.color.sch },
  initial: { color: tokens.color.onv, fontSize: tokens.font.size.target, fontWeight: '700' },
});
