import { fireEvent, screen } from '@testing-library/react-native';
import { Directory } from 'expo-file-system';
import { Text } from 'react-native';
import { migrate } from '../../store/schema';
import type { SqlDb } from '../../store/sql';
import { nodeDb } from '../../store/test-utils/nodeDb';
import { renderApp } from '../../test-utils/renderApp';
import { GUIDANCE } from '../../ui/labels';
import SummaryScreen from '../../app/summary';

let db: SqlDb;
// eslint-disable-next-line @typescript-eslint/no-require-imports
const fake = (require('expo-file-system') as { __fake: { PICKED: string; folders: Map<string, Map<string, string>>; reset(): void } }).__fake;

beforeEach(async () => {
  fake.reset();
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

test('export history saves the file and says so', async () => {
  await renderApp(routes, { db, initialUrl: '/summary?minutes=54&sets=21&exercises=9' });
  await fireEvent.press(await screen.findByLabelText('Export history'));
  expect(await screen.findByText('Saved workout-history-2026-11-22.json')).toBeTruthy();
  expect(JSON.parse(fake.folders.get(fake.PICKED)!.get('workout-history-2026-11-22.json')!).format).toBe('workout-history');
});

test('a failed export says so', async () => {
  (Directory.pickDirectoryAsync as jest.Mock).mockRejectedValueOnce(new Error('no picker'));
  await renderApp(routes, { db, initialUrl: '/summary?minutes=54&sets=21&exercises=9' });
  await fireEvent.press(await screen.findByLabelText('Export history'));
  expect(await screen.findByText('Export failed. Try again.')).toBeTruthy();
});
