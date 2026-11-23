import { fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { migrate } from '../../store/schema';
import type { SqlDb } from '../../store/sql';
import { nodeDb } from '../../store/test-utils/nodeDb';
import { renderApp } from '../../test-utils/renderApp';
import { GUIDANCE } from '../../ui/labels';
import SummaryScreen from '../../app/summary';

let db: SqlDb;
beforeEach(async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 22, 21, 0) });
  db = nodeDb();
  await migrate(db);
});
afterEach(() => jest.useRealTimers());

const routes = { index: () => <Text>Check-in stub</Text>, summary: SummaryScreen };

test('the summary shows the session line and the guidance note', async () => {
  await renderApp(routes, { db, initialUrl: '/summary?minutes=54&sets=21&exercises=9' });
  expect(await screen.findByText('Saved')).toBeTruthy();
  expect(screen.getByText('54 min · 21 sets · 9 exercises')).toBeTruthy();
  for (const line of GUIDANCE) expect(screen.getByText(line)).toBeTruthy();
});

test('done leaves the summary', async () => {
  await renderApp(routes, { db, initialUrl: '/summary?minutes=54&sets=21&exercises=9' });
  await fireEvent.press(await screen.findByLabelText('Done'));
  expect(await screen.findByText('Check-in stub')).toBeTruthy();
});

test('bad parameters go home', async () => {
  await renderApp(routes, { db, initialUrl: '/summary?minutes=abc' });
  expect(await screen.findByText('Check-in stub')).toBeTruthy();
});
