import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';
import { impact, tick } from './index';

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium' },
}));

beforeEach(() => jest.clearAllMocks());

test('tick is a light impact on android', () => {
  Platform.OS = 'android';
  tick();
  expect(Haptics.impactAsync).toHaveBeenCalledWith('light');
});

test('impact is a medium impact', () => {
  impact();
  expect(Haptics.impactAsync).toHaveBeenCalledWith('medium');
});
