import 'react-native-gesture-handler/jestSetup';

// useSafeAreaInsets() throws without a provider; the library's mock returns zero insets.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Reanimated 4 runs on react-native-worklets, whose native runtime does not exist under jest.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));

// Reanimated 4.7.1's own mock ('react-native-reanimated/mock') imports the real module, whose jest path
// throws in setCSSEventHandler under jest-expo. This covers only the API the app uses; animated styles
// are computed once, on the JS thread.
jest.mock('react-native-reanimated', () => {
  const { View, Text, ScrollView } = require('react-native');
  const Animated = { View, Text, ScrollView, createAnimatedComponent: c => c };
  return {
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
});

