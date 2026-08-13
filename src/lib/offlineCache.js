/**
 * Lightweight IndexedDB wrapper for offline data caching.
 * Stores entity snapshots keyed by a cache key string.
 */

const DB_NAME = 'otters-offline';
const DB_VERSION = 1;
const STORE = 'cache';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

export async function setCacheEntry(key, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put({ key, data, timestamp: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = (e) => reject(e.target.error);
  });
}

export async function getCacheEntry(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = (e) => resolve(e.target.result?.data ?? null);
    req.onerror = (e) => reject(e.target.error);
  });
}

/**
 * Fetch data with offline fallback.
 * - Tries the live fetcher first.
 * - On success, persists to IndexedDB.
 * - On network failure, returns the last cached value (or null).
 */
export async function fetchWithCache(key, fetcher) {
  try {
    const data = await fetcher();
    await setCacheEntry(key, data).catch(() => {});
    return { data, fromCache: false };
  } catch {
    const cached = await getCacheEntry(key).catch(() => null);
    return { data: cached, fromCache: true };
  }
}