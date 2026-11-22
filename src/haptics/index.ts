import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Light 'tick' on selection change. Fire-and-forget; from worklets call runOnJS(tick)().
export function tick(): void {
  if (Platform.OS === 'android') {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } else {
    Haptics.selectionAsync();
  }
}

// Stronger confirmation for a discrete outcome (a selection). Medium - one step above
// tick()'s Light so the two are distinguishable on Android. Fire-and-forget.
export function impact(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
}
