import { render, screen } from '@testing-library/react-native';
import Home from './index';

test('home renders', async () => {
  await render(<Home />);
  expect(screen.getByText('Workout')).toBeTruthy();
});
