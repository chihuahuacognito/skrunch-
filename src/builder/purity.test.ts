/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'fs';
import { join } from 'path';

function sources(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return name === 'test-utils' ? [] : sources(p);
    return /\.ts$/.test(name) && !/\.test\.ts$/.test(name) ? [p] : [];
  });
}
const files = [...sources(join(__dirname)), ...sources(join(__dirname, '..', 'library'))];
const offenders = (re: RegExp) => files.filter(f => re.test(readFileSync(f, 'utf8')));

test('there are sources to scan', () => expect(files.length).toBeGreaterThan(3));
test('builder and library never import React Native or Expo', () =>
  expect(offenders(/from ['"](react|react-native|expo[^'"]*)['"]/)).toEqual([]));
test('builder never reads the clock or randomness', () =>
  expect(offenders(/Date\.now\(|new Date\(\)|Math\.random\(/)).toEqual([]));
