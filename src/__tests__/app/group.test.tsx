import { act, fireEvent, screen, waitFor, within } from '@testing-library/react-native';
import type { LoggedSet, SessionLog } from '../../builder';
import { loadHistory, saveSession } from '../../store/history';
import { migrate } from '../../store/schema';
import type { SqlDb } from '../../store/sql';
import { nodeDb } from '../../store/test-utils/nodeDb';
import { renderApp } from '../../test-utils/renderApp';
import Home from '../../app/index';
import Group from '../../app/group/[id]';

jest.mock('../../haptics', () => ({ tick: jest.fn(), impact: jest.fn() }));
jest.mock('expo-keep-awake', () => ({ useKeepAwake: jest.fn() }));

const routes = { index: Home, 'group/[id]': Group };
const TODAY = '2026-11-25';
const day = (date: string, id: string, sets: LoggedSet[], targetMin: number): SessionLog => ({
  date, focus: 'free', intervals: false,
  exercises: [{ exerciseId: id, targetMin, targetMax: 8, chip: null, plannedSets: 3, sets }],
});
const sets = (n: number, weight: number, reps: number): LoggedSet[] => Array.from({ length: n }, () => ({ weight, reps, seconds: null }));

let db: SqlDb;
beforeEach(async () => {
  jest.useFakeTimers({ now: new Date(2026, 10, 25, 19, 0) });
  db = nodeDb();
  await migrate(db);
  // Squat 9 days ago, 3 x 5 @ 60 kg at a target of 5: tonight's target is 3 x 6 @ 60 kg.
  await saveSession(db, day('2026-11-16', 'Barbell_Squat', sets(3, 60, 5), 5));
});
afterEach(() => jest.useRealTimers());

const open = async (group = 'quads') => {
  await renderApp(routes, { db, initialUrl: `/group/${group}` });
  await waitFor(() => expect(screen.getAllByTestId(/^exercise-card-/)).toHaveLength(3));
};
const cardIds = () => screen.getAllByTestId(/^exercise-card-/).map(c => c.props.testID.replace('exercise-card-', '') as string);
const tonight = async (id: string) =>
  (await loadHistory(db)).sessions.filter(s => s.date === TODAY).flatMap(s => s.exercises).find(x => x.exerciseId === id)?.sets ?? [];
const press = (testID: string) => fireEvent.press(screen.getByTestId(testID));
/** Lets queued sqlite writes and the re-render after them land. */
const flush = () => act(async () => { for (let i = 0; i < 30; i++) await Promise.resolve(); });

test('renders the header and 3 cards; the main lift shows its exact target and last line', async () => {
  await open();
  expect(screen.getByText('Quads')).toBeTruthy();
  expect(screen.getByText('Rested · last worked 9 days ago')).toBeTruthy();
  expect(screen.getByText(/sets this week/)).toBeTruthy();
  expect(cardIds()[0]).toBe('Barbell_Squat');
  const card = within(screen.getByTestId('exercise-card-Barbell_Squat'));
  expect(card.getByText('MAIN LIFT')).toBeTruthy();
  expect(card.getByText('3 × 6 @ 60 kg')).toBeTruthy();
  expect(card.getByText('Last: 9 days ago · 60 kg × 5')).toBeTruthy();
  expect(screen.getAllByText('ACCESSORY')).toHaveLength(2);
});

test('a dot logs one set and shows the rest panel at 2:00; a double tap logs once', async () => {
  await open();
  await press('dot-Barbell_Squat-0');
  await press('dot-Barbell_Squat-0');
  await flush();
  expect(await tonight('Barbell_Squat')).toEqual(sets(1, 60, 6));
  const rest = () => within(screen.getByTestId('rest-panel'));
  expect(rest().getByText('2:00')).toBeTruthy();
  expect(rest().getByText('Barbell Squat · set 1 of 3 done')).toBeTruthy();
  await fireEvent.press(rest().getByText('+15 s'));
  await waitFor(() => expect(rest().getByText('2:15')).toBeTruthy());
  await fireEvent.press(rest().getByText('Skip'));
  await waitFor(() => expect(screen.queryByTestId('rest-panel')).toBeNull());
});

test('a tap on a later dot than the next one is ignored', async () => {
  await open();
  await press('dot-Barbell_Squat-2');
  expect(await tonight('Barbell_Squat')).toEqual([]);
});

test('the third dot completes the exercise and still rests', async () => {
  await open();
  for (const i of [0, 1, 2]) await press(`dot-Barbell_Squat-${i}`);
  await waitFor(() => expect(screen.getByText('Completed · 3 × 6 @ 60 kg')).toBeTruthy());
  expect(await screen.findByTestId('rest-panel')).toBeTruthy();
});

