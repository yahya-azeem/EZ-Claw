/**
 * Storage Bridge — IndexedDB persistence with optional encryption.
 *
 * Provides client-side storage for sessions, config, and API keys.
 * Uses the idb library for IndexedDB access and WASM crypto for
 * optional API key encryption (same chacha20poly1305 as ZeroClaw).
 */

import { openDB, type IDBPDatabase } from 'idb';
import { getWasm } from './wasm-loader';

const DB_NAME = 'ezclaw';
const DB_VERSION = 1;

// Store names
const SESSIONS_STORE = 'sessions';
const CONFIG_STORE = 'config';
const SECRETS_STORE = 'secrets';

export interface SessionData {
    id: string;
    title: string;
    messages: Array<{ role: string; content: string }>;
    createdAt: string;
    updatedAt: string;
    model: string;
    provider: string;
}

interface SecretsEntry {
    key: string;
    value: string; // hex-encoded if encrypted
    encrypted: boolean;
}

let db: IDBPDatabase | null = null;

/**
 * Initialize the IndexedDB database.
 */
export async function initStorage(): Promise<void> {
    db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(database) {
            // Sessions store
            if (!database.objectStoreNames.contains(SESSIONS_STORE)) {
                const sessionsStore = database.createObjectStore(SESSIONS_STORE, {
                    keyPath: 'id',
                });
                sessionsStore.createIndex('updatedAt', 'updatedAt');
            }

            // Config store (key-value)
            if (!database.objectStoreNames.contains(CONFIG_STORE)) {
                database.createObjectStore(CONFIG_STORE, { keyPath: 'key' });
            }

            // Secrets store (encrypted API keys)
            if (!database.objectStoreNames.contains(SECRETS_STORE)) {
                database.createObjectStore(SECRETS_STORE, { keyPath: 'key' });
            }
        },
    });
}

function getDb(): IDBPDatabase {
    if (!db) throw new Error('Storage not initialized. Call initStorage() first.');
    return db;
}

// ── Sessions ─────────────────────────────────────────────────────

export async function saveSession(session: SessionData): Promise<void> {
    session.updatedAt = new Date().toISOString();
    await getDb().put(SESSIONS_STORE, session);
}

export async function getSession(id: string): Promise<SessionData | undefined> {
    return getDb().get(SESSIONS_STORE, id);
}

export async function getAllSessions(): Promise<SessionData[]> {
    const sessions = await getDb().getAll(SESSIONS_STORE);
    // Sort by updatedAt descending
    return sessions.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export async function deleteSession(id: string): Promise<void> {
    await getDb().delete(SESSIONS_STORE, id);
}

// ── Config ───────────────────────────────────────────────────────

export async function saveConfig(key: string, value: string): Promise<void> {
    await getDb().put(CONFIG_STORE, { key, value });
}

export async function getConfig(key: string): Promise<string | undefined> {
    const entry = await getDb().get(CONFIG_STORE, key);
    return entry?.value;
}

export async function getAllConfig(): Promise<Record<string, string>> {
    const entries = await getDb().getAll(CONFIG_STORE);
    const config: Record<string, string> = {};
    for (const entry of entries) {
        config[entry.key] = entry.value;
    }
    return config;
}

// ── Secrets (encrypted API keys) ─────────────────────────────────

/**
 * Store an API key, optionally encrypted with a passphrase.
 * Uses WASM chacha20poly1305 (same as ZeroClaw's secrets encryption).
 */
export async function storeSecret(
    key: string,
    value: string,
    passphrase?: string
): Promise<void> {
    let stored: SecretsEntry;

    if (passphrase) {
        const wasm = getWasm();
        const encrypted = wasm.encrypt(value, passphrase);
        stored = { key, value: encrypted, encrypted: true };
    } else {
        stored = { key, value, encrypted: false };
    }

    await getDb().put(SECRETS_STORE, stored);
}

/**
 * Retrieve an API key, decrypting if necessary.
 */
export async function getSecret(
    key: string,
    passphrase?: string
): Promise<string | undefined> {
    const entry: SecretsEntry | undefined = await getDb().get(SECRETS_STORE, key);
    if (!entry) return undefined;

    if (entry.encrypted) {
        if (!passphrase) {
            throw new Error('Passphrase required to decrypt secret');
        }
        const wasm = getWasm();
        return wasm.decrypt(entry.value, passphrase);
    }

    return entry.value;
}

export async function deleteSecret(key: string): Promise<void> {
    await getDb().delete(SECRETS_STORE, key);
}

// ── Export/Import (session persistence) ──────────────────────────

/**
 * Export all sessions as a JSON string for backup.
 */
export async function exportAllData(): Promise<string> {
    const sessions = await getAllSessions();
    const config = await getAllConfig();

    return JSON.stringify(
        {
            version: 1,
            exportedAt: new Date().toISOString(),
            sessions,
            config,
        },
        null,
        2
    );
}

/**
 * Import sessions and config from a JSON backup.
 */
export async function importData(jsonStr: string): Promise<number> {
    const data = JSON.parse(jsonStr);

    let count = 0;
    if (data.sessions && Array.isArray(data.sessions)) {
        for (const session of data.sessions) {
            await saveSession(session);
            count++;
        }
    }

    if (data.config && typeof data.config === 'object') {
        for (const [key, value] of Object.entries(data.config)) {
            await saveConfig(key, value as string);
        }
    }

    return count;
}
