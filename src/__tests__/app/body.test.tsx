import { fireEvent, render, screen } from '@testing-library/react-native';
import { GROUPS, type GroupId, type GroupStatus } from '../../builder';
import { BodyFigure } from '../../features/body/BodyFigure';
import { REGIONS } from '../../features/body/regions';

const status = Object.fromEntries(GROUPS.map(g => [g, { lastWorked: null, daysSince: null, recency: 'never', sets: 0, target: 6, behind: false }])) as Record<GroupId, GroupStatus>;

test('each visible segment is its own tap target, drawn above every enlarged margin', async () => {
  await render(<BodyFigure status={status} selected={null} onSelect={() => {}} />);
  // Tree order is paint order in SVG: later elements receive the tap.
  const front = screen.queryAllByTestId(/^(grow|hit)-front-/).map(n => n.props.testID as string);
  const lastGrow = Math.max(...front.map((id, i) => (id.startsWith('grow-') ? i : -1)));
  const firstHit = front.findIndex(id => id.startsWith('hit-'));
  expect(lastGrow).toBeGreaterThanOrEqual(0);
  expect(firstHit).toBeGreaterThan(lastGrow);
  expect(front.filter(id => id.startsWith('hit-'))).toHaveLength(REGIONS.filter(r => r.side === 'front').length);
});

test('tapping the visible front shoulder opens Shoulders', async () => {
  const onSelect = jest.fn();
  await render(<BodyFigure status={status} selected={null} onSelect={onSelect} />);
  await fireEvent.press(screen.getByTestId('hit-front-shoulders-0'));
  expect(onSelect).toHaveBeenCalledWith('shoulders');
});
