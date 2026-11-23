import 'react-native-gesture-handler/jestSetup';

// useSafeAreaInsets() throws without a provider; the library's mock returns zero insets.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);

// Reanimated 4 runs on react-native-worklets, whose native runtime does not exist under jest.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));

// Reanimated 4.7.1's own mock crashes under jest-expo; package.json maps 'react-native-reanimated/mock'
// to jest/reanimatedMock.js.
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// expo-notifications has no native module under jest. Every call the app makes resolves; tests read the mocks.
jest.mock('expo-notifications', () => ({
  AndroidImportance: { LOW: 4, DEFAULT: 5, HIGH: 6 },
  SchedulableTriggerInputTypes: { DATE: 'date' },
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationCategoryAsync: jest.fn(async () => ({})),
  getPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  requestPermissionsAsync: jest.fn(async () => ({ granted: true, canAskAgain: true })),
  scheduleNotificationAsync: jest.fn(async () => 'id'),
  cancelScheduledNotificationAsync: jest.fn(async () => {}),
  dismissNotificationAsync: jest.fn(async () => {}),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  getLastNotificationResponseAsync: jest.fn(async () => null),
  clearLastNotificationResponseAsync: jest.fn(async () => {}),
}));

// expo-file-system's native folder picker and SAF writes, as an in-memory fake (see jest/expoFileSystemMock.js).
jest.mock('expo-file-system', () => require('./jest/expoFileSystemMock'));
