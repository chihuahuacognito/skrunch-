import { initArc, reduceArc, type ArcConfig, type ArcEvent, type ArcInput } from './arcMachine';

const cfg: ArcConfig = { cancelX: 120, edge: 'right' }; // arc side is x >= 120
const at = (kind: ArcInput['kind']) => (x: number, y: number): ArcInput => ({ kind, x, y });
const [d, e, m, u] = [at('down'), at('engage'), at('move'), at('up')];

function run(inputs: ArcInput[], c: ArcConfig = cfg): ArcEvent {
  let s = initArc();
  let last: ArcEvent = null;
  for (const i of inputs) {
    const r = reduceArc(s, i, c);
    s = r.state;
    if (r.event) last = r.event;
  }
  return last;
}

test('a stationary tap cancels', () => expect(run([d(300, 200), u(300, 200)])).toEqual({ type: 'cancel' }));

test('engage then release on the arc side selects at the release y', () =>
  expect(run([d(300, 200), e(300, 200), m(310, 260), u(310, 260)])).toEqual({ type: 'select', y: 260 }));

test('release inboard of the cancel line cancels', () =>
  expect(run([d(300, 200), e(300, 200), m(60, 220), u(60, 220)])).toEqual({ type: 'cancel' }));

test('dragging out and back to the arc side before release still selects', () =>
  expect(run([d(300, 200), e(300, 200), m(60, 220), m(300, 240), u(300, 240)])).toEqual({ type: 'select', y: 240 }));

test('left edge mirrors the cancel side', () =>
  expect(run([d(20, 200), e(20, 200), u(30, 240)], { cancelX: 250, edge: 'left' })).toEqual({ type: 'select', y: 240 }));

test('move before engage is ignored', () => {
  const s = reduceArc(reduceArc(initArc(), d(300, 200), cfg).state, m(310, 260), cfg).state;
  expect(s).toEqual({ active: true, engaged: false, x: 300, y: 200 });
});

test('up without down does nothing', () =>
  expect(reduceArc(initArc(), u(300, 200), cfg)).toEqual({ state: initArc(), event: null }));

test('engage without down does nothing', () =>
  expect(reduceArc(initArc(), e(300, 200), cfg)).toEqual({ state: initArc(), event: null }));
