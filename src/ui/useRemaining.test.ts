import { act, renderHook } from '@testing-library/react-native';
import { useRemaining } from './useRemaining';

beforeEach(() => jest.useFakeTimers({ now: 100_000 }));
afterEach(() => jest.useRealTimers());

test('counts down against the clock and ends once', async () => {
  const onEnd = jest.fn();
  const endsAt = Date.now() + 3000;
  const { result } = await renderHook(() => useRemaining(endsAt, onEnd));
  expect(result.current).toBe(3);
  await act(async () => jest.advanceTimersByTime(1000));
  expect(result.current).toBe(2);
  await act(async () => jest.advanceTimersByTime(5000));
  expect(onEnd).toHaveBeenCalledTimes(1);
});

test('nothing to count is null', async () => {
  const { result } = await renderHook(() => useRemaining(null, jest.fn()));
  expect(result.current).toBeNull();
});

test('a time already past ends at once', async () => {
  const onEnd = jest.fn();
  const endsAt = Date.now() - 10_000;
  await renderHook(() => useRemaining(endsAt, onEnd));
  await act(async () => jest.advanceTimersByTime(300));
  expect(onEnd).toHaveBeenCalledTimes(1);
});
