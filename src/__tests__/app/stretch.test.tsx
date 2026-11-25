import { fireEvent, screen } from '@testing-library/react-native';
import { saveSession } from '../../store/history';
import { migrate } from '../../store/schema';
import type { SqlDb } from '../../store/sql';
import { nodeDb } from '../../store/test-utils/nodeDb';
import { renderApp } from '../../test-utils/renderApp';
import { LIBRARY } from '../../ui/library';
import Stretch from '../../app/stretch';
import Desk from '../../app/desk';

jest.mock('../../haptics', () => ({ tick: jest.fn(), impact: jest.fn() }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));

const routes = { stretch: Stretch, desk: Desk };
const BY_ID = new Map(LIBRARY.map(e => [e.id, e]));

let db: SqlDb;
beforeEach(async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 25, 19, 0) });
  db = nodeDb();
  await migrate(db);
});
afterEach(() => jest.useRealTimers());

const coolDownIds = () => screen.getAllByTestId(/^cooldown-/).map(r => r.props.testID.replace('cooldown-', '') as string);

test('cool-down lists stretches, always a lower back and a hip flexor one first', async () => {
  await renderApp(routes, { db, initialUrl: '/stretch' });
  expect(await screen.findByText('Cool-down')).toBeTruthy();
  const ids = coolDownIds();
  expect(ids.length).toBeGreaterThanOrEqual(3);
  expect(ids.every(id => BY_ID.get(id)?.type === 'stretch')).toBe(true);
  expect(BY_ID.get(ids[0])!.muscles).toContain('lower back');
  expect(BY_ID.get(ids[1])!.muscles).toContain('hip flexors');
});

test("cool-down covers tonight's groups", async () => {
  await saveSession(db, {
    date: '2026-11-25', focus: 'free', intervals: false,
    exercises: [{ exerciseId: 'Barbell_Squat', targetMin: 6, targetMax: 8, chip: null, plannedSets: 3, sets: [{ weight: 60, reps: 6, seconds: null }] }],
  });
  await renderApp(routes, { db, initialUrl: '/stretch' });
  await screen.findByText('Cool-down');
  expect(coolDownIds().slice(2).some(id => BY_ID.get(id)!.muscles.includes('quadriceps'))).toBe(true);
});

test('the Desk reset card opens the desk reset', async () => {
  await renderApp(routes, { db, initialUrl: '/stretch' });
  await fireEvent.press(await screen.findByText('Desk reset'));
  expect(await screen.findByText(/^1 \/ \d+$/)).toBeTruthy();
});
