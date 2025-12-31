import { DictionaryEntry } from '../types';

const DB_NAME = 'SlowBurnDB';
const ASSET_STORE = 'assets';
const DATA_STORE = 'userdata';
const DB_VERSION = 2; // Incremented version

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error("IndexedDB not supported"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(ASSET_STORE)) {
        db.createObjectStore(ASSET_STORE);
      }
      if (!db.objectStoreNames.contains(DATA_STORE)) {
        db.createObjectStore(DATA_STORE);
      }
    };
  });
};

export const saveAsset = async (key: string, value: string): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ASSET_STORE], 'readwrite');
      const store = transaction.objectStore(ASSET_STORE);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("IndexedDB save failed", e);
  }
};

export const getAsset = async (key: string): Promise<string | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ASSET_STORE], 'readonly');
      const store = transaction.objectStore(ASSET_STORE);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("IndexedDB load failed", e);
    return null;
  }
};

// --- Audio Caching ---

export const saveAudio = async (key: string, buffer: ArrayBuffer): Promise<void> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ASSET_STORE], 'readwrite');
      const store = transaction.objectStore(ASSET_STORE);
      // We store the raw ArrayBuffer
      const request = store.put(buffer, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("IndexedDB audio save failed", e);
  }
};

export const getAudio = async (key: string): Promise<ArrayBuffer | null> => {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ASSET_STORE], 'readonly');
      const store = transaction.objectStore(ASSET_STORE);
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (e) {
    console.warn("IndexedDB audio load failed", e);
    return null;
  }
};

// --- Progress & Dictionary ---

export const saveProgress = (sceneId: string) => {
    localStorage.setItem('sb_progress', sceneId);
};

export const getProgress = (): string | null => {
    return localStorage.getItem('sb_progress');
};

export const saveDictionaryWord = (entry: DictionaryEntry) => {
    const existing = getDictionary();
    if (!existing.find(e => e.spanish === entry.spanish)) {
        const updated = [entry, ...existing];
        localStorage.setItem('sb_dictionary', JSON.stringify(updated));
    }
};

export const getDictionary = (): DictionaryEntry[] => {
    try {
        const data = localStorage.getItem('sb_dictionary');
        return data ? JSON.parse(data) : [];
    } catch {
        return [];
    }
};