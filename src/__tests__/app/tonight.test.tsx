import { act, render, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { targetFor, type Target } from '../../builder';
import { TonightProvider } from '../../features/tonight/TonightProvider';
import { useTonight, type TonightApi } from '../../features/tonight/useTonight';
import { DbProvider } from '../../store/DbContext';
import { loadHistory, saveSession } from '../../store/history';
import { migrate } from '../../store/schema';
import type { SqlDb } from '../../store/sql';
import { nodeDb } from '../../store/test-utils/nodeDb';
import { loadTonight, saveTonight } from '../../store/tonight';
import { emptyTonight } from '../../tonight';
import { LIBRARY } from '../../ui/library';

jest.mock('../../haptics', () => ({ tick: jest.fn(), impact: jest.fn() }));

const SQUAT = LIBRARY.find(e => e.id === 'Barbell_Squat')!;
const squatTarget: Target = { ...targetFor(SQUAT, 'main', { sessions: [], feedback: {} }, '2026-11-25'), weight: 60, needsWeight: false };
const mocked = Notifications as jest.Mocked<typeof Notifications>;

let db: SqlDb;
let api: TonightApi;
function Probe() {
  api = useTonight();
  return null;
}
async function mount() {
  const utils = await render(<DbProvider db={db}><TonightProvider><Probe /></TonightProvider></DbProvider>);
  await waitFor(() => expect(api.ready).toBe(true));
  return utils;
}
const tonightSets = async (id: string) =>
  (await loadHistory(db)).sessions.filter(s => s.date === '2026-11-25').flatMap(s => s.exercises).find(x => x.exerciseId === id)?.sets ?? [];

beforeEach(async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 25, 19, 0) });
  db = nodeDb();
  await migrate(db);
  jest.clearAllMocks();
});
afterEach(() => jest.useRealTimers());

test('logDot writes a set and starts a 120 s rest; a repeated dot writes once', async () => {
  await mount();
  await act(() => api.logDot('Barbell_Squat', 0, squatTarget, false));
  await act(() => api.logDot('Barbell_Squat', 0, squatTarget, false));
  expect(await tonightSets('Barbell_Squat')).toEqual([{ weight: 60, reps: 5, seconds: null }]);
  expect(api.doneSets('Barbell_Squat')).toHaveLength(1);
  expect(api.state.rest).toMatchObject({ exerciseId: 'Barbell_Squat', set: 1, of: 3, seconds: 120 });
  expect(api.state.firstSetAt).not.toBeNull();
  expect((await loadTonight(db, '2026-11-25')).rest).toMatchObject({ exerciseId: 'Barbell_Squat' });
});

test('the last dot still rests; complete fills the remaining sets without a rest', async () => {
  await mount();
  for (const i of [0, 1, 2]) await act(() => api.logDot('Barbell_Squat', i, squatTarget, false));
  expect(api.doneSets('Barbell_Squat')).toHaveLength(3);
  expect(api.state.rest).toMatchObject({ set: 3, of: 3 });
  await act(async () => api.restSkip());
  const lunges = { ...squatTarget, restSeconds: 90 };
  await act(() => api.logDot('Dumbbell_Lunges', 0, lunges, false));
  await act(async () => api.restSkip());
  await act(() => api.complete('Dumbbell_Lunges', lunges, false));
  expect(await tonightSets('Dumbbell_Lunges')).toHaveLength(3);
  expect(api.state.rest).toBeNull();
});

test('the rest ends on its own at endsAt', async () => {
  await mount();
  await act(() => api.logDot('Barbell_Squat', 0, squatTarget, false));
  await act(async () => { jest.advanceTimersByTime(120_000); });
  expect(api.state.rest).toBeNull();
});

test('the rest shows a notification and +15 s moves it', async () => {
  await mount();
  await act(() => api.logDot('Barbell_Squat', 0, squatTarget, false));
  await waitFor(() => expect(mocked.scheduleNotificationAsync).toHaveBeenCalled());
  await act(async () => api.restPlus(15));
  expect(api.state.rest?.seconds).toBe(135);
});

test('notification Complete set after a reload logs the next set once, and nothing once the exercise is complete', async () => {
  await mount();
  await act(() => api.logDot('Barbell_Squat', 0, squatTarget, false));
  const state = api.state;
  // Android killed the app; it reopens from the notification's Complete set action.
  const response = { actionIdentifier: 'complete', notification: { date: 1, request: { identifier: 'rest-live' } } };
  mocked.getLastNotificationResponseAsync.mockResolvedValueOnce(response as unknown as Notifications.NotificationResponse);
  await saveTonight(db, state);
  await mount();
  await waitFor(async () => expect(await tonightSets('Barbell_Squat')).toHaveLength(2));
  expect(api.state.rest).toMatchObject({ set: 2 });
  // Set 3 by hand, then a late Complete set does nothing.
  await act(() => api.logDot('Barbell_Squat', 2, api.targetOf('Barbell_Squat'), false));
  const listener = mocked.addNotificationResponseReceivedListener.mock.calls.at(-1)![0];
  await act(async () => listener({ ...response, notification: { date: 2, request: { identifier: 'rest-live' } } } as unknown as Notifications.NotificationResponse));
  await act(async () => { await Promise.resolve(); });
  expect(await tonightSets('Barbell_Squat')).toHaveLength(3);
});

test('undo removes tonight sets and ends that exercise rest', async () => {
  await mount();
  await act(() => api.logDot('Barbell_Squat', 0, squatTarget, false));
  await act(() => api.undo('Barbell_Squat'));
  expect(await tonightSets('Barbell_Squat')).toEqual([]);
  expect(api.doneSets('Barbell_Squat')).toEqual([]);
  expect(api.state.rest).toBeNull();
});

