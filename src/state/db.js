// src/state/db.js
const DB_NAME = 'eo-fse-images';
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('images')) {
        db.createObjectStore('images', { keyPath: 'id' });
      }
    };
  });
}

export async function storeImage(id, file) {
  const db = await openDB();
  const tx = db.transaction('images', 'readwrite');
  const store = tx.objectStore('images');
  const arrayBuffer = await file.arrayBuffer();
  await new Promise((resolve, reject) => {
    const req = store.put({ id, blob: arrayBuffer, type: file.type });
    req.onsuccess = resolve;
    req.onerror = () => reject(req.error);
  });
  return URL.createObjectURL(file);
}

export async function loadImage(id) {
  try {
    const db = await openDB();
    const tx = db.transaction('images', 'readonly');
    const store = tx.objectStore('images');
    const result = await new Promise((resolve, reject) => {
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    if (result && result.blob) {
      const blob = new Blob([result.blob], { type: result.type || 'image/png' });
      return URL.createObjectURL(blob);
    }
  } catch (e) { /* ignore */ }
  return null;
}

export async function deleteImage(id) {
  try {
    const db = await openDB();
    const tx = db.transaction('images', 'readwrite');
    const store = tx.objectStore('images');
    await new Promise((resolve, reject) => {
      const req = store.delete(id);
      req.onsuccess = resolve;
      req.onerror = () => reject(req.error);
    });
  } catch (e) { /* ignore */ }
}

export async function dbPut(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export async function dbGet(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}
