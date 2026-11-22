import { act, fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { GestureHandlerRootView, State } from 'react-native-gesture-handler';
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { layoutCenters } from './geometry';
import { ThumbArc, type ArcItem } from './ThumbArc';

jest.mock('../../haptics', () => ({ tick: jest.fn(), impact: jest.fn() }));

const items: ArcItem[] = [
  { id: 'a', label: 'Alpha', hint: 'first', accent: '#f00' },
  { id: 'b', label: 'Beta', accent: '#0f0' },
  { id: 'c', label: 'Gamma', accent: '#00f' },
];
const [c0, , c2] = layoutCenters(3, 800 * 0.2, 800 * 0.8);

async function setup() {
  const onSelect = jest.fn();
  await render(
    <GestureHandlerRootView>
      <ThumbArc items={items} onSelect={onSelect} header={<Text>Header here</Text>} />
    </GestureHandlerRootView>,
  );
  await fireEvent(screen.getByTestId('thumb-arc'), 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: 400, height: 800 } } });
  return onSelect;
}

const sweep = (endX: number) =>
  act(async () => fireGestureHandler(getByGestureTestId('thumb-arc-pan'), [
    { state: State.BEGAN, x: 380, y: c0 },
    { state: State.ACTIVE, x: 380, y: c0 },
    { state: State.ACTIVE, x: 380, y: c2 },
    { state: State.END, x: endX, y: c2 },
  ]));

test('renders one labelled button per item', async () => {
  await setup();
  for (const l of ['Alpha', 'Beta', 'Gamma']) expect(screen.getByLabelText(l)).toBeTruthy();
});

test('tapping an item selects it', async () => {
  const onSelect = await setup();
  await fireEvent.press(screen.getByLabelText('Beta'));
  expect(onSelect).toHaveBeenCalledWith('b');
});

test('a sweep selects exactly once', async () => {
  const onSelect = await setup();
  await sweep(380);
  expect(onSelect).toHaveBeenCalledTimes(1);
  expect(onSelect).toHaveBeenCalledWith('c');
});

test('a sweep released inboard selects nothing', async () => {
  const onSelect = await setup();
  await sweep(40);
  expect(onSelect).not.toHaveBeenCalled();
});

test('renders the header', async () => {
  await setup();
  expect(screen.getByText('Header here')).toBeTruthy();
});
