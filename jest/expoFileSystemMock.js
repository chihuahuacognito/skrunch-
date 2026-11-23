// An in-memory stand-in for expo-file-system's Directory / File API (the parts the backup uses).
// Folders the app may write to live in `folders` (uri -> Map(name -> content)); any other uri behaves like a folder
// whose access was revoked. Tests drive it through __fake.
const folders = new Map();
const PICKED = 'content://picked';

class File {
  constructor(dirUri, name) {
    this.dirUri = dirUri;
    this.name = name;
  }
  async write(content) {
    const f = folders.get(this.dirUri);
    if (!f) throw new Error('no access');
    f.set(this.name, content);
  }
  delete() {
    folders.get(this.dirUri)?.delete(this.name);
  }
}

class Directory {
  constructor(uri) {
    this.uri = uri;
  }
  list() {
    const f = folders.get(this.uri);
    if (!f) throw new Error('no access');
    return [...f.keys()].map(n => new File(this.uri, n));
  }
  createFile(name) {
    const f = folders.get(this.uri);
    if (!f) throw new Error('no access');
    if (f.has(name)) throw new Error('exists');
    f.set(name, '');
    return new File(this.uri, name);
  }
}

Directory.pickDirectoryAsync = jest.fn(async () => {
  if (!folders.has(PICKED)) folders.set(PICKED, new Map());
  return new Directory(PICKED);
});

const cancelled = () => Object.assign(new Error('The file picker was cancelled by the user'), { code: 'ERR_PICKER_CANCELLED' });

module.exports = {
  Directory,
  File,
  __fake: {
    PICKED,
    folders,
    cancelled,
    reset() {
      folders.clear();
      Directory.pickDirectoryAsync.mockClear();
    },
  },
};
