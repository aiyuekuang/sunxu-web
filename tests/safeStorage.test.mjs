import assert from 'node:assert/strict';
import { after, before, test } from 'node:test';
import { createServer } from 'vite';

const vite = await createServer({
  configFile: 'vite.config.ts',
  server: { middlewareMode: true },
  appType: 'custom',
});

const storageApi = await vite.ssrLoadModule('/src/mes/utils/safeStorage.ts');
const originalWindowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');

function setWindow(value) {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value,
  });
}

function restoreWindow() {
  if (originalWindowDescriptor) {
    Object.defineProperty(globalThis, 'window', originalWindowDescriptor);
  } else {
    Reflect.deleteProperty(globalThis, 'window');
  }
}

function createStorage(initialEntries = []) {
  const entries = new Map(initialEntries);
  return {
    entries,
    get length() {
      return entries.size;
    },
    key(index) {
      return [...entries.keys()][index] ?? null;
    },
    getItem(key) {
      return entries.get(String(key)) ?? null;
    },
    setItem(key, value) {
      entries.set(String(key), String(value));
    },
    removeItem(key) {
      entries.delete(String(key));
    },
  };
}

before(() => {
  restoreWindow();
});

after(async () => {
  restoreWindow();
  await vite.close();
});

test('reads return a default signal when browser storage is unavailable', () => {
  restoreWindow();
  assert.equal(storageApi.safeLocalStorageGetItem('missing'), null);
  assert.equal(storageApi.safeLocalStorageSetItem('key', 'value'), false);

  const deniedWindow = {};
  Object.defineProperty(deniedWindow, 'localStorage', {
    get() {
      throw new DOMException('Storage access denied', 'SecurityError');
    },
  });
  setWindow(deniedWindow);
  assert.equal(storageApi.safeLocalStorageGetItem('key'), null);
  assert.equal(storageApi.safeLocalStorageSetItem('key', 'value'), false);

  setWindow({
    localStorage: {
      getItem() {
        throw new DOMException('Storage access denied', 'SecurityError');
      },
      setItem() {
        throw new DOMException('Storage access denied', 'SecurityError');
      },
    },
  });
  const originalWarn = console.warn;
  console.warn = () => undefined;
  try {
    assert.equal(storageApi.safeLocalStorageGetItem('key'), null);
    assert.equal(storageApi.safeLocalStorageSetItem('key', 'value'), false);
  } finally {
    console.warn = originalWarn;
  }
});

test('writes retry after evicting only rebuildable table UI caches', () => {
  const storage = createStorage([
    ['mes-admin:table-width:old-page', '{"name":180}'],
    ['business:data', 'preserve'],
  ]);
  let writeAttempts = 0;
  const setItem = storage.setItem.bind(storage);
  storage.setItem = (key, value) => {
    writeAttempts += 1;
    if (writeAttempts === 1) {
      throw new DOMException('Storage is full', 'QuotaExceededError');
    }
    setItem(key, value);
  };
  setWindow({ localStorage: storage });

  assert.equal(
    storageApi.safeLocalStorageSetItem('mes-admin:table-sort:new-page', '{"field":"name"}'),
    true,
  );
  assert.equal(writeAttempts, 2);
  assert.equal(storage.entries.has('mes-admin:table-width:old-page'), false);
  assert.equal(storage.getItem('business:data'), 'preserve');
  assert.equal(
    storage.getItem('mes-admin:table-sort:new-page'),
    '{"field":"name"}',
  );
});
