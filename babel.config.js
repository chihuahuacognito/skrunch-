// babel-preset-expo ships inside the expo package; resolve it from there so its version always matches the SDK.
const presetExpo = require.resolve('babel-preset-expo', { paths: [require.resolve('expo/package.json')] });

module.exports = function (api) {
  const test = api.env('test');
  api.cache.using(() => test);
  // Under jest there is no UI thread: compiling callbacks to worklets makes Gesture Handler route them
  // through Reanimated, where fireGestureHandler cannot reach them. Tests run them as plain JS instead.
  return { presets: [[presetExpo, test ? { worklets: false, reanimated: false } : {}]] };
};
