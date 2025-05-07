export const DB_NAME = 'AppCache';
export const DB_VERSION = 1;
export const STORE_NAME = 'tasks';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'uuid' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function readTask(uuid) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(uuid);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function writeTask(record) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function readAllTasks() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Clear all records from the 'tasks' store in AppCache, preserving the DB/schema.
 */
export async function clearDB() {
  const db = await openDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);

  // 1. Grab all keys
  const keysRequest = store.getAllKeys();

  return new Promise((resolve, reject) => {
    keysRequest.onsuccess = () => {
      const keys = keysRequest.result;
      if (keys.length === 0) {
        console.log(`No records to delete in "${STORE_NAME}".`);
      } else {
        // 2. Delete each record by key
        for (const key of keys) {
          store.delete(key);
        }
      }

      // 3. Wait for the transaction to finish
      tx.oncomplete = () => {
        console.log(`✅ Deleted ${keys.length} record(s) from "${STORE_NAME}"`);
        db.close();
        resolve();
      };
      tx.onerror = () => {
        console.error(`❌ Transaction error while deleting records:`, tx.error);
        db.close();
        reject(tx.error);
      };
      tx.onabort = () => {
        console.warn(`⚠️ Transaction aborted while deleting records`);
        db.close();
        reject(tx.error);
      };
    };

    keysRequest.onerror = () => {
      console.error(`❌ Failed to retrieve keys from "${STORE_NAME}":`, keysRequest.error);
      db.close();
      reject(keysRequest.error);
    };
  });
}