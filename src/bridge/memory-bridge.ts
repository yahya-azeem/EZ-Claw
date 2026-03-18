/**
 * Memory Bridge v2.7 — Robust JSON + IndexedDB persistence.
 *
 * REPLACED sql.js with a stable, native JavaScript array store to avoid
 * WASM/CORS initialization hangs in cross-origin isolated environments.
 *
 * Uses Rust WASM for high-performance scoring (TF-IDF) while keeping
 * the storage layer 100% stable and same-origin.
 */

import { getWasm } from './wasm-loader';

export interface MemoryEntry {
    id: string;
    key: string;
    content: string;
    category: string;
    timestamp: string;
    session_id: string | null;
    score?: number;
}

let memories: MemoryEntry[] = [];

// ── IndexedDB Persistence ─────────────────────────────────────────

const IDB_DB_NAME = 'ezclaw-memory-v2';
const IDB_STORE_NAME = 'memories';
const IDB_KEY = 'all_memories';

function openIDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(IDB_DB_NAME, 1);
        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
                db.createObjectStore(IDB_STORE_NAME);
            }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}

async function loadFromIDB(): Promise<MemoryEntry[]> {
    try {
        const db = await openIDB();
        const data = await new Promise<MemoryEntry[] | null>((resolve, reject) => {
            const tx = db.transaction(IDB_STORE_NAME, 'readonly');
            const store = tx.objectStore(IDB_STORE_NAME);
            const req = store.get(IDB_KEY);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
        db.close();
        return data || [];
    } catch (e) {
        console.warn('[EZ-Claw] Memory load from IndexedDB failed:', e);
        return [];
    }
}

async function saveToIDB(): Promise<void> {
    try {
        const db = await openIDB();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
            const store = tx.objectStore(IDB_STORE_NAME);
            const req = store.put(memories, IDB_KEY);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        });
        db.close();
    } catch (e) {
        console.warn('[EZ-Claw] Memory save to IndexedDB failed:', e);
    }
}

/**
 * Initialize the memory system: load from IndexedDB.
 * Completely replaces sql.js with a robust JSON array.
 */
export async function initMemory(): Promise<void> {
    memories = await loadFromIDB();
    console.log(`[EZ-Claw] Memory system initialized with ${memories.length} entries (JSON-mode)`);
}

/**
 * Load memory database from a saved Uint8Array (Legacy/Sync).
 * For v2.7+, this converts JSON data.
 */
export async function loadMemoryFromData(data: Uint8Array): Promise<void> {
    try {
        const decoder = new TextDecoder();
        const json = decoder.decode(data);
        const imported = JSON.parse(json);
        if (Array.isArray(imported)) {
            memories = imported;
            await saveToIDB();
            console.log('[EZ-Claw] Memory loaded from JSON data');
        }
    } catch (e) {
        console.warn('[EZ-Claw] Failed to load memory from data:', e);
    }
}

/**
 * Export memory database as a Uint8Array.
 */
export function exportMemoryData(): Uint8Array | null {
    const json = JSON.stringify(memories);
    return new TextEncoder().encode(json);
}

// ── Memory CRUD ──────────────────────────────────────────────────

/**
 * Store a memory entry.
 */
export function storeMemory(
    key: string,
    content: string,
    category: string = 'core',
    sessionId: string = ''
): void {
    const entry: MemoryEntry = {
        id: crypto.randomUUID(),
        key,
        content,
        category,
        timestamp: new Date().toISOString(),
        session_id: sessionId || null
    };

    memories.push(entry);
    saveToIDB();
}

/**
 * Recall memories matching a query.
 * Uses stable Rust WASM TF-IDF scoring for relevance ranking.
 */
export function recallMemories(
    query: string,
    limit: number = 5,
    sessionId: string = ''
): MemoryEntry[] {
    const wasm = getWasm();
    
    // Filter by session if requested
    let results = sessionId 
        ? memories.filter(m => m.session_id === sessionId)
        : [...memories];

    if (!query.trim() || results.length === 0) {
        return results.slice(0, limit);
    }

    // Score each memory using stable Rust WASM
    for (const entry of results) {
        const contentScore = wasm.compute_tfidf_score(query, entry.content);
        const keyScore = wasm.compute_tfidf_score(query, entry.key);
        entry.score = Math.max(contentScore, keyScore);
    }

    // Sort by score descending
    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Filter out zero-score results
    const scored = results.filter((r) => (r.score || 0) > 0);

    return scored.length > 0 ? scored.slice(0, limit) : results.slice(0, limit);
}

/**
 * Get a specific memory by key.
 */
export function getMemory(key: string): MemoryEntry | null {
    return memories.find(m => m.key === key) || null;
}

/**
 * List memories, optionally filtered.
 */
export function listMemories(
    category: string = '',
    sessionId: string = ''
): MemoryEntry[] {
    return memories.filter(m => {
        const catMatch = !category || m.category === category;
        const sessionMatch = !sessionId || m.session_id === sessionId;
        return catMatch && sessionMatch;
    }).sort((a, b) => b.timestamp.localeCompare(a.timestamp));
}

/**
 * Remove a memory by key.
 */
export function forgetMemory(key: string): boolean {
    const initialLen = memories.length;
    memories = memories.filter(m => m.key !== key);
    const deleted = memories.length < initialLen;
    if (deleted) saveToIDB();
    return deleted;
}

/**
 * Count total memories.
 */
export function countMemories(): number {
    return memories.length;
}

// ── Hybrid search (using WASM vector ops) ────────────────────────

export function hybridSearch(
    query: string,
    vectorResults: [string, number][],
    limit: number = 5,
    vectorWeight: number = 0.7,
    keywordWeight: number = 0.3
): Array<{ id: string; score: number }> {
    const wasm = getWasm();

    const mems = recallMemories(query, limit * 3);
    const keywordResults: [string, number][] = mems
        .filter((m) => (m.score || 0) > 0)
        .map((m) => [m.id, m.score || 0]);

    const mergedJson = wasm.wasm_hybrid_merge(
        JSON.stringify(vectorResults),
        JSON.stringify(keywordResults),
        vectorWeight,
        keywordWeight,
        limit
    );

    return JSON.parse(mergedJson);
}
