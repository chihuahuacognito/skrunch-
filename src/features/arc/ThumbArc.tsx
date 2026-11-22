import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useReducedMotion, useSharedValue, type SharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { impact, tick } from '../../haptics';
import { tokens } from '../../theme/tokens';
import { initArc, reduceArc, type ArcInput, type ArcState } from './arcMachine';
import { arcLayout, bowX, nearestIndex, scaleFor, type ArcEdge } from './geometry';

export type ArcItem = { id: string; label: string; hint?: string; accent: string };

const A = tokens.arc;
const MAG = tokens.motion.magnify;

/**
 * The thumb arc, ported from langocard's ArcNav / ArcRail / ArcBubble without the category/card split:
 * a curved column of labelled items on one screen edge. Tap an item, or sweep along the arc and release.
 * Item centers are computed here from the root's size, so gesture y and item positions share one
 * coordinate space and no per-item onLayout is needed.
 */
export function ThumbArc({
  items,
  onSelect,
  edge = 'right',
  header,
}: {
  items: ArcItem[];
  onSelect: (id: string) => void;
  edge?: ArcEdge;
  header?: ReactNode;
}) {
  const reduce = useReducedMotion();
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [focused, setFocused] = useState(-1);

  const { bandTop, bandH, centers } = useMemo(() => arcLayout(items.length, size.height, A), [items.length, size.height]);
  const headerH = size.height * (1 - A.bandFraction);
  const cancelX = edge === 'right' ? size.width * A.cancelFraction : size.width * (1 - A.cancelFraction);

  const thumbY = useSharedValue(-1); // -1 = no sweep in progress

  // Latest values for the JS-side gesture handlers (the gesture itself is built once).
  const latest = useRef({ items, onSelect, centers, cancelX, edge, focused });
  latest.current = { items, onSelect, centers, cancelX, edge, focused };
  const machine = useRef<ArcState>(initArc());

  const select = useCallback((id: string) => {
    impact();
    latest.current.onSelect(id);
  }, []);

  const sample = useCallback((kind: ArcInput['kind'], x: number, y: number) => {
    const l = latest.current;
    const r = reduceArc(machine.current, { kind, x, y }, { cancelX: l.cancelX, edge: l.edge });
    machine.current = r.state;
    if (r.state.engaged && l.centers.length) {
      const i = nearestIndex(l.centers, y);
      if (i !== l.focused) {
        tick();
        latest.current.focused = i;
        setFocused(i);
      }
    }
    if (r.event) {
      latest.current.focused = -1;
      setFocused(-1);
      if (r.event.type === 'select' && l.centers.length) select(l.items[nearestIndex(l.centers, r.event.y)].id);
    }
  }, [select]);

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .maxPointers(1)
        .withTestId('thumb-arc-pan')
        .onBegin(e => {
          scheduleOnRN(sample, 'down', e.x, e.y);
        })
        .onStart(e => {
          thumbY.value = e.y;
          scheduleOnRN(sample, 'engage', e.x, e.y);
        })
        .onUpdate(e => {
          thumbY.value = e.y;
          scheduleOnRN(sample, 'move', e.x, e.y);
        })
        // success is false when the gesture failed or the system cancelled it (back gesture, app switch).
        .onFinalize((e, success) => {
          thumbY.value = -1;
          scheduleOnRN(sample, success ? 'up' : 'cancel', e.x, e.y);
        }),
    [sample, thumbY],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ width, height });
  };

  const focusedItem = focused >= 0 ? items[focused] : undefined;
  // The read-out sits on the far side of the screen from the thumb and tracks it vertically.
  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: thumbY.value < 0 ? 0 : thumbY.value - A.itemHeight }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <View style={styles.root} onLayout={onLayout} testID="thumb-arc">
        {header ? <View style={[styles.header, { height: headerH }]}>{header}</View> : null}
        {items.map((item, i) => (
          <ArcRow
            key={item.id}
            item={item}
            centerY={centers[i] ?? 0}
            bx={bowX(centers[i] ?? 0, bandTop, bandH, A.arcDepth, edge)}
            edge={edge}
            focused={i === focused}
            reduce={reduce}
            thumbY={thumbY}
            onPress={() => select(item.id)}
          />
        ))}
        {focusedItem ? (
          <Animated.View
            pointerEvents="none"
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            style={[styles.bubble, edge === 'right' ? styles.bubbleLeft : styles.bubbleRight, bubbleStyle]}
          >
            <View style={[styles.bubbleDot, { backgroundColor: focusedItem.accent }]} />
            <Text style={styles.bubbleLabel}>{focusedItem.label}</Text>
            {focusedItem.hint ? <Text style={styles.bubbleHint}>{focusedItem.hint}</Text> : null}
          </Animated.View>
        ) : null}
      </View>
    </GestureDetector>
  );
}

