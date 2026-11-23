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
    ACTIONS.map(a => ({ ...a, options: { opensAppToForeground: false } })),
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

export async function showRest(n: { endsAt: number; title: string; body: string }): Promise<void> {
  if (!(await allowed())) return;
  await clearRest();
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
}

export async function clearRest(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(END);
  await Notifications.dismissNotificationAsync(LIVE);
  await Notifications.dismissNotificationAsync(END);
}

/** Calls the handler for the three rest actions; returns the unsubscribe. */
export function onRestAction(handler: (action: RestAction) => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(r => {
    const a = ACTIONS.find(x => x.identifier === r.actionIdentifier);
    if (a) handler(a.identifier);
  });
  return () => sub.remove();
}
