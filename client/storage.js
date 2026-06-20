const DEFAULT_AI_SETTINGS = {
  provider: 'openrouter',
  apiKey: '',
  model: '',
  baseURL: '',
};

const read = async key => {
  const result = await chrome.storage.local.get(key);
  return result[key];
};

const write = async (key, value) => chrome.storage.local.set({ [key]: value });

export const saveUsername = username => write('username', username);
export const getUsername = () => read('username');
export const clearUsername = () => chrome.storage.local.remove('username');

export const saveTitle = title => write('title', title);
export const getTitle = () => read('title');

export const saveAiSettings = settings => write('ai-settings', { ...DEFAULT_AI_SETTINGS, ...settings });
export const getAiSettings = async () => ({ ...DEFAULT_AI_SETTINGS, ...((await read('ai-settings')) || {}) });
export const clearAiSettings = () => chrome.storage.local.remove('ai-settings');

const chatKey = title => `chat:${title}`;
export const saveChatHistory = (history, title) => write(chatKey(title), history);
export const getChatHistory = async title => (await read(chatKey(title))) || [];
export const clearChatHistory = title => chrome.storage.local.remove(chatKey(title));

export const migrateLegacyStorage = async () => {
  if ((await read('indexeddb-migration-complete')) === true) return;
  const legacyEntries = await new Promise(resolve => {
    const request = indexedDB.open('leetcopilot-db');
    request.onupgradeneeded = () => {
      request.transaction?.abort();
      resolve([]);
    };
    request.onerror = () => resolve([]);
    request.onsuccess = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('storage')) {
        db.close();
        return resolve([]);
      }
      const entries = [];
      const transaction = db.transaction('storage', 'readonly');
      const cursorRequest = transaction.objectStore('storage').openCursor();
      cursorRequest.onsuccess = event => {
        const cursor = event.target.result;
        if (!cursor) return;
        entries.push([cursor.key, cursor.value]);
        cursor.continue();
      };
      transaction.oncomplete = () => { db.close(); resolve(entries); };
      transaction.onerror = () => { db.close(); resolve([]); };
    };
  });

  const migrated = { 'indexeddb-migration-complete': true };
  for (const [key, value] of legacyEntries) {
    if (['username', 'title', 'ai-settings'].includes(key)) migrated[key] = value;
    else if (typeof key === 'string' && Array.isArray(value)) migrated[chatKey(key)] = value;
  }
  await chrome.storage.local.set(migrated);
};
