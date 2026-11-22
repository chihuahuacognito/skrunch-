import { act, renderHook } from '@testing-library/react-native';
import { AppState, type AppStateStatus } from 'react-native';
import { useToday } from './useToday';

let listeners: ((s: AppStateStatus) => void)[] = [];
const remove = jest.fn();
beforeEach(() => {
  listeners = [];
  remove.mockClear();
  jest.useFakeTimers({ now: new Date(2026, 10, 22, 21, 0) });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_type, fn) => {
    listeners.push(fn as (s: AppStateStatus) => void);
    return { remove } as unknown as ReturnType<typeof AppState.addEventListener>;
  });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test('starts at the training day', async () => {
  const { result } = await renderHook(() => useToday());
  expect(result.current).toBe('2026-11-22');
});

test('the app left open overnight reports the new day when it comes back', async () => {
  const { result } = await renderHook(() => useToday());
  jest.setSystemTime(new Date(2026, 10, 23, 19, 0));
  await act(async () => listeners.forEach(fn => fn('active')));
  expect(result.current).toBe('2026-11-23');
});

test('stops listening on unmount', async () => {
  const { unmount } = await renderHook(() => useToday());
  await unmount();
  expect(remove).toHaveBeenCalled();
});
