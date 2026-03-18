/**
 * Workspace Bridge — syncs the WASM VirtualFS with browser OPFS.
 *
 * The agent's workspace (files, identity, skills, notes) lives in WASM memory
 * as a VirtualFS tree. This bridge persists it to Origin Private File System (OPFS)
 * for durability across sessions, and provides export/import as ZIP.
 */

import { getDB, STORES } from './db-bridge';
import type { WasmWorkspaceInstance } from './wasm-loader';

const WORKSPACE_STORAGE_KEY = 'ezclaw_workspace';
const WORKSPACE_VERSION = 1;

/**
 * Save workspace state to IndexedDB.
 */
export async function saveWorkspace(workspace: WasmWorkspaceInstance): Promise<void> {
    const data = workspace.export();
    const payload = {
        version: WORKSPACE_VERSION,
        timestamp: new Date().toISOString(),
        data,
    };

    try {
        const db = await getDB();
        await db.put(STORES.WORKSPACE, payload, WORKSPACE_STORAGE_KEY);
    } catch (err) {
        console.error('[Workspace] Save failed:', err);
    }
}

/**
 * Load workspace state from IndexedDB.
 */
export async function loadWorkspace(workspace: WasmWorkspaceInstance): Promise<boolean> {
    try {
        const db = await getDB();
        const payload = await db.get(STORES.WORKSPACE, WORKSPACE_STORAGE_KEY);

        if (payload?.data) {
            workspace.import(payload.data);
            console.log(`[Workspace] Loaded (saved ${payload.timestamp})`);
            return true;
        }
    } catch (err) {
        console.warn('[Workspace] Load failed, starting fresh:', err);
    }
    return false;
}

/**
 * Export workspace as a downloadable JSON file.
 */
export function exportWorkspaceAsJSON(workspace: WasmWorkspaceInstance): void {
    const data = workspace.export();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ezclaw-workspace-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Import workspace from a JSON file.
 */
export async function importWorkspaceFromJSON(
    workspace: WasmWorkspaceInstance,
    file: File
): Promise<boolean> {
    try {
        const text = await file.text();
        workspace.import(text);
        await saveWorkspace(workspace);
        return true;
    } catch (err) {
        console.error('[Workspace] Import failed:', err);
        return false;
    }
}

/**
 * Auto-save workspace periodically (call from setInterval).
 */
export function startAutoSave(workspace: WasmWorkspaceInstance, intervalMs = 30000): number {
    return window.setInterval(async () => {
        const dirtyJson = workspace.take_dirty_paths();
        const dirty = JSON.parse(dirtyJson);
        if (dirty.length > 0) {
            await saveWorkspace(workspace);
            console.log(`[Workspace] Auto-saved (${dirty.length} changed paths)`);
        }
    }, intervalMs);
}

