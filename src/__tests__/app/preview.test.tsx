import { fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { saveCheckIn } from '../../store/history';
import { migrate } from '../../store/schema';
import type { SqlDb } from '../../store/sql';
import { nodeDb } from '../../store/test-utils/nodeDb';
import { renderApp } from '../../test-utils/renderApp';
import PreviewScreen from '../../app/preview';

const TODAY = '2026-11-22';
let db: SqlDb;
beforeEach(async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 22, 19, 0) });
  db = nodeDb();
  await migrate(db);
  await saveCheckIn(db, TODAY, 'good', 'gym');
});
afterEach(() => jest.useRealTimers());

const routes = {
  index: () => <Text>Check-in stub</Text>,
  menu: () => <Text>Menu stub</Text>,
  preview: PreviewScreen,
};

test('a chest/back preview lists its blocks and minutes', async () => {
  await renderApp(routes, { db, initialUrl: '/preview?focus=chest-back&dose=full' });
  expect(await screen.findByText('Chest / Back')).toBeTruthy();
  expect(screen.getByText(/^~\d+ min$/)).toBeTruthy();
  expect(screen.getByText('Calibration week')).toBeTruthy();
  for (const t of ['Warm-up', 'Main lift', 'Superset', 'Cool-down']) expect(screen.getAllByText(t).length).toBeGreaterThan(0);
  expect(screen.getAllByText(/^3 × \d+(-\d+)?$/).length).toBeGreaterThan(0);
});

test('superset items are labelled A1 and A2', async () => {
  await renderApp(routes, { db, initialUrl: '/preview?focus=chest-back&dose=full' });
  expect(await screen.findByText('A1')).toBeTruthy();
  expect(screen.getByText('A2')).toBeTruthy();
});

test('unknown focus returns to the menu', async () => {
  await renderApp(routes, { db, initialUrl: '/preview?focus=legs&dose=full' });
  expect(await screen.findByText('Menu stub')).toBeTruthy();
});

test('without a check-in today the preview sends you to check in', async () => {
  await db.runAsync('DELETE FROM check_ins');
  await renderApp(routes, { db, initialUrl: '/preview?focus=lower&dose=full' });
  expect(await screen.findByText('Check-in stub')).toBeTruthy();
});

test('rest shows the rest message and goes back to the menu', async () => {
  await renderApp(routes, { db, initialUrl: '/preview?focus=rest&dose=full' });
  expect(await screen.findByText('Rest tonight. Walk, stretch, sleep.')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Back to the menu'));
  expect(await screen.findByText('Menu stub')).toBeTruthy();
});

test('start waits for the next update', async () => {
  await renderApp(routes, { db, initialUrl: '/preview?focus=lower&dose=full' });
  expect(await screen.findByLabelText('Start')).toBeDisabled();
  expect(screen.getByText('Logging arrives in the next update')).toBeTruthy();
});
