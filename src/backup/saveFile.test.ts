import { Directory } from 'expo-file-system';
import { migrate } from '../store/schema';
import { getSetting, setSetting } from '../store/settings';
import type { SqlDb } from '../store/sql';
import { nodeDb } from '../store/test-utils/nodeDb';
import { saveToFolder } from './saveFile';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const fake = (require('expo-file-system') as { __fake: { PICKED: string; folders: Map<string, Map<string, string>>; cancelled(): Error; reset(): void } }).__fake;
const pick = Directory.pickDirectoryAsync as jest.Mock;

let db: SqlDb;
beforeEach(async () => {
  fake.reset();
  db = nodeDb();
  await migrate(db);
});

test('the first export asks for a folder and remembers it', async () => {
  expect(await saveToFolder(db, 'a.json', '{"a":1}')).toBe('saved');
  expect(pick).toHaveBeenCalledTimes(1);
  expect(await getSetting(db, 'backup_dir')).toBe(fake.PICKED);
  expect(fake.folders.get(fake.PICKED)!.get('a.json')).toBe('{"a":1}');
  expect(await saveToFolder(db, 'b.json', '{}')).toBe('saved');
  expect(pick).toHaveBeenCalledTimes(1);
});

test('the picker opens at Downloads', async () => {
  await saveToFolder(db, 'a.json', '{}');
  expect(pick.mock.calls[0][0]).toMatch(/Download/);
});

test('saving the same name again replaces the file', async () => {
  await saveToFolder(db, 'a.json', 'one');
  await saveToFolder(db, 'a.json', 'two');
  expect([...fake.folders.get(fake.PICKED)!.entries()]).toEqual([['a.json', 'two']]);
});

test('a dismissed picker cancels quietly', async () => {
  pick.mockRejectedValueOnce(fake.cancelled());
  expect(await saveToFolder(db, 'a.json', '{}')).toBe('cancelled');
  expect(await getSetting(db, 'backup_dir')).toBeNull();
});

test('a revoked folder is asked for again once', async () => {
  await setSetting(db, 'backup_dir', 'content://gone');
  expect(await saveToFolder(db, 'a.json', '{}')).toBe('saved');
  expect(pick).toHaveBeenCalledTimes(1);
  expect(await getSetting(db, 'backup_dir')).toBe(fake.PICKED);
});

test('a revoked folder and a dismissed picker forget the old folder', async () => {
  await setSetting(db, 'backup_dir', 'content://gone');
  pick.mockRejectedValueOnce(fake.cancelled());
  expect(await saveToFolder(db, 'a.json', '{}')).toBe('cancelled');
  expect(await getSetting(db, 'backup_dir')).toBeNull();
});

test('other picker errors are raised', async () => {
  pick.mockRejectedValueOnce(new Error('boom'));
  await expect(saveToFolder(db, 'a.json', '{}')).rejects.toThrow('boom');
});
