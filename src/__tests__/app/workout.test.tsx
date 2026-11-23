import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Notifications from 'expo-notifications';
import { Alert, BackHandler, Text } from 'react-native';
import { buildSession, INCREMENT_KG, swapCandidates, type PlannedSession } from '../../builder';
import { emptyHistory } from '../../builder/test-utils/fixtures';
import { loadHistory, saveCheckIn } from '../../store/history';
import { migrate } from '../../store/schema';
import type { SqlDb } from '../../store/sql';
import { nodeDb } from '../../store/test-utils/nodeDb';
import { loadDraft, saveDraft } from '../../store/workout';
import { renderApp } from '../../test-utils/renderApp';
import { LIBRARY } from '../../ui/library';
import { startWorkout, stepsOf, type WorkoutState } from '../../workout';
import CheckInScreen from '../../app/index';
import SummaryScreen from '../../app/summary';
import WorkoutScreen from '../../app/workout';

jest.mock('../../haptics', () => ({ tick: jest.fn(), impact: jest.fn() }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));

const TODAY = '2026-11-22';
const NAME = new Map(LIBRARY.map(e => [e.id, e.name]));
const session: PlannedSession = buildSession(
  { library: LIBRARY, history: emptyHistory(), today: TODAY, checkIn: 'good', place: 'gym' }, { focus: 'chest-back', dose: 'full' });
const steps = stepsOf(session);
const mainB = session.blocks.findIndex(b => b.kind === 'main');
const mainStep = steps.findIndex(s => s.block === mainB);
const mainItem = session.blocks[mainB].items[0];

let db: SqlDb;
beforeEach(async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 22, 19, 0) });
  db = nodeDb();
  await migrate(db);
  await saveCheckIn(db, TODAY, 'good', 'gym');
});
afterEach(() => jest.useRealTimers());

const routes = { index: () => <Text>Check-in stub</Text>, workout: WorkoutScreen, summary: SummaryScreen };
const fresh = (): WorkoutState => startWorkout(session, LIBRARY, emptyHistory(), Date.now());
/** A draft on the main lift, with its weight already known when weighed is true. */
const atMain = (weighed: boolean): WorkoutState => {
  const w = fresh();
  if (weighed) w.logs[mainB][0].sets.forEach(s => { s.weight = 60; });
  return { ...w, step: mainStep };
};
const open = async (state: WorkoutState) => {
  await saveDraft(db, state);
  await renderApp(routes, { db, initialUrl: '/workout' });
};
const draft = async () => (await loadDraft(db, TODAY))!;

test('the first step shows the warm-up item with its sets', async () => {
  await open(fresh());
  expect(await screen.findByText(NAME.get(session.blocks[0].items[0].exerciseId)!)).toBeTruthy();
  expect(screen.getByText('Warm-up')).toBeTruthy();
  expect(screen.getByText(`1 / ${steps.length}`)).toBeTruthy();
  expect(screen.getByLabelText('Log set 1')).toBeTruthy();
});

test('ticking logs the set and saves the draft', async () => {
  await open(atMain(true));
  await fireEvent.press(await screen.findByLabelText('Log set 1'));
  expect(screen.getByLabelText('Set 1 done')).toBeTruthy();
  await waitFor(async () => expect((await draft()).logs[mainB][0].sets[0].done).toBe(true));
});

test('ticking a blank loaded set opens the weight editor', async () => {
  await open(atMain(false));
  await fireEvent.press(await screen.findByLabelText('Log set 1'));
  expect(screen.getByLabelText('Weight for set 1')).toBeTruthy();
  expect(screen.getByLabelText('Log set 1')).toBeTruthy();
});

test('entering a weight fills the open sets and allows the tick', async () => {
  await open(atMain(false));
  await fireEvent.press(await screen.findByLabelText('Log set 1'));
  await fireEvent.changeText(screen.getByLabelText('Weight for set 1'), '60');
  await fireEvent.press(screen.getByLabelText('Done'));
  expect(screen.getAllByText('60 kg')).toHaveLength(mainItem.sets);
  await fireEvent.press(screen.getByLabelText('Log set 1'));
  expect(screen.getByLabelText('Set 1 done')).toBeTruthy();
});

