import { act, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { ExercisePhoto } from '../../features/photo/ExercisePhoto';

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

const flush = () => act(async () => { await Promise.resolve(); });

test('alternates the start and end photo every 1.2 s', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  await render(<ExercisePhoto exerciseId="Barbell_Squat" size={96} group="quads" />);
  await flush();
  expect(screen.getByTestId('photo-frame-0')).toBeTruthy();
  await act(async () => { jest.advanceTimersByTime(1200); });
  expect(screen.getByTestId('photo-frame-1')).toBeTruthy();
  await act(async () => { jest.advanceTimersByTime(1200); });
  expect(screen.getByTestId('photo-frame-0')).toBeTruthy();
});

test('stays on the start photo when reduce motion is on', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  await render(<ExercisePhoto exerciseId="Barbell_Squat" size={96} group="quads" />);
  await flush();
  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(screen.getByTestId('photo-frame-0')).toBeTruthy();
});

test('stays still when animate is false', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  await render(<ExercisePhoto exerciseId="Barbell_Squat" size={96} group="quads" animate={false} />);
  await flush();
  await act(async () => { jest.advanceTimersByTime(5000); });
  expect(screen.getByTestId('photo-frame-0')).toBeTruthy();
});

test('an exercise without photos shows the group placeholder', async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  await render(<ExercisePhoto exerciseId="bird-dog" size={96} group="core" />);
  await flush();
  expect(screen.getByTestId('photo-placeholder')).toBeTruthy();
  expect(screen.getByText('C')).toBeTruthy();
});
