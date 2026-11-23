import { Directory } from 'expo-file-system';
import { deleteSetting, getSetting, setSetting } from '../store/settings';
import type { SqlDb } from '../store/sql';

const FOLDER_KEY = 'backup_dir';
/** Android's folder picker opens here: the shared Downloads folder. */
const DOWNLOADS = 'content://com.android.externalstorage.documents/document/primary%3ADownload';
const PICKER_CANCELLED = 'ERR_PICKER_CANCELLED';

async function pickFolder(db: SqlDb): Promise<Directory | null> {
  try {
    const dir = await Directory.pickDirectoryAsync(DOWNLOADS);
    await setSetting(db, FOLDER_KEY, dir.uri);
    return dir;
  } catch (e) {
    if ((e as { code?: string }).code === PICKER_CANCELLED) return null;
    throw e;
  }
}

/** Writes the file, replacing one of the same name (the folder would otherwise add " (1)"). */
async function writeIn(dir: Directory, name: string, text: string): Promise<void> {
  dir.list().find(x => x.name === name)?.delete();
  await dir.createFile(name, 'application/json').write(text);
}

/**
 * Saves a file to the backup folder. The first time it asks for a folder (opening at Downloads) and remembers it, so
 * later exports are one tap. If the remembered folder can no longer be written, it forgets it and asks once more.
 */
export async function saveToFolder(db: SqlDb, name: string, text: string): Promise<'saved' | 'cancelled'> {
  const remembered = await getSetting(db, FOLDER_KEY);
  if (remembered) {
    try {
      await writeIn(new Directory(remembered), name, text);
      return 'saved';
    } catch {
      await deleteSetting(db, FOLDER_KEY);
    }
  }
  const dir = await pickFolder(db);
  if (!dir) return 'cancelled';
  await writeIn(dir, name, text);
  return 'saved';
}
