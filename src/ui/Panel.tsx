import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import type { Recency } from '../builder';
import { tokens } from '../theme/tokens';

/** Every element sits in a card (spec section 5): surface colour, 20 radius. Pressable when onPress is given. */
export function Panel({ children, onPress, style, testID, label }: {
  children: ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle>; testID?: string; label?: string;
}) {
  if (!onPress) return <View testID={testID} style={[styles.panel, style]}>{children}</View>;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.panel, style, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

export const RECENCY_COLOR: Record<Recency, string> = {
  just: tokens.color.just, recovering: tokens.color.recov, rested: tokens.color.rest, never: tokens.color.ol,
};

export const RECENCY_LABEL: Record<Recency, string> = {
  just: 'Just trained', recovering: 'Recovering', rested: 'Rested', never: 'Not trained yet',
};

/** A thin progress bar on the empty track. */
export function Bar({ fraction, color = tokens.color.on, height = 6 }: { fraction: number; color?: string; height?: number }) {
  return (
    <View style={[styles.track, { height, borderRadius: height / 2 }]}>
      <View style={{ height, borderRadius: height / 2, backgroundColor: color, width: `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%` }} />
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { backgroundColor: tokens.color.sc, borderRadius: tokens.radius.card, padding: tokens.space.md },
  pressed: { backgroundColor: tokens.color.schh },
  track: { backgroundColor: tokens.color.empty, overflow: 'hidden' },
});
