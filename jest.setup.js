import 'react-native-gesture-handler/jestSetup';

// useSafeAreaInsets() throws without a provider; the library's mock returns zero insets.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
