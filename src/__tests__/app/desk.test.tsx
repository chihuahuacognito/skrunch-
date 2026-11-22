import { act, fireEvent, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { buildDeskReset } from '../../builder';
import { migrate } from '../../store/schema';
import type { SqlDb } from '../../store/sql';
import { nodeDb } from '../../store/test-utils/nodeDb';
import { renderApp } from '../../test-utils/renderApp';
import { LIBRARY } from '../../ui/library';
import DeskScreen from '../../app/desk';

jest.mock('../../haptics', () => ({ tick: jest.fn(), impact: jest.fn() }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { useKeepAwake } = require('expo-keep-awake') as { useKeepAwake: jest.Mock };

const NAME = new Map(LIBRARY.map(e => [e.id, e.name]));
const items = buildDeskReset(LIBRARY, '2026-11-22').blocks.flatMap(b => b.items);

let db: SqlDb;
beforeEach(async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 22, 19, 0) });
  db = nodeDb();
  await migrate(db);
});
afterEach(() => jest.useRealTimers());

const routes = { index: () => <Text>Check-in stub</Text>, desk: DeskScreen };

test('desk reset steps through every item', async () => {
  await renderApp(routes, { db, initialUrl: '/desk' });
  expect(await screen.findByText(`1 / ${items.length}`)).toBeTruthy();
  expect(screen.getByText(NAME.get(items[0].exerciseId)!)).toBeTruthy();
  for (let i = 1; i < items.length; i++) await fireEvent.press(screen.getByLabelText('Next'));
  expect(screen.getByText(`${items.length} / ${items.length}`)).toBeTruthy();
  expect(screen.getByLabelText('Done')).toBeTruthy();
  await fireEvent.press(screen.getByLabelText('Back'));
  expect(screen.getByText(`${items.length - 1} / ${items.length}`)).toBeTruthy();
});

test('a hold counts down and advances by itself', async () => {
  const at = items.findIndex(i => i.dose.format === 'hold');
  const hold = items[at].dose as { format: 'hold'; seconds: number };
  await renderApp(routes, { db, initialUrl: '/desk' });
  await screen.findByText(`1 / ${items.length}`);
  for (let i = 0; i < at; i++) await fireEvent.press(screen.getByLabelText('Next'));
  await fireEvent.press(screen.getByLabelText(`Start ${hold.seconds} s`));
  await act(async () => jest.advanceTimersByTime(1000));
  expect(screen.getByText(`${hold.seconds - 1}`)).toBeTruthy();
  await act(async () => jest.advanceTimersByTime(hold.seconds * 1000));
  expect(screen.getByText(`${at + 2} / ${items.length}`)).toBeTruthy();
});

test('rep items have no timer', async () => {
  const at = items.findIndex(i => i.dose.format === 'reps');
  await renderApp(routes, { db, initialUrl: '/desk' });
  await screen.findByText(`1 / ${items.length}`);
  for (let i = 0; i < at; i++) await fireEvent.press(screen.getByLabelText('Next'));
  expect(screen.queryByLabelText(/^Start/)).toBeNull();
});

test('done leaves the desk reset', async () => {
  await renderApp(routes, { db, initialUrl: '/desk' });
  await screen.findByText(`1 / ${items.length}`);
  for (let i = 1; i < items.length; i++) await fireEvent.press(screen.getByLabelText('Next'));
  await fireEvent.press(screen.getByLabelText('Done'));
  expect(await screen.findByText('Check-in stub')).toBeTruthy();
});

test('the screen stays awake during the desk reset', async () => {
  await renderApp(routes, { db, initialUrl: '/desk' });
  await screen.findByText(`1 / ${items.length}`);
  expect(useKeepAwake).toHaveBeenCalled();
});
