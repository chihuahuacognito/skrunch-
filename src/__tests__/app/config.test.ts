/// <reference types="node" />
import { readFileSync } from 'fs';
import { join } from 'path';

const app = JSON.parse(readFileSync(join(__dirname, '../../../app.json'), 'utf8')) as { expo: { android: Record<string, unknown> } };

test('Android Auto Backup is on, so the database survives a reinstall or a new phone', () => {
  expect(app.expo.android.allowBackup).toBe(true);
});
