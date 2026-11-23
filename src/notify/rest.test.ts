import * as N from 'expo-notifications';

const mocked = N as unknown as Record<string, jest.Mock>;
const notice = { endsAt: Date.now() + 600_000, title: 'Rest until 19:42', body: 'Next: Bench · set 2 · 60 kg × 8' };

/** A fresh copy of the module per test: it remembers whether it already asked for permission. */
const load = () => {
  let mod!: typeof import('./rest');
  jest.isolateModules(() => {
    mod = require('./rest');
  });
  return mod;
};

beforeEach(() => jest.clearAllMocks());

const response = (actionIdentifier: string, date: number) =>
  ({ actionIdentifier, notification: { date, request: { identifier: 'rest-end' } } });

test('setup creates both channels and the three actions', async () => {
  await load().setupRestNotifications();
  expect(mocked.setNotificationChannelAsync).toHaveBeenCalledWith('rest-live', expect.objectContaining({ importance: N.AndroidImportance.LOW }));
  expect(mocked.setNotificationChannelAsync).toHaveBeenCalledWith('rest-end', expect.objectContaining({ importance: N.AndroidImportance.HIGH }));
  const [category, actions] = mocked.setNotificationCategoryAsync.mock.calls[0];
  expect(category).toBe('rest');
  expect(actions.map((a: { identifier: string; buttonTitle: string }) => [a.identifier, a.buttonTitle])).toEqual(
    [['complete', 'Complete set'], ['plus15', '+15 s'], ['skip', 'Skip']]);
  // With the app killed (normal while the phone is locked) only an action that opens the app reaches it.
  expect(actions.every((a: { options: { opensAppToForeground: boolean } }) => a.options.opensAppToForeground)).toBe(true);
});

test('showRest presents the live notice and schedules the end', async () => {
  await load().showRest(notice);
  const calls = mocked.scheduleNotificationAsync.mock.calls.map(c => c[0]);
  expect(calls).toHaveLength(2);
  expect(calls[0]).toMatchObject({
    identifier: 'rest-live',
    content: { title: notice.title, body: notice.body, categoryIdentifier: 'rest', sticky: true },
    trigger: { channelId: 'rest-live' },
  });
  expect(calls[1]).toMatchObject({
    identifier: 'rest-end',
    content: { title: 'Rest over', body: notice.body, categoryIdentifier: 'rest' },
    trigger: { type: 'date', date: notice.endsAt, channelId: 'rest-end' },
  });
});

test('showRest replaces the previous rest', async () => {
  const rest = load();
  await rest.showRest(notice);
  mocked.cancelScheduledNotificationAsync.mockClear();
  await rest.showRest({ ...notice, endsAt: notice.endsAt + 1000 });
  expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith('rest-end');
  const order = mocked.cancelScheduledNotificationAsync.mock.invocationCallOrder[0];
  expect(order).toBeLessThan(mocked.scheduleNotificationAsync.mock.invocationCallOrder[2]);
});

test('clearRest cancels the end and dismisses both', async () => {
  await load().clearRest();
  expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith('rest-end');
  expect(mocked.dismissNotificationAsync).toHaveBeenCalledWith('rest-live');
  expect(mocked.dismissNotificationAsync).toHaveBeenCalledWith('rest-end');
});

test('denied permission makes showRest a no-op, and it asks only once', async () => {
  mocked.getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
  mocked.requestPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
  const rest = load();
  await rest.showRest(notice);
  await rest.showRest(notice);
  expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  expect(mocked.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  mocked.getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
  mocked.requestPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
});

test('actions reach the handler; other taps do not', async () => {
  const handler = jest.fn();
  const stop = load().onRestAction(handler);
  const listener = mocked.addNotificationResponseReceivedListener.mock.calls[0][0];
  listener(response('plus15', 1));
  listener(response('expo.modules.notifications.actions.DEFAULT', 2));
  expect(handler.mock.calls).toEqual([['plus15']]);
  stop();
  expect(mocked.addNotificationResponseReceivedListener.mock.results[0].value.remove).toHaveBeenCalled();
});

test('a rest that is already over clears instead of showing', async () => {
  jest.useFakeTimers({ now: notice.endsAt + 1 });
  await load().showRest(notice);
  jest.useRealTimers();
  expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  expect(mocked.dismissNotificationAsync).toHaveBeenCalledWith('rest-live');
});

test('a clear sent while a show is still waiting wins', async () => {
  let release!: () => void;
  const gate = new Promise<void>(r => (release = r));
  mocked.getPermissionsAsync.mockImplementationOnce(async () => { await gate; return { granted: true, canAskAgain: true }; });
  const rest = load();
  const shown = rest.showRest({ ...notice, endsAt: Date.now() + 60_000 });
  const cleared = rest.clearRest();
  release();
  await Promise.all([shown, cleared]);
  expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  const lastDismiss = Math.max(...mocked.dismissNotificationAsync.mock.invocationCallOrder);
  expect(lastDismiss).toBeGreaterThan(0);
});

test('the action that opened the app is applied once, then forgotten', async () => {
  mocked.getLastNotificationResponseAsync.mockResolvedValueOnce(response('complete', 5));
  const handler = jest.fn();
  load().onRestAction(handler);
  await new Promise(r => setImmediate(r));
  const listener = mocked.addNotificationResponseReceivedListener.mock.calls[0][0];
  listener(response('complete', 5));
  expect(handler.mock.calls).toEqual([['complete']]);
  expect(mocked.clearLastNotificationResponseAsync).toHaveBeenCalled();
});

test('a live action is forgotten too, so a later launch never replays it', async () => {
  const handler = jest.fn();
  load().onRestAction(handler);
  mocked.addNotificationResponseReceivedListener.mock.calls[0][0](response('skip', 9));
  expect(handler.mock.calls).toEqual([['skip']]);
  expect(mocked.clearLastNotificationResponseAsync).toHaveBeenCalled();
});
