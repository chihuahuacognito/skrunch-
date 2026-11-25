import { act, fireEvent, screen } from '@testing-library/react-native';
import { saveSession } from '../../store/history';
import { migrate } from '../../store/schema';
import type { SqlDb } from '../../store/sql';
import { nodeDb } from '../../store/test-utils/nodeDb';
import { renderApp } from '../../test-utils/renderApp';
import HistoryScreen from '../../app/history';

jest.mock('../../haptics', () => ({ tick: jest.fn(), impact: jest.fn() }));
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { __fake } = require('expo-file-system') as { __fake: { PICKED: string; folders: Map<string, Map<string, string>>; reset(): void } };

const flush = () => act(async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); });
const squat = (date: string, reps: number[]) => ({
  date, focus: 'free', intervals: false,
  exercises: [{ exerciseId: 'Barbell_Squat', targetMin: 6, targetMax: 8, chip: null, plannedSets: 3, sets: reps.map(r => ({ weight: 60, reps: r, seconds: null })) }],
});

let db: SqlDb;
beforeEach(async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 25, 19, 0) });
  __fake.reset();
  db = nodeDb();
  await migrate(db);
});
afterEach(() => jest.useRealTimers());

test('history lists days newest first and expands a day', async () => {
  await saveSession(db, squat('2026-11-20', [8, 8, 7]));
  await saveSession(db, squat('2026-11-25', [6, 6, 6]));
  await renderApp({ history: HistoryScreen }, { db, initialUrl: '/history' });
  const first = await screen.findByText('Wed 25 Nov · Quads · 3 sets');
  expect(screen.getByText('Fri 20 Nov · Quads · 3 sets')).toBeTruthy();
  expect(screen.queryByText('Barbell Squat · 60 kg × 6, 6, 6')).toBeNull();
  await fireEvent.press(first);
  expect(await screen.findByText('Barbell Squat · 60 kg × 6, 6, 6')).toBeTruthy();
});

test('an empty history says so', async () => {
  await renderApp({ history: HistoryScreen }, { db, initialUrl: '/history' });
  expect(await screen.findByText('Nothing logged yet')).toBeTruthy();
});

test('export saves through the remembered folder and shows the file name', async () => {
  await saveSession(db, squat('2026-11-25', [6, 6, 6]));
  await renderApp({ history: HistoryScreen }, { db, initialUrl: '/history' });
  await fireEvent.press(await screen.findByText('Export history'));
  await flush();
  expect(await screen.findByText('Saved workout-history-2026-11-25.json')).toBeTruthy();
  expect(JSON.parse(__fake.folders.get(__fake.PICKED)!.get('workout-history-2026-11-25.json')!).sessions).toHaveLength(1);
});
