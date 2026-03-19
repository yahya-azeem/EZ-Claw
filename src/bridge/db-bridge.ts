/**
 * Unified Database Bridge v4.0
 * 
 * Centralized IndexedDB management for EZ-Claw using the 'idb' library.
 * This simplifies connection management and ensures atomic transactions
 * across all storage categories (Sessions, Config, Memories, Workspace).
 */

import { openDB, type IDBPDatabase } from 'idb';
import { STORAGE } from './constants';

const DB_NAME = STORAGE.DB_NAME;
const DB_VERSION = 1;

export const STORES = STORAGE.STORES;

let dbPromise: Promise<IDBPDatabase> | null = null;

/**
 * Initialize (or get) the unified database.
 */
export function getDB(): Promise<IDBPDatabase> {
    if (!dbPromise) {
        dbPromise = openDB(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Sessions
                if (!db.objectStoreNames.contains(STORES.SESSIONS)) {
                    const store = db.createObjectStore(STORES.SESSIONS, { keyPath: 'id' });
                    store.createIndex('updatedAt', 'updatedAt');
                }
                // Config
                if (!db.objectStoreNames.contains(STORES.CONFIG)) {
                    db.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
                }
                // Secrets
                if (!db.objectStoreNames.contains(STORES.SECRETS)) {
                    db.createObjectStore(STORES.SECRETS, { keyPath: 'key' });
                }
                // Memories
                if (!db.objectStoreNames.contains(STORES.MEMORIES)) {
                    db.createObjectStore(STORES.MEMORIES);
                }
                // Workspace
                if (!db.objectStoreNames.contains(STORES.WORKSPACE)) {
                    db.createObjectStore(STORES.WORKSPACE);
                }
            }
        });
    }
    return dbPromise;
}

/**
 * Generic helper for simple key-value stores.
 */
export async function dbGet(store: string, key: string): Promise<any> {
    const db = await getDB();
    return db.get(store, key);
}

export async function dbPut(store: string, value: any, key?: string): Promise<any> {
    const db = await getDB();
    return db.put(store, value, key);
}

export async function dbDelete(store: string, key: string): Promise<void> {
    const db = await getDB();
    return db.delete(store, key);
}

export async function dbGetAll(store: string): Promise<any[]> {
    const db = await getDB();
    return db.getAll(store);
}
