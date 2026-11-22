import 'react-native-gesture-handler/jestSetup';

// useSafeAreaInsets() throws without a provider; the library's mock returns zero insets.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Reanimated 4 runs on react-native-worklets, whose native runtime does not exist under jest.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));

// Reanimated 4.7.1's own mock crashes under jest-expo; package.json maps 'react-native-reanimated/mock'
// to jest/reanimatedMock.js.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));
