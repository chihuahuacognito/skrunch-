import { act, fireEvent, screen, within } from '@testing-library/react-native';
import { cardioPicks, type SessionLog } from '../../builder';
import { loadHistory, saveSession } from '../../store/history';
import { migrate } from '../../store/schema';
import type { SqlDb } from '../../store/sql';
import { nodeDb } from '../../store/test-utils/nodeDb';
import { renderApp } from '../../test-utils/renderApp';
import { LIBRARY } from '../../ui/library';
import Cardio from '../../app/cardio';
import Home from '../../app/index';

jest.mock('../../haptics', () => ({ tick: jest.fn(), impact: jest.fn() }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));

const TODAY = '2026-11-25';
const routes = { index: Home, cardio: Cardio };
const flush = () => act(async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); });
const timed = (date: string, id: string, minutes: number, intervals: boolean): SessionLog => ({
  date, focus: 'free', intervals,
  exercises: [{ exerciseId: id, targetMin: null, targetMax: null, chip: null, plannedSets: 1, sets: [{ weight: null, reps: null, seconds: minutes * 60 }] }],
});
const tonight = async (id: string) =>
  (await loadHistory(db)).sessions.filter(s => s.date === TODAY).flatMap(s => s.exercises).find(x => x.exerciseId === id)?.sets ?? [];

let db: SqlDb;
beforeEach(async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 25, 19, 0) });
  db = nodeDb();
  await migrate(db);
});
afterEach(() => jest.useRealTimers());

const open = async () => {
  await renderApp(routes, { db, initialUrl: '/cardio' });
  expect(await screen.findByTestId('screen-cardio')).toBeTruthy();
};
const firstZone2 = () => cardioPicks({ library: LIBRARY, history: { sessions: [], feedback: {} }, today: TODAY }).zone2[0];

test('cardio shows the week numbers and 25 min Zone 2 targets', async () => {
  await saveSession(db, timed('2026-11-23', 'Walking_Treadmill', 40, false));
  await open();
  expect(screen.getByText('Zone 2 · 40/150 min')).toBeTruthy();
  expect(screen.getByText('Intervals · 0/2 this week')).toBeTruthy();
  expect(screen.getAllByText('25 min').length).toBeGreaterThan(0);
  expect(screen.getByText('ZONE 2')).toBeTruthy();
  expect(screen.getByText('INTERVALS')).toBeTruthy();
});

test('Completed on Zone 2 logs 25 min and the header becomes 25/150', async () => {
  await open();
  const id = screen.getAllByTestId(/^exercise-card-/).map(c => c.props.testID.replace('exercise-card-', '')).find(x => x === firstZone2())!;
  await fireEvent.press(screen.getByTestId(`complete-${id}`));
  await flush();
  expect(await tonight(id)).toEqual([{ weight: null, reps: null, seconds: 1500 }]);
  expect(await screen.findByText('Zone 2 · 25/150 min')).toBeTruthy();
});

test('the Zone 2 timer shows elapsed time and never logs on its own', async () => {
  await open();
  const id = firstZone2();
  await fireEvent.press(within(screen.getByTestId(`exercise-card-${id}`)).getByText('Start timer'));
  await act(async () => { jest.advanceTimersByTime(65_000); });
  expect(within(screen.getByTestId(`exercise-card-${id}`)).getByText('1:05')).toBeTruthy();
  expect(await tonight(id)).toEqual([]);
});

test('a rep interval logs through 4 dots and marks the day as an interval day', async () => {
  await open();
  for (const i of [0, 1, 2, 3]) {
    await fireEvent.press(screen.getByTestId(`dot-burpees-${i}`));
    await flush();
  }
  expect(await tonight('burpees')).toHaveLength(4);
  expect((await loadHistory(db)).sessions.find(s => s.date === TODAY)?.intervals).toBe(true);
  expect(await screen.findByText('Intervals · 1/2 this week')).toBeTruthy();
});

test('the cap note appears at 2 interval days', async () => {
  await saveSession(db, timed('2026-11-22', 'Battling_Ropes', 5, true));
  await saveSession(db, timed('2026-11-24', 'Battling_Ropes', 5, true));
  await open();
  expect(screen.getByText('2 of 2 done this week')).toBeTruthy();
});