function ArcRow({
  item, centerY, bx, edge, focused, reduce, thumbY, onPress,
}: {
  item: ArcItem;
  centerY: number;
  bx: number;
  edge: ArcEdge;
  focused: boolean;
  reduce: boolean;
  thumbY: SharedValue<number>;
  onPress: () => void;
}) {
  // Continuous fisheye on the UI thread. Under Reduce Motion the scale stays 1 and the focused row
  // gets a solid highlight instead, so focus is still visible.
  const magStyle = useAnimatedStyle(() => {
    const scale = reduce || thumbY.value < 0 ? 1 : scaleFor(centerY - thumbY.value, MAG.maxScale, MAG.falloffPx);
    const opacity = thumbY.value < 0 ? 1 : A.restOpacity + (1 - A.restOpacity) * ((scale - 1) / (MAG.maxScale - 1));
    return { opacity: reduce ? 1 : opacity, transform: [{ translateX: bx }, { scale }] };
  });
  const right = edge === 'right';
  return (
    <Animated.View
      style={[
        styles.row,
        right ? styles.rowRight : styles.rowLeft,
        { top: centerY - A.itemHeight / 2, transformOrigin: right ? 'right center' : 'left center' },
        magStyle,
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityHint={item.hint}
        onPress={onPress}
        style={[styles.pill, right ? styles.pillRight : styles.pillLeft, focused && reduce && styles.pillFocused]}
      >
        <Text style={styles.label} numberOfLines={1}>{item.label}</Text>
        <View style={[styles.dot, { backgroundColor: item.accent }]} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { position: 'absolute', top: 0, left: 0, right: 0, justifyContent: 'center', paddingHorizontal: tokens.space.lg },
  row: { position: 'absolute', height: A.itemHeight, justifyContent: 'center' },
  rowRight: { right: tokens.space.md },
  rowLeft: { left: tokens.space.md },
  pill: {
    minHeight: 44,
    alignItems: 'center',
    gap: tokens.space.sm,
    paddingHorizontal: tokens.space.md,
    borderRadius: 22,
  },
  pillRight: { flexDirection: 'row' },
  pillLeft: { flexDirection: 'row-reverse' },
  pillFocused: { backgroundColor: tokens.color.bgElevated },
  label: { color: tokens.color.ink, fontSize: tokens.font.size.body, fontWeight: '600' },
  dot: { width: 14, height: 14, borderRadius: 7 },
  bubble: {
    position: 'absolute',
    top: 0,
    width: A.bubbleWidth,
    padding: tokens.space.md,
    gap: tokens.space.xs,
    borderRadius: 12,
    backgroundColor: tokens.color.bgElevated,
    borderColor: tokens.color.line,
    borderWidth: 1,
  },
  bubbleLeft: { left: tokens.space.lg },
  bubbleRight: { right: tokens.space.lg },
  bubbleDot: { width: 10, height: 10, borderRadius: 5 },
  bubbleLabel: { color: tokens.color.ink, fontSize: tokens.font.size.lead, fontWeight: '700' },
  bubbleHint: { color: tokens.color.inkDim, fontSize: tokens.font.size.sub },
});
