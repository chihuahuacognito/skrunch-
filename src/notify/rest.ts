import * as Notifications from 'expo-notifications';

// The rest timer outside the app: a silent, sticky "Rest until 19:42" notice while resting, and a loud "Rest over"
// scheduled for the end. Both carry the Complete set / +15 s / Skip actions.

const LIVE = 'rest-live';
const END = 'rest-end';
const CATEGORY = 'rest';

export type RestAction = 'complete' | 'plus15' | 'skip';
const ACTIONS: { identifier: RestAction; buttonTitle: string }[] = [
  { identifier: 'complete', buttonTitle: 'Complete set' },
  { identifier: 'plus15', buttonTitle: '+15 s' },
  { identifier: 'skip', buttonTitle: 'Skip' },
];

/** Once per app run, at startup: channels, the action buttons, and showing notifications while the app is open. */
export async function setupRestNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
  });
  await Notifications.setNotificationChannelAsync(LIVE, { name: 'Rest timer', importance: Notifications.AndroidImportance.LOW, sound: null });
  await Notifications.setNotificationChannelAsync(END, {
    name: 'Rest over', importance: Notifications.AndroidImportance.HIGH, vibrationPattern: [0, 250, 150, 250],
  });
  await Notifications.setNotificationCategoryAsync(
    CATEGORY,
    // Opening the app is the only way an action reaches it when Android has killed it, which is normal while the
    // phone is locked between sets.
    ACTIONS.map(a => ({ ...a, options: { opensAppToForeground: true } })),
  );
}

let asked = false;

/** Asks for notification permission at most once per app run; a refusal leaves the in-app timer to do the job. */
async function allowed(): Promise<boolean> {
  if ((await Notifications.getPermissionsAsync()).granted) return true;
  if (asked) return false;
  asked = true;
  return (await Notifications.requestPermissionsAsync()).granted;
}

// Every show and clear runs in one queue, in the order asked, and a newer request makes an older show stand down.
// Without this a clear that overtakes a slower show (it first awaits the permission check) leaves a stale sticky notice.
let queue: Promise<void> = Promise.resolve();
let latest = 0;

function enqueue(op: (isLatest: () => boolean) => Promise<void>): Promise<void> {
  const mine = ++latest;
  const run = queue.then(() => op(() => mine === latest));
  queue = run.catch(() => {});
  return run;
}

async function dismissAll(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(END);
  await Notifications.dismissNotificationAsync(LIVE);
  await Notifications.dismissNotificationAsync(END);
}

/** Shows the rest notice and schedules "Rest over". A rest that has already ended only clears. */
export function showRest(n: { endsAt: number; title: string; body: string }): Promise<void> {
  return enqueue(async isLatest => {
    if (n.endsAt <= Date.now()) return dismissAll();
    if (!(await allowed()) || !isLatest()) return;
    await dismissAll();
    if (!isLatest()) return;
    await Notifications.scheduleNotificationAsync({
      identifier: LIVE,
      content: { title: n.title, body: n.body, categoryIdentifier: CATEGORY, sticky: true, autoDismiss: false, sound: false },
      trigger: { channelId: LIVE },
    });
    await Notifications.scheduleNotificationAsync({
      identifier: END,
      content: { title: 'Rest over', body: n.body, categoryIdentifier: CATEGORY },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: n.endsAt, channelId: END },
    });
  });
}

export function clearRest(): Promise<void> {
  return enqueue(() => dismissAll());
}

type Response = Notifications.NotificationResponse;
const handled = new Set<string>();

/** Hands a rest action to the handler once. It is then cleared, so a later launch never replays it into a new rest. */
function deliver(r: Response, handler: (action: RestAction) => void): void {
  const action = ACTIONS.find(x => x.identifier === r.actionIdentifier);
  if (!action) return;
  const key = `${r.notification.request.identifier}:${r.notification.date}:${r.actionIdentifier}`;
  if (handled.has(key)) return;
  handled.add(key);
  void Notifications.clearLastNotificationResponseAsync().catch(e => console.warn('clearing the notification response failed', e));
  handler(action.identifier);
}

/**
 * Calls the handler for the three rest actions, including the one that just opened the app from a killed state.
 * Returns the unsubscribe.
 */
export function onRestAction(handler: (action: RestAction) => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(r => deliver(r, handler));
  void Notifications.getLastNotificationResponseAsync()
    .then(r => { if (r) deliver(r, handler); })
    .catch(e => console.warn('reading the notification response failed', e));
  return () => sub.remove();
}
