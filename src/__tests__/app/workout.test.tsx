import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { buildSession, INCREMENT_KG, type PlannedSession } from '../../builder';
import { emptyHistory } from '../../builder/test-utils/fixtures';
import { saveCheckIn } from '../../store/history';
import { migrate } from '../../store/schema';
import type { SqlDb } from '../../store/sql';
import { nodeDb } from '../../store/test-utils/nodeDb';
import { loadDraft, saveDraft } from '../../store/workout';
import { renderApp } from '../../test-utils/renderApp';
import { LIBRARY } from '../../ui/library';
import { startWorkout, stepsOf, type WorkoutState } from '../../workout';
import CheckInScreen from '../../app/index';
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

const routes = { index: () => <Text>Check-in stub</Text>, workout: WorkoutScreen };
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