test('the editor steps by the equipment increment', async () => {
  await open(atMain(true));
  await fireEvent.press(await screen.findByLabelText('Weight, set 1'));
  await fireEvent.press(screen.getByLabelText('More'));
  const step = INCREMENT_KG[LIBRARY.find(e => e.id === mainItem.exerciseId)!.equipment[0] ?? 'other'];
  expect(screen.getByDisplayValue(String(60 + step))).toBeTruthy();
});

test('a tick with rest shows the rest banner, and skip clears it', async () => {
  await open(atMain(true));
  await fireEvent.press(await screen.findByLabelText('Log set 1'));
  expect(screen.getByText('2:30')).toBeTruthy();
  await act(async () => jest.advanceTimersByTime(1000));
  expect(screen.getByText('2:29')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('+15 s'));
  expect(screen.getByText('2:44')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Skip'));
  expect(screen.queryByText('2:44')).toBeNull();
});

test('the rest banner offers the chip after the last set', async () => {
  await open(atMain(true));
  for (let i = 1; i <= mainItem.sets; i++) await fireEvent.press(await screen.findByLabelText(`Log set ${i}`));
  expect(screen.getByLabelText('Easy')).toBeTruthy();
  expect(screen.getByLabelText('Right')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Hard'));
  await waitFor(async () => expect((await draft()).logs[mainB][0].chip).toBe('hard'));
});

test('next and back move between steps', async () => {
  await open(fresh());
  await fireEvent.press(await screen.findByLabelText('Next'));
  expect(screen.getByText(`2 / ${steps.length}`)).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Back'));
  expect(screen.getByText(`1 / ${steps.length}`)).toBeTruthy();
});

test('reopening the app resumes the workout', async () => {
  await saveDraft(db, { ...atMain(true), logs: atMain(true).logs.map((b, bi) => b.map((l, i) =>
    bi === mainB && i === 0 ? { ...l, sets: l.sets.map((s, j) => (j === 0 ? { ...s, done: true } : s)) } : l)) });
  await renderApp({ index: CheckInScreen, workout: WorkoutScreen }, { db, initialUrl: '/' });
  expect(await screen.findByText(NAME.get(mainItem.exerciseId)!)).toBeTruthy();
  expect(screen.getByLabelText('Set 1 done')).toBeTruthy();
  expect(screen).toHavePathname('/workout');
});

test('no draft sends you back to check in', async () => {
  await renderApp(routes, { db, initialUrl: '/workout' });
  expect(await screen.findByText('Check-in stub')).toBeTruthy();
});

/** The last step, with the first warm-up set already done so there is something to save. */
const atEnd = (): WorkoutState => {
  const w = fresh();
  w.logs[0][0].sets[0].done = true;
  return { ...w, step: steps.length - 1 };
};

test('finishing saves the session and shows the summary', async () => {
  await open(atEnd());
  await fireEvent.press(await screen.findByLabelText('Finish'));
  expect(await screen.findByText('Saved')).toBeTruthy();
  expect(screen.getByText(/^\d+ min · 1 sets · 1 exercises$/)).toBeTruthy();
  expect((await loadHistory(db)).sessions).toHaveLength(1);
  expect(await loadDraft(db, TODAY)).toBeNull();
});

test('finishing twice saves one session', async () => {
  // Transactions wait on a gate, so the screen is still showing when the second tap lands.
  let gated = false;
  let release!: () => void;
  const gate = new Promise<void>(r => (release = r));
  const slow: SqlDb = { ...db, execAsync: async sql => { if (gated) await gate; return db.execAsync(sql); } };
  await saveDraft(db, atEnd());
  await renderApp(routes, { db: slow, initialUrl: '/workout' });
  const finish = await screen.findByLabelText('Finish');
  gated = true;
  await fireEvent.press(finish);
  await fireEvent.press(finish);
  await act(async () => release());
  expect(await screen.findByText('Saved')).toBeTruthy();
  expect(screen).toHavePathname('/summary');
  expect((await loadHistory(db)).sessions).toHaveLength(1);
});

test('a tick just before finishing is saved with the session', async () => {
  await open(atMain(true));
  await fireEvent.press(await screen.findByLabelText('Log set 1'));
  await fireEvent.press(screen.getByLabelText('End'));
  await fireEvent.press(screen.getByLabelText('Finish and save'));
  expect(await screen.findByText('Saved')).toBeTruthy();
  expect(await loadDraft(db, TODAY)).toBeNull();
  expect((await loadHistory(db)).sessions[0].exercises[0].sets).toHaveLength(1);
});

test('finishing with nothing ticked saves nothing', async () => {
  await open({ ...fresh(), step: steps.length - 1 });
  await fireEvent.press(await screen.findByLabelText('Finish'));
  expect(await screen.findByText('Check-in stub')).toBeTruthy();
  expect((await loadHistory(db)).sessions).toHaveLength(0);
  expect(await loadDraft(db, TODAY)).toBeNull();
});

test('keep going closes the end sheet', async () => {
  await open(fresh());
  await fireEvent.press(await screen.findByLabelText('End'));
  await fireEvent.press(screen.getByLabelText('Keep going'));
  expect(screen.queryByLabelText('Finish and save')).toBeNull();
});

test('discard asks, then drops the workout', async () => {
  const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  await open(atEnd());
  await fireEvent.press(await screen.findByLabelText('End'));
  await fireEvent.press(screen.getByLabelText('Discard workout'));
  expect(alert).toHaveBeenCalledWith("Discard tonight's workout?", 'Nothing will be saved.', expect.any(Array));
  const buttons = alert.mock.calls[0][2]!;
  await act(async () => buttons.find(b => b.text === 'Discard')!.onPress!());
  expect(await screen.findByText('Check-in stub')).toBeTruthy();
  expect(await loadDraft(db, TODAY)).toBeNull();
  expect((await loadHistory(db)).sessions).toHaveLength(0);
  alert.mockRestore();
});

describe('exercise options', () => {
  const mainName = NAME.get(mainItem.exerciseId)!;
  const input = { library: LIBRARY, history: emptyHistory(), today: TODAY, checkIn: 'good' as const, place: 'gym' as const };

  test('swap replaces an untouched main lift with a candidate', async () => {
    const pick = swapCandidates(input, session, mainB, 0)[0];
    await open(atMain(false));
    await fireEvent.press(await screen.findByLabelText(`Options for ${mainName}`));
    await fireEvent.press(screen.getByLabelText('Swap'));
    await fireEvent.press(screen.getByLabelText(`Swap to ${pick.name}`));
    expect(await screen.findByText(pick.name)).toBeTruthy();
    expect(screen.queryByText(mainName)).toBeNull();
    await waitFor(async () => expect((await draft()).session.blocks[mainB].items[0].exerciseId).toBe(pick.id));
  });

  test('swap is not offered once a set is done', async () => {
    await open(atMain(true));
    await fireEvent.press(await screen.findByLabelText('Log set 1'));
    await fireEvent.press(screen.getByLabelText(`Options for ${mainName}`));
    expect(screen.queryByLabelText('Swap')).toBeNull();
    expect(screen.getByLabelText('Never again')).toBeTruthy();
  });

  test('feedback is saved, and tapping it again clears it', async () => {
    await open(atMain(false));
    await fireEvent.press(await screen.findByLabelText(`Options for ${mainName}`));
    await fireEvent.press(screen.getByLabelText('Never again'));
    await waitFor(async () => expect((await loadHistory(db)).feedback[mainItem.exerciseId]).toBe('never'));
    expect(screen.getByLabelText('Never again')).toBeSelected();
    await fireEvent.press(screen.getByLabelText('Never again'));
    await waitFor(async () => expect((await loadHistory(db)).feedback[mainItem.exerciseId]).toBeUndefined());
  });

  test('an exercise without a source has no post link', async () => {
    await open(atMain(false));
    await fireEvent.press(await screen.findByLabelText(`Options for ${mainName}`));
    expect(screen.queryByLabelText('Open the original post')).toBeNull();
  });
});

describe('rest notifications', () => {
  const mocked = Notifications as unknown as Record<string, jest.Mock>;

  test('an action tapped while the app was closed is applied when it opens', async () => {
    mocked.getLastNotificationResponseAsync.mockResolvedValueOnce(
      { actionIdentifier: 'complete', notification: { date: 3, request: { identifier: 'rest-end' } } });
    await open(atMain(true));
    expect(await screen.findByLabelText('Set 1 done')).toBeTruthy();
  });

  test('a rest that ran out while the app was closed leaves no notice behind', async () => {
    const w = atMain(true);
    w.logs[mainB][0].sets[0].done = true;
    await saveDraft(db, { ...w, rest: { endsAt: Date.now() - 60_000, seconds: 150, from: { block: mainB, item: 0 } } });
    mocked.scheduleNotificationAsync.mockClear();
    mocked.dismissNotificationAsync.mockClear();
    await renderApp(routes, { db, initialUrl: '/workout' });
    await screen.findByLabelText('Set 1 done');
    await waitFor(() => expect(mocked.dismissNotificationAsync).toHaveBeenCalledWith('rest-live'));
    expect(mocked.scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  test('a long rest shows the notification', async () => {
    await open(atMain(true));
    mocked.scheduleNotificationAsync.mockClear();
    await fireEvent.press(await screen.findByLabelText('Log set 1'));
    await waitFor(() => expect(mocked.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({ identifier: 'rest-end', trigger: expect.objectContaining({ date: Date.now() + 150_000 }) })));
  });

  test('finishing cancels the rest notifications', async () => {
    await open(atMain(true));
    await fireEvent.press(await screen.findByLabelText('Log set 1'));
    mocked.cancelScheduledNotificationAsync.mockClear();
    mocked.dismissNotificationAsync.mockClear();
    await fireEvent.press(screen.getByLabelText('End'));
    await fireEvent.press(screen.getByLabelText('Finish and save'));
    expect(await screen.findByText('Saved')).toBeTruthy();
    expect(mocked.cancelScheduledNotificationAsync).toHaveBeenCalledWith('rest-end');
    expect(mocked.dismissNotificationAsync).toHaveBeenCalledWith('rest-live');
  });

  test('a notification action completes the next set', async () => {
    mocked.addNotificationResponseReceivedListener.mockClear();
    await open(atMain(true));
    await screen.findByLabelText('Log set 1');
    const listener = mocked.addNotificationResponseReceivedListener.mock.calls.at(-1)![0];
    await act(async () => listener({ actionIdentifier: 'complete', notification: { date: 1, request: { identifier: 'rest-end' } } }));
    expect(screen.getByLabelText('Set 1 done')).toBeTruthy();
    await act(async () => listener({ actionIdentifier: 'skip', notification: { date: 2, request: { identifier: 'rest-end' } } }));
    expect(screen.queryByLabelText('Skip')).toBeNull();
  });
});

test('the back gesture opens the end sheet instead of leaving', async () => {
  const add = jest.spyOn(BackHandler, 'addEventListener');
  await open(fresh());
  await screen.findByLabelText('End');
  const handler = add.mock.calls.filter(c => c[0] === 'hardwareBackPress').at(-1)![1];
  let handled: boolean | null | undefined;
  await act(async () => { handled = handler(undefined as never); });
  expect(handled).toBe(true);
  expect(screen.getByLabelText('Finish and save')).toBeTruthy();
  add.mockRestore();
});
