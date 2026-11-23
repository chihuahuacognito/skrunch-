import { act, fireEvent, screen } from '@testing-library/react-native';
import { AppState, Text, type AppStateStatus } from 'react-native';
import { buildSession, type BuilderInput, type CheckIn, type Place } from '../../builder';
import { emptyHistory } from '../../builder/test-utils/fixtures';
import { saveDraft } from '../../store/workout';
import { startWorkout } from '../../workout';
import { saveCheckIn } from '../../store/history';
import { migrate } from '../../store/schema';
import type { SqlDb } from '../../store/sql';
import { nodeDb } from '../../store/test-utils/nodeDb';
import { renderApp } from '../../test-utils/renderApp';
import { testRouter } from 'expo-router/testing-library';
import { State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { arcLayout } from '../../features/arc/geometry';
import { tokens } from '../../theme/tokens';
import { LIBRARY } from '../../ui/library';
import MenuScreen, { menuItems } from '../../app/menu';

jest.mock('../../haptics', () => ({ tick: jest.fn(), impact: jest.fn() }));

const TODAY = '2026-11-22';
const LIFTING = ['chest-back', 'lower', 'shoulders-arms', 'full-body', 'conditioning'];
const input = (checkIn: CheckIn, place: Place = 'gym'): BuilderInput =>
  ({ library: LIBRARY, history: { sessions: [], checkIns: [], feedback: {} }, today: TODAY, checkIn, place });

test('first evening offers lifting focuses, mobility and the desk reset', () => {
  const items = menuItems(input('good'));
  expect(items.length).toBeGreaterThanOrEqual(5);
  expect(items.slice(0, 3).every(i => LIFTING.includes(i.id.split(':')[0]))).toBe(true);
  expect(items[items.length - 2].label).toBe('Mobility + Zone 2');
  expect(items[items.length - 1]).toMatchObject({ id: 'desk-reset', label: 'Desk reset' });
});

test('home menu offers mobility and desk reset only', () => {
  const ids = menuItems(input('good', 'home')).map(i => i.id.split(':')[0]);
  expect(ids).toEqual(['mobility', 'desk-reset']);
});

test('wrecked leads with rest', () => {
  const items = menuItems(input('wrecked'));
  expect(items[0]).toMatchObject({ label: 'Rest', hint: 'Walk, stretch, sleep' });
});

test('hints show the dose and the estimated minutes', () => {
  const items = menuItems(input('ok'));
  expect(items[0].hint).toMatch(/^Reduced · ~\d+ min$/);
  expect(menuItems(input('good'))[0].hint).toMatch(/^~\d+ min$/);
});

describe('screen', () => {
  let db: SqlDb;
  beforeEach(async () => {
    jest.useFakeTimers({ now: new Date(2026, 10, 22, 19, 0) });
    db = nodeDb();
    await migrate(db);
  });
  afterEach(() => jest.useRealTimers());

  const routes = {
    index: () => <Text>Check-in stub</Text>,
    menu: MenuScreen,
    preview: () => <Text>Preview stub</Text>,
    desk: () => <Text>Desk stub</Text>,
    workout: () => <Text>Workout stub</Text>,
  };

  test('a workout in progress opens instead of the menu', async () => {
    await saveCheckIn(db, TODAY, 'good', 'gym');
    const s = buildSession({ library: LIBRARY, history: emptyHistory(), today: TODAY, checkIn: 'good', place: 'gym' }, { focus: 'lower', dose: 'full' });
    await saveDraft(db, startWorkout(s, LIBRARY, emptyHistory(), 0));
    await renderApp(routes, { db, initialUrl: '/menu' });
    expect(await screen.findByText('Workout stub')).toBeTruthy();
  });

  test('without a check-in today the menu sends you to check in', async () => {
    await renderApp(routes, { db, initialUrl: '/menu' });
    expect(await screen.findByText('Check-in stub')).toBeTruthy();
  });

  test('picking a focus opens its preview', async () => {
    await saveCheckIn(db, TODAY, 'good', 'gym');
    await renderApp(routes, { db, initialUrl: '/menu' });
    const first = menuItems(input('good'))[0];
    await fireEvent.press(await screen.findByLabelText(first.label));
    expect(await screen.findByText('Preview stub')).toBeTruthy();
    const [focus, dose] = first.id.split(':');
    expect(screen).toHavePathname('/preview');
    expect(screen).toHaveSearchParams({ focus, dose });
  });

  test('the check-in line links back to redo the check-in', async () => {
    await saveCheckIn(db, TODAY, 'ok', 'home');
    await renderApp(routes, { db, initialUrl: '/menu' });
    await fireEvent.press(await screen.findByLabelText('Checked in OK at home. Change'));
    expect(await screen.findByText('Check-in stub')).toBeTruthy();
    expect(screen).toHaveSearchParams({ redo: '1' });
  });

  test('the menu left open overnight asks for the new day check-in', async () => {
    const listeners: ((s: AppStateStatus) => void)[] = [];
    jest.spyOn(AppState, 'addEventListener').mockImplementation((_t, fn) => {
      listeners.push(fn as (s: AppStateStatus) => void);
      return { remove: () => {} } as unknown as ReturnType<typeof AppState.addEventListener>;
    });
    await saveCheckIn(db, TODAY, 'good', 'gym');
    await renderApp(routes, { db, initialUrl: '/menu' });
    await screen.findByText('Tonight');
    jest.setSystemTime(new Date(2026, 10, 23, 19, 0));
    await act(async () => listeners.forEach(fn => fn('active')));
    expect(await screen.findByText('Check-in stub')).toBeTruthy();
    jest.restoreAllMocks();
  });

  test('two selections before navigation lands open one preview', async () => {
    await saveCheckIn(db, TODAY, 'good', 'gym');
    const app = await renderApp(routes, { db, initialUrl: '/menu' });
    await screen.findByText('Tonight');
    await fireEvent(screen.getByTestId('thumb-arc'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } } });
    const y = arcLayout(menuItems(input('good')).length, 800, tokens.arc).centers[0];
    const sweep = () =>
      fireGestureHandler(getByGestureTestId('thumb-arc-pan'), [
        { state: State.BEGAN, x: 380, y }, { state: State.ACTIVE, x: 380, y }, { state: State.END, x: 380, y },
      ]);
    // Two selections in the same frame: neither has navigated yet when the other fires.
    await act(async () => {
      sweep();
      sweep();
    });
    await screen.findByText('Preview stub');
    // The app's stack is nested under expo-router's root navigator.
    const stack = app.getRouterState()?.routes[0]?.state as { routes: { name: string }[] } | undefined;
    const routesOpen = (stack?.routes ?? []).map(r => r.name);
    expect(routesOpen.filter(n => n === 'preview')).toHaveLength(1);
    // Back on the menu, the next selection works again.
    await testRouter.back('/menu');
    await fireEvent.press(screen.getByLabelText(menuItems(input('good'))[0].label));
    expect(screen).toHavePathname('/preview');
  });
});
