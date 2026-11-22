import { act, renderHook } from '@testing-library/react-native';
import { useCountdown } from './useCountdown';

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

test('countdown ticks down and calls onDone once at zero', async () => {
  const onDone = jest.fn();
  const { result } = await renderHook(() => useCountdown(onDone));
  expect(result.current.remaining).toBeNull();
  await act(async () => result.current.start(3));
  expect(result.current.remaining).toBe(3);
  await act(async () => jest.advanceTimersByTime(1000));
  expect(result.current.remaining).toBe(2);
  await act(async () => jest.advanceTimersByTime(2000));
  expect(result.current.remaining).toBeNull();
  expect(onDone).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(5000));
  expect(onDone).toHaveBeenCalledTimes(1);
});

test('stop cancels the countdown', async () => {
  const onDone = jest.fn();
  const { result } = await renderHook(() => useCountdown(onDone));
  await act(async () => result.current.start(3));
  await act(async () => result.current.stop());
  await act(async () => jest.advanceTimersByTime(5000));
  expect(result.current.remaining).toBeNull();
  expect(onDone).not.toHaveBeenCalled();
});

test('unmounting mid-countdown never calls onDone', async () => {
  const onDone = jest.fn();
  const { result, unmount } = await renderHook(() => useCountdown(onDone));
  await act(async () => result.current.start(2));
  await unmount();
  jest.advanceTimersByTime(5000);
  expect(onDone).not.toHaveBeenCalled();
});

test('counts against the clock, so a paused timer catches up instead of drifting', async () => {
  const onDone = jest.fn();
  const { result } = await renderHook(() => useCountdown(onDone));
  await act(async () => result.current.start(30));
  // The phone slept for 20 s without firing ticks, then one tick arrives.
  jest.setSystemTime(Date.now() + 20000);
  await act(async () => jest.advanceTimersByTime(1000));
  expect(result.current.remaining).toBe(9);
});
