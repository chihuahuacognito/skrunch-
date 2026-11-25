import * as builder from './index';

test('the public API exposes the kept builder functions', () => {
  for (const name of ['blockState', 'buildDeskReset', 'lastLog', 'weeklyVolume', 'groupStatus', 'pickGroup', 'targetFor'] as const)
    expect(typeof builder[name]).toBe('function');
});
