import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import type { SessionLog } from '../../builder';
import { saveSession } from '../../store/history';
import { migrate } from '../../store/schema';
import type { SqlDb } from '../../store/sql';
import { nodeDb } from '../../store/test-utils/nodeDb';
import { saveTonight } from '../../store/tonight';
import { emptyTonight } from '../../tonight';
import { renderApp } from '../../test-utils/renderApp';
import Home from '../../app/index';
import Cardio from '../../app/cardio';
import Stretch from '../../app/stretch';
import History from '../../app/history';
import Group from '../../app/group/[id]';

jest.mock('../../haptics', () => ({ tick: jest.fn(), impact: jest.fn() }));

const routes = { index: Home, cardio: Cardio, stretch: Stretch, history: History, 'group/[id]': Group };
const NOW = new Date(2026, 10, 25, 19, 0);
const squat = (date: string, sets: number): SessionLog => ({
  date, focus: 'free', intervals: false,
  exercises: [{ exerciseId: 'Barbell_Squat', targetMin: 6, targetMax: 8, chip: null, plannedSets: 3, sets: Array.from({ length: sets }, () => ({ weight: 60, reps: 6, seconds: null })) }],
});

let db: SqlDb;
beforeEach(async () => {
  jest.useFakeTimers({ now: NOW });
  db = nodeDb();
  await migrate(db);
});
afterEach(() => jest.useRealTimers());

const open = async () => {
  await renderApp(routes, { db });
  await waitFor(() => expect(screen.getByTestId('group-card-quads')).toBeTruthy());
};

test('the grid shows recency, sets against target and BEHIND per group', async () => {
  await saveSession(db, squat('2026-11-20', 3));
  await open();
  const quads = within(screen.getByTestId('group-card-quads'));
  expect(quads.getByText('Quads')).toBeTruthy();
  expect(quads.getByText('5d ago')).toBeTruthy();
  expect(quads.getByText('3/8')).toBeTruthy();
  expect(quads.getByText('BEHIND')).toBeTruthy();
  const calves = within(screen.getByTestId('group-card-calves'));
  expect(calves.getByText('Never')).toBeTruthy();
  expect(calves.getByText('0/6')).toBeTruthy();
  expect(calves.queryByText('BEHIND')).toBeNull();
  expect(screen.getByText('Last 7 days')).toBeTruthy();
  expect(screen.getByText('Thu 19 - Wed 25 Nov')).toBeTruthy();
  expect(screen.getByText('Fill height = sets vs target')).toBeTruthy();
});

test('tapping a grid card opens the group screen', async () => {
  await open();
  await act(async () => fireEvent.press(screen.getByTestId('group-card-quads')));
  expect(await screen.findByTestId('screen-group-quads')).toBeTruthy();
});

test('tapping a figure region opens its group', async () => {
  await open();
  await act(async () => fireEvent.press(screen.getByTestId('hit-back-hamstrings-0')));
  expect(await screen.findByTestId('screen-group-hamstrings')).toBeTruthy();
});

test('Cardio, Stretch and the week card open their screens', async () => {
  await open();
  await act(async () => fireEvent.press(screen.getByText('Cardio')));
  expect(await screen.findByTestId('screen-cardio')).toBeTruthy();
});

test('Stretch and History open from Home', async () => {
  await open();
  await act(async () => fireEvent.press(screen.getByText('Stretch')));
  expect(await screen.findByTestId('screen-stretch')).toBeTruthy();
});

test('the week card opens History', async () => {
  await open();
  await act(async () => fireEvent.press(screen.getByText('Last 7 days')));
  expect(await screen.findByTestId('screen-history')).toBeTruthy();
});

test('the Cardio card shows Zone 2 minutes this week', async () => {
  await open();
  expect(screen.getByText('Zone 2 · 0/150 min')).toBeTruthy();
});

test('the Tonight strip appears after the first set and counts groups, sets and minutes', async () => {
  await saveSession(db, squat('2026-11-25', 6));
  await saveTonight(db, { ...emptyTonight('2026-11-25'), firstSetAt: NOW.getTime() - 34 * 60_000 });
  await open();
  const strip = within(await screen.findByTestId('tonight-strip'));
  expect(strip.getByText('1 group')).toBeTruthy();
  expect(strip.getByText('6 sets')).toBeTruthy();
  expect(strip.getByText('34 min')).toBeTruthy();
});

test('no Tonight strip before the first set', async () => {
  await open();
  expect(screen.queryByTestId('tonight-strip')).toBeNull();
});

test('a running rest reopens the last group on launch', async () => {
  await saveTonight(db, {
    ...emptyTonight('2026-11-25'), lastGroup: 'quads', lastActionAt: NOW.getTime() - 60_000,
    rest: { endsAt: NOW.getTime() + 60_000, seconds: 120, exerciseId: 'Barbell_Squat', set: 1, of: 3 },
  });
  await renderApp(routes, { db });
  expect(await screen.findByTestId('screen-group-quads')).toBeTruthy();
});

test('a last action over 45 minutes ago stays on Home', async () => {
  await saveTonight(db, { ...emptyTonight('2026-11-25'), lastGroup: 'quads', lastActionAt: NOW.getTime() - 46 * 60_000 });
  await open();
  expect(screen.queryByTestId('screen-group-quads')).toBeNull();
});

test('after the 04:00 rollover the strip disappears', async () => {
  await saveSession(db, squat('2026-11-25', 6));
  await saveTonight(db, { ...emptyTonight('2026-11-25'), firstSetAt: NOW.getTime() - 60_000 });
  await open();
  expect(await screen.findByTestId('tonight-strip')).toBeTruthy();
  await act(async () => {
    jest.setSystemTime(new Date(2026, 10, 26, 4, 1));
    jest.advanceTimersByTime(60_000);
  });
  await waitFor(() => expect(screen.queryByTestId('tonight-strip')).toBeNull());
  expect(within(screen.getByTestId('group-card-quads')).getByText('1d ago')).toBeTruthy();
});
