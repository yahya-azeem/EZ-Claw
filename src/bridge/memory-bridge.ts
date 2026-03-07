/**
 * Memory Bridge — sql.js + WASM scoring integration.
 *
 * Uses WASM core for SQL generation (mirrors ZeroClaw's SQLite schema)
 * and scoring (TF-IDF, cosine similarity, hybrid merge). sql.js
 * provides in-browser SQLite execution.
 */

import type { Database } from 'sql.js';
import { getWasm } from './wasm-loader';

let sqlDb: Database | null = null;

/**
 * Initialize the memory system: load sql.js and create tables.
 */
export async function initMemory(): Promise<void> {
    try {
        const SQL = await initSqlJs({
            locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
        });

        sqlDb = new SQL.Database();

        const wasm = getWasm();
        const createSql = wasm.memory_create_table_sql();
        sqlDb.run(createSql);

        console.log('[EZ-Claw] Memory system initialized (sql.js + WASM scoring)');
    } catch (e) {
        console.warn('[EZ-Claw] Memory init failed (non-fatal):', e);
        sqlDb = null;
    }
}

/**
 * Lazy load sql.js - returns the initSqlJs factory function
 */
async function initSqlJs(config?: any): Promise<any> {
    const mod = await import('sql.js');
    if (mod.default) {
        return mod.default(config);
    }
    if (mod.initSqlJs) {
        return mod.initSqlJs(config);
    }
    throw new Error('sql.js initialization function not found');
}

/**
 * Load memory database from a saved Uint8Array (for session resume).
 */
export async function loadMemoryFromData(data: Uint8Array): Promise<void> {
    const SQL = await initSqlJs({
        locateFile: (file: string) => `https://sql.js.org/dist/${file}`,
    });

    sqlDb = new SQL.Database(data);
    console.log('[EZ-Claw] Memory loaded from saved data');
}

/**
 * Export memory database as a Uint8Array (for persistence).
 */
export function exportMemoryData(): Uint8Array | null {
    if (!sqlDb) return null;
    return sqlDb.export();
}

function getDb(): Database {
    if (!sqlDb) throw new Error('Memory not initialized. Call initMemory() first.');
    return sqlDb;
}

// ── Memory CRUD (using WASM SQL generation) ──────────────────────

export interface MemoryEntry {
    id: string;
    key: string;
    content: string;
    category: string;
    timestamp: string;
    session_id: string | null;
    score?: number;
}

/**
 * Store a memory entry (mirrors ZeroClaw's Memory::store).
 */
export function storeMemory(
    key: string,
    content: string,
    category: string = 'core',
    sessionId: string = ''
): void {
    const wasm = getWasm();
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // Use parameterized approach for safety
    const db = getDb();
    db.run(
        'INSERT OR REPLACE INTO memories (id, key, content, category, timestamp, session_id) VALUES (?, ?, ?, ?, ?, ?)',
        [id, key, content, category, timestamp, sessionId || null]
    );
}

/**
 * Recall memories matching a query (mirrors ZeroClaw's Memory::recall).
 * Uses WASM TF-IDF scoring for relevance ranking.
 */
export function recallMemories(
    query: string,
    limit: number = 5,
    sessionId: string = ''
): MemoryEntry[] {
    const wasm = getWasm();
    const db = getDb();

    // Get all memories for scoring
    let results: MemoryEntry[];

    if (sessionId) {
        const rows = db.exec(
            'SELECT id, key, content, category, timestamp, session_id FROM memories WHERE session_id = ? ORDER BY timestamp DESC',
            [sessionId]
        );
        results = rowsToEntries(rows);
    } else {
        const rows = db.exec(
            'SELECT id, key, content, category, timestamp, session_id FROM memories ORDER BY timestamp DESC'
        );
        results = rowsToEntries(rows);
    }

    if (!query.trim() || results.length === 0) {
        return results.slice(0, limit);
    }

    // Score each memory using WASM TF-IDF (same scoring approach as ZeroClaw)
    for (const entry of results) {
        entry.score = wasm.compute_tfidf_score(query, entry.content);
        // Also score against key for better recall
        const keyScore = wasm.compute_tfidf_score(query, entry.key);
        entry.score = Math.max(entry.score, keyScore);
    }

    // Sort by score descending
    results.sort((a, b) => (b.score || 0) - (a.score || 0));

    // Filter out zero-score results
    const scored = results.filter((r) => (r.score || 0) > 0);

    return scored.length > 0 ? scored.slice(0, limit) : results.slice(0, limit);
}

/**
 * Get a specific memory by key (mirrors ZeroClaw's Memory::get).
 */
export function getMemory(key: string): MemoryEntry | null {
    const db = getDb();
    const rows = db.exec(
        'SELECT id, key, content, category, timestamp, session_id FROM memories WHERE key = ? LIMIT 1',
        [key]
    );
    const entries = rowsToEntries(rows);
    return entries.length > 0 ? entries[0] : null;
}

/**
 * List memories, optionally filtered (mirrors ZeroClaw's Memory::list).
 */
export function listMemories(
    category: string = '',
    sessionId: string = ''
): MemoryEntry[] {
    const db = getDb();
    let sql = 'SELECT id, key, content, category, timestamp, session_id FROM memories';
    const conditions: string[] = [];
    const params: (string | null)[] = [];

    if (category) {
        conditions.push('category = ?');
        params.push(category);
    }
    if (sessionId) {
        conditions.push('session_id = ?');
        params.push(sessionId);
    }

    if (conditions.length > 0) {
        sql += ' WHERE ' + conditions.join(' AND ');
    }
    sql += ' ORDER BY timestamp DESC';

    const rows = db.exec(sql, params);
    return rowsToEntries(rows);
}

/**
 * Remove a memory by key (mirrors ZeroClaw's Memory::forget).
 */
export function forgetMemory(key: string): boolean {
    const db = getDb();
    db.run('DELETE FROM memories WHERE key = ?', [key]);
    return db.getRowsModified() > 0;
}

/**
 * Count total memories (mirrors ZeroClaw's Memory::count).
 */
export function countMemories(): number {
    const db = getDb();
    const rows = db.exec('SELECT COUNT(*) FROM memories');
    if (rows.length > 0 && rows[0].values.length > 0) {
        return Number(rows[0].values[0][0]);
    }
    return 0;
}

// ── Hybrid search (using WASM vector ops) ────────────────────────

/**
 * Perform hybrid search combining keyword and optional vector results.
 * Uses WASM hybrid_merge from ZeroClaw's memory/vector.rs.
 */
export function hybridSearch(
    query: string,
    vectorResults: [string, number][],
    limit: number = 5,
    vectorWeight: number = 0.7,
    keywordWeight: number = 0.3
): Array<{ id: string; score: number }> {
    const wasm = getWasm();

    // Get keyword results from SQL
    const memories = recallMemories(query, limit * 3);
    const keywordResults: [string, number][] = memories
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

// ── Helpers ──────────────────────────────────────────────────────

function rowsToEntries(
    rows: Array<{ columns: string[]; values: any[][] }>
): MemoryEntry[] {
    if (rows.length === 0) return [];

    const cols = rows[0].columns;
    return rows[0].values.map((row) => {
        const entry: any = {};
        for (let i = 0; i < cols.length; i++) {
            entry[cols[i]] = row[i];
        }
        return entry as MemoryEntry;
    });
}