test('Completed fills the remaining sets without a rest; Undo empties them', async () => {
  await open();
  await press('complete-Barbell_Squat');
  await flush();
  expect(await tonight('Barbell_Squat')).toHaveLength(3);
  expect(await screen.findByText('Completed · 3 × 6 @ 60 kg')).toBeTruthy();
  expect(screen.queryByTestId('rest-panel')).toBeNull();
  await press('undo-Barbell_Squat');
  await flush();
  expect(await tonight('Barbell_Squat')).toEqual([]);
  expect(await screen.findByTestId('complete-Barbell_Squat')).toBeTruthy();
});

test('a first-time loaded lift asks for the weight on its first dot, then logs and rests', async () => {
  await open();
  const fresh = cardIds().find(id => within(screen.getByTestId(`exercise-card-${id}`)).queryByText(/set weight/))!;
  expect(fresh).toBeDefined();
  await press(`dot-${fresh}-0`);
  expect(await tonight(fresh)).toEqual([]);
  await fireEvent.changeText(await screen.findByLabelText('Weight'), '12.5');
  await fireEvent.press(screen.getByText('Save'));
  await flush();
  expect((await tonight(fresh))[0]?.weight).toBe(12.5);
  expect(await screen.findByTestId('rest-panel')).toBeTruthy();
  await press(`dot-${fresh}-1`);
  await flush();
  expect(await tonight(fresh)).toHaveLength(2);
});

test('Edit to 2 sets of 7 replaces tonight sets and keeps the dots at 2', async () => {
  await open();
  await press('edit-Barbell_Squat');
  await fireEvent.changeText(await screen.findByLabelText('Reps'), '7');
  await fireEvent.press(screen.getByLabelText('More sets'));
  await fireEvent.press(screen.getByLabelText('More sets'));
  await fireEvent.press(screen.getByText('Save'));
  await flush();
  expect(await tonight('Barbell_Squat')).toEqual(sets(2, 60, 7));
  await waitFor(() => expect(screen.getByTestId('dot-Barbell_Squat-1').props.accessibilityState).toMatchObject({ checked: true }));
  expect(screen.getByTestId('dot-Barbell_Squat-2').props.accessibilityState).toMatchObject({ checked: false });
  expect(screen.queryByText(/^Completed ·/)).toBeNull();
});

test('the warm-up card shows before the first set of the evening and goes after it', async () => {
  await open();
  expect(screen.getByText(/^Warm-up · \d moves/)).toBeTruthy();
  await press('dot-Barbell_Squat-0');
  await waitFor(() => expect(screen.queryByText(/^Warm-up ·/)).toBeNull());
});

test('the enough card turns complete at 8 direct sets tonight', async () => {
  await saveSession(db, day(TODAY, 'Leg_Press', sets(8, 100, 10), 10));
  await open();
  expect(screen.getByText('Quads tonight: 8 sets. Anything past here is a bonus.')).toBeTruthy();
  expect(screen.getByTestId('enough-card').props.accessibilityState).toMatchObject({ checked: true });
});

test('More promotes an exercise to a full card; cards stay frozen after logging', async () => {
  await open();
  const before = cardIds();
  await press('dot-Barbell_Squat-0');
  await fireEvent.press(screen.getByText('More exercises'));
  const row = (await screen.findAllByTestId(/^more-row-/))[0];
  const promoted = row.props.testID.replace('more-row-', '');
  await fireEvent.press(row);
  await waitFor(() => expect(cardIds()).toEqual([...before, promoted]));
});

test('the Home chip returns Home', async () => {
  await open();
  await press('chip-home');
  expect(await screen.findByTestId('group-card-quads')).toBeTruthy();
});

test('an unknown group id redirects Home', async () => {
  await renderApp(routes, { db, initialUrl: '/group/neck' });
  expect(await screen.findByTestId('group-card-quads')).toBeTruthy();
});

test('the photo opens the detail sheet with instructions and feedback', async () => {
  await open();
  await press('photo-Barbell_Squat');
  expect(await screen.findByText('More of this')).toBeTruthy();
  expect(screen.getByText('Last 5')).toBeTruthy();
});

test('a loaded lift cannot be saved at 0 kg', async () => {
  await open();
  const fresh = cardIds().find(id => within(screen.getByTestId(`exercise-card-${id}`)).queryByText(/set weight/))!;
  await press(`dot-${fresh}-0`);
  await fireEvent.changeText(await screen.findByLabelText('Weight'), '0');
  expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
});

test('a loaded lift logged at 0 kg before still shows its weight field in Edit', async () => {
  await saveSession(db, day('2026-11-20', 'Leg_Press', sets(3, 0, 10), 10));
  await open();
  expect(cardIds()[0]).toBe('Leg_Press');
  await press('edit-Leg_Press');
  expect(await screen.findByLabelText('Weight')).toBeTruthy();
});

test('Edit before any set starts at 0 sets done, so saving does not mark the exercise completed', async () => {
  await open();
  await press('edit-Barbell_Squat');
  await fireEvent.changeText(await screen.findByLabelText('Reps'), '7');
  await fireEvent.press(screen.getByText('Save'));
  await flush();
  expect(await tonight('Barbell_Squat')).toEqual([]);
  expect(screen.queryByText(/^Completed ·/)).toBeNull();
});
