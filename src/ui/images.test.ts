import { EXERCISE_IMAGES } from './images';
import { LIBRARY } from './library';

test('every library exercise with two photos has both frames mapped, and nothing else is mapped', () => {
  const withImages = LIBRARY.filter(e => e.images.length >= 2).map(e => e.id).sort();
  expect(Object.keys(EXERCISE_IMAGES).sort()).toEqual(withImages);
  expect(withImages).toHaveLength(173);
  for (const id of withImages) expect(EXERCISE_IMAGES[id]).toHaveLength(2);
});