test('edit replaces tonight sets', async () => {
  await mount();
  await act(() => api.edit('Barbell_Squat', [{ weight: 65, reps: 5, seconds: null }], squatTarget, false));
  expect(api.doneSets('Barbell_Squat')).toEqual([{ weight: 65, reps: 5, seconds: null }]);
});

test('targets ignore tonight sets, so the target does not move mid-session', async () => {
  await saveSession(db, { date: '2026-11-20', focus: 'free', intervals: false, exercises: [
    { exerciseId: 'Barbell_Squat', targetMin: 6, targetMax: 8, chip: null, plannedSets: 3, sets: [1, 2, 3].map(() => ({ weight: 60, reps: 6, seconds: null })) },
  ] });
  await mount();
  await act(async () => { api.openGroup('quads'); });
  expect(api.state.cards.quads?.[0]).toEqual({ exerciseId: 'Barbell_Squat', role: 'main' });
  const before = api.targetOf('Barbell_Squat');
  expect(before).toMatchObject({ reps: 7, weight: 60 });
  await act(() => api.edit('Barbell_Squat', [{ weight: 60, reps: 7, seconds: null }], before, false));
  expect(api.targetOf('Barbell_Squat')).toEqual(before);
});

test('a first-time lift takes tonight weight once the first set sets one', async () => {
  await mount();
  expect(api.targetOf('Barbell_Squat')).toMatchObject({ weight: null, needsWeight: true });
  await act(() => api.edit('Barbell_Squat', [{ weight: 40, reps: 5, seconds: null }], squatTarget, false));
  expect(api.targetOf('Barbell_Squat')).toMatchObject({ weight: 40, reps: 10, needsWeight: false }); // accessory: not on a card
});

test('a day rollover reloads an empty tonight state', async () => {
  await mount();
  await act(() => api.logDot('Barbell_Squat', 0, squatTarget, false));
  await act(async () => {
    jest.setSystemTime(new Date(2026, 10, 26, 4, 1));
    jest.advanceTimersByTime(60_000);
  });
  await waitFor(() => expect(api.today).toBe('2026-11-26'));
  await waitFor(() => expect(api.state).toEqual(emptyTonight('2026-11-26')));
  expect(api.doneSets('Barbell_Squat')).toEqual([]);
});

test('openGroup freezes cards: a later call returns the same list', async () => {
  await mount();
  let first: unknown;
  await act(async () => { first = api.openGroup('quads'); });
  await act(() => api.logDot('Barbell_Squat', 0, squatTarget, false));
  let second: unknown;
  await act(async () => { second = api.openGroup('quads'); });
  expect(second).toEqual(first);
  expect(api.state.opened).toEqual(['quads']);
  expect(api.state.lastGroup).toBe('quads');
});

test('Complete set after "Rest over" (the rest already ended) still logs the next set', async () => {
  await mount();
  await act(() => api.logDot('Barbell_Squat', 0, squatTarget, false));
  await act(async () => { jest.advanceTimersByTime(121_000); });
  expect(api.state.rest).toBeNull();
  const listener = mocked.addNotificationResponseReceivedListener.mock.calls.at(-1)![0];
  await act(async () => listener({ actionIdentifier: 'complete', notification: { date: 3, request: { identifier: 'rest-end' } } } as unknown as Notifications.NotificationResponse));
  await act(async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); });
  expect(await tonightSets('Barbell_Squat')).toHaveLength(2);
});

test('after a kill with a past endsAt, the rest end firing first does not drop the Complete set', async () => {
  await mount();
  await act(() => api.logDot('Barbell_Squat', 0, squatTarget, false));
  const state = api.state;
  await saveTonight(db, { ...state, rest: { ...state.rest!, endsAt: Date.now() - 1000 } });
  await mount();
  await act(async () => { jest.advanceTimersByTime(10); });
  expect(api.state.rest).toBeNull();
  const listener = mocked.addNotificationResponseReceivedListener.mock.calls.at(-1)![0];
  await act(async () => listener({ actionIdentifier: 'complete', notification: { date: 4, request: { identifier: 'rest-end' } } } as unknown as Notifications.NotificationResponse));
  await act(async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); });
  expect(await tonightSets('Barbell_Squat')).toHaveLength(2);
});

test('Completed ends that exercise rest; so does an Edit to 0 sets', async () => {
  await mount();
  await act(() => api.logDot('Barbell_Squat', 0, squatTarget, false));
  await act(() => api.complete('Barbell_Squat', squatTarget, false));
  expect(api.state.rest).toBeNull();
  await act(() => api.logDot('Dumbbell_Lunges', 0, squatTarget, false));
  await act(() => api.edit('Dumbbell_Lunges', [], squatTarget, false));
  expect(api.state.rest).toBeNull();
});

test('an old focus row for today does not shift the dot count', async () => {
  await saveSession(db, { date: '2026-11-25', focus: 'lower', intervals: false, exercises: [
    { exerciseId: 'Barbell_Squat', targetMin: 6, targetMax: 8, chip: null, plannedSets: 3, sets: [{ weight: 50, reps: 6, seconds: null }] },
  ] });
  await mount();
  expect(api.doneSets('Barbell_Squat')).toEqual([]);
  await act(() => api.logDot('Barbell_Squat', 0, squatTarget, false));
  expect(api.doneSets('Barbell_Squat')).toHaveLength(1);
});

test('setFeedback saves and reloads history', async () => {
  await mount();
  await act(() => api.setFeedback('Barbell_Squat', 'never'));
  expect(api.history.feedback).toEqual({ Barbell_Squat: 'never' });
  await act(() => api.setFeedback('Barbell_Squat', null));
  expect(api.history.feedback).toEqual({});
});
