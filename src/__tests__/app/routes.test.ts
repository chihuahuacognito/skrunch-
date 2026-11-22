/// <reference types="node" />
import { readdirSync } from 'fs';
import { join } from 'path';

// Expo Router bundles every file under src/app as a route, so tests (which import node-only modules
// such as node:sqlite) must live outside it, or the phone build breaks.
test('the routes folder holds only screens', () => {
  const files = readdirSync(join(__dirname, '../../app'), { recursive: true }).map(String);
  expect(files.filter(f => /\.test\.|__tests__|test-utils/.test(f))).toEqual([]);
});
