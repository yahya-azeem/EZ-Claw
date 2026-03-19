/**
 * Storage Bridge — IndexedDB persistence with optional encryption.
 *
 * Provides client-side storage for sessions, config, and API keys.
 * Uses the idb library for IndexedDB access and WASM crypto for
 * optional API key encryption (same chacha20poly1305 as ZeroClaw).
 */

import { getDB, STORES } from './db-bridge';
import { getWasm } from './wasm-loader';
import { STORAGE } from './constants';

export interface SessionData {
    id: string;
    title: string;
    /** User-chosen display name for this Claw agent */
    clawName: string;
    /** Per-claw avatar emoji */
    emoji: string;
    /** Bound persona layer ID */
    personaId: string | null;
    /** Bound skill set ID */
    skillSetId: string | null;
    /** Agent status: running | frozen | killed */
    status: 'running' | 'frozen' | 'killed';
    messages: Array<{ role: string; content: string }>;
    createdAt: string;
    updatedAt: string;
    model: string;
    provider: string;
    temperature?: number;
    apiUrl?: string;
}

interface SecretsEntry {
    key: string;
    value: string; // hex-encoded if encrypted
    encrypted: boolean;
}

/**
 * Initialize the storage system.
 */
export async function initStorage(): Promise<void> {
    await getDB();
}

// ── Sessions ─────────────────────────────────────────────────────

export async function saveSession(session: SessionData): Promise<void> {
    if (!session.id) {
        console.warn('[Storage Bridge] Attempted to save session without ID. Generating one.');
        session.id = crypto.randomUUID();
    }
    session.updatedAt = new Date().toISOString();
    const db = await getDB();
    await db.put(STORES.SESSIONS, session);
}

export async function getSession(id: string): Promise<SessionData | undefined> {
    const db = await getDB();
    return db.get(STORES.SESSIONS, id);
}

export async function getAllSessions(): Promise<SessionData[]> {
    const db = await getDB();
    const sessions = await db.getAll(STORES.SESSIONS);
    // Sort by updatedAt descending
    return sessions.sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
}

export async function deleteSession(id: string): Promise<void> {
    const db = await getDB();
    await db.delete(STORES.SESSIONS, id);
}

export async function clearAllSessions(): Promise<void> {
    const db = await getDB();
    await db.clear(STORES.SESSIONS);
}

// ── Config ───────────────────────────────────────────────────────

export async function saveConfig(key: string, value: string): Promise<void> {
    const db = await getDB();
    await db.put(STORES.CONFIG, { key, value });
}

export async function getConfig(key: string): Promise<string | undefined> {
    const db = await getDB();
    const entry = await db.get(STORES.CONFIG, key);
    return entry?.value;
}

export async function getAllConfig(): Promise<Record<string, string>> {
    const db = await getDB();
    const entries = await db.getAll(STORES.CONFIG);
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

    const db = await getDB();
    await db.put(STORES.SECRETS, stored);
}

export async function getSecret(
    key: string,
    passphrase?: string
): Promise<string | undefined> {
    const db = await getDB();
    const entry: SecretsEntry | undefined = await db.get(STORES.SECRETS, key);
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
    const db = await getDB();
    await db.delete(STORES.SECRETS, key);
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
