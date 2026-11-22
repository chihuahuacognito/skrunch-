// Minimal Reanimated mock for jest. Reanimated 4.7.1's own 'react-native-reanimated/mock' imports the real
// module, whose jest path throws in setCSSEventHandler under jest-expo. package.json's moduleNameMapper points
// 'react-native-reanimated/mock' here, so every mock path (ours, expo-router's testing library) lands on this.
// It covers only the API the app and Gesture Handler use; animated styles are computed once, on the JS thread.
const { View, Text, ScrollView } = require('react-native');
const Animated = { View, Text, ScrollView, createAnimatedComponent: c => c };
module.exports = {
  __esModule: true,
  default: Animated,
  ...Animated,
  useSharedValue: init => {
    const { useRef } = require('react');
    return useRef({ value: init }).current;
  },
  useAnimatedStyle: fn => fn(),
  useReducedMotion: () => false,
  // Hooks Gesture Handler 3 calls when it finds Reanimated; fireGestureHandler drives gesture callbacks directly.
  useEvent: () => () => {},
  useComposedEventHandler: () => () => {},
  isSharedValue: v => typeof v === 'object' && v !== null && 'value' in v,
  withSpring: v => v,
  withTiming: v => v,
};
