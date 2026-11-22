import { fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { checkInFor, saveCheckIn } from '../../store/history';
import { migrate } from '../../store/schema';
import type { SqlDb } from '../../store/sql';
import { nodeDb } from '../../store/test-utils/nodeDb';
import { renderApp } from '../../test-utils/renderApp';
import CheckInScreen from '../../app/index';

jest.mock('../../haptics', () => ({ tick: jest.fn(), impact: jest.fn() }));

const TODAY = '2026-11-22';
let db: SqlDb;
beforeEach(async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 22, 19, 0) });
  db = nodeDb();
  await migrate(db);
});
afterEach(() => jest.useRealTimers());

const routes = {
  index: CheckInScreen,
  menu: () => <Text>Menu stub</Text>,
  desk: () => <Text>Desk stub</Text>,
};

test('first open shows the check-in', async () => {
  await renderApp(routes, { db });
  for (const l of ['Good', 'OK', 'Wrecked', 'Desk reset']) expect(await screen.findByLabelText(l)).toBeTruthy();
  expect(screen.getByLabelText('Gym')).toBeSelected();
  expect(screen.getByText('Sun 22 Nov')).toBeTruthy();
});

test('picking a check-in saves it with the place and opens the menu', async () => {
  await renderApp(routes, { db });
  await fireEvent.press(await screen.findByLabelText('Home'));
  await fireEvent.press(screen.getByLabelText('OK'));
  expect(await screen.findByText('Menu stub')).toBeTruthy();
  expect(screen).toHavePathname('/menu');
  expect(await checkInFor(db, TODAY)).toEqual({ value: 'ok', place: 'home' });
});

test('an existing check-in goes straight to the menu', async () => {
  await saveCheckIn(db, TODAY, 'good', 'gym');
  await renderApp(routes, { db });
  expect(await screen.findByText('Menu stub')).toBeTruthy();
});

test('redo shows the check-in again, starting at the saved place', async () => {
  await saveCheckIn(db, TODAY, 'good', 'home');
  await renderApp(routes, { db, initialUrl: '/?redo=1' });
  expect(await screen.findByLabelText('Good')).toBeTruthy();
  expect(screen.getByLabelText('Home')).toBeSelected();
});

test('desk reset opens without a check-in', async () => {
  await renderApp(routes, { db });
  await fireEvent.press(await screen.findByLabelText('Desk reset'));
  expect(await screen.findByText('Desk stub')).toBeTruthy();
  expect(await checkInFor(db, TODAY)).toBeNull();
});
