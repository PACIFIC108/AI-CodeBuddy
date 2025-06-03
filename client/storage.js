import { openDB } from 'idb';

const DB_NAME = 'leetcopilot-db';
const STORE_NAME = 'storage';

export async function getDB() {
  return await openDB(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
}

export async function saveUsername(username) {
  const db = await getDB();
  await db.put(STORE_NAME, username, 'username');
}

export async function saveTitle(title) {
  const db = await getDB();
  await db.put(STORE_NAME, title, 'title');
}

export async function getTitle() {
  const db = await getDB();
  const title = await db.get(STORE_NAME, 'title');
  return title;
}

export async function clearUsername(){
  const db = await getDB();
  await db.delete(STORE_NAME,'username');
}

export async function getUsername() {
  const db = await getDB();
  return await db.get(STORE_NAME, 'username');
}

export async function saveChatHistory(history,title) {
  const db = await getDB();
  await db.put(STORE_NAME, history, title);
}

export async function getChatHistory(title) {
  const db = await getDB();
  const chat = (await db.get(STORE_NAME, title)) || [];
  return chat;
}

export async function clearChatHistory(title) {
  const db = await getDB();
  await db.delete(STORE_NAME, title);
}
