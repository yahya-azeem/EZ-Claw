/**
 * Workspace Layer — persistent workspace management.
 *
 * This layer is NEVER hot-swapped. It persists across persona
 * and skills changes. It wraps the browser's Origin Private File
 * System (OPFS) or a user-picked directory handle to provide
 * a consistent workspace that can be mounted into the WASI
 * container (container2wasm).
 *
 * Layer hierarchy:
 *   1. Persona Layer         — hot-swappable
 *   2. Skills Layer          — hot-swappable
 *   3. Workspace Layer (this) — persistent across swaps
 */

// ── Types ────────────────────────────────────────────────────────

export interface WorkspaceFile {
    name: string;
    path: string;
    isDirectory: boolean;
    size?: number;
    lastModified?: number;
}

export type WorkspaceEvent =
    | 'workspace:mounted'
    | 'workspace:unmounted'
    | 'workspace:file-changed';

type Listener = (data?: any) => void;

// ── State ────────────────────────────────────────────────────────

let workspaceHandle: FileSystemDirectoryHandle | null = null;
let opfsRoot: FileSystemDirectoryHandle | null = null;
const eventListeners = new Map<WorkspaceEvent, Set<Listener>>();

function emit(event: WorkspaceEvent, data?: any): void {
    eventListeners.get(event)?.forEach((fn) => fn(data));
}

export function onWorkspaceEvent(event: WorkspaceEvent, fn: Listener): () => void {
    if (!eventListeners.has(event)) eventListeners.set(event, new Set());
    eventListeners.get(event)!.add(fn);
    return () => eventListeners.get(event)?.delete(fn);
}

// ── Initialization ───────────────────────────────────────────────

/**
 * Initialize the workspace layer.
 * Uses OPFS as the default workspace if no directory handle is provided.
 */
export async function initWorkspace(handle?: FileSystemDirectoryHandle): Promise<void> {
    if (handle) {
        workspaceHandle = handle;
    } else {
        // Use OPFS as default workspace
        try {
            opfsRoot = await navigator.storage.getDirectory();
            // Create a "workspace" subdirectory in OPFS
            workspaceHandle = await opfsRoot.getDirectoryHandle('workspace', { create: true });
        } catch (e) {
            console.warn('[EZ-Claw] OPFS not available, workspace will be in-memory only:', e);
            workspaceHandle = null;
        }
    }

    if (workspaceHandle) {
        emit('workspace:mounted', { type: handle ? 'user-picked' : 'opfs' });
        console.log('[EZ-Claw] Workspace mounted:', handle ? 'user-picked directory' : 'OPFS');
    }
}

/**
 * Mount a user-selected directory as the workspace.
 * This is used when the user picks a directory via the File System Access API.
 */
export async function mountDirectory(handle: FileSystemDirectoryHandle): Promise<void> {
    workspaceHandle = handle;
    emit('workspace:mounted', { type: 'user-picked', name: handle.name });
}

/**
 * Get the current workspace directory handle.
 * This is passed to the WASI container for VFS mounting.
 */
export function getWorkspaceHandle(): FileSystemDirectoryHandle | null {
    return workspaceHandle;
}

/**
 * Check if a workspace is mounted.
 */
export function isWorkspaceMounted(): boolean {
    return workspaceHandle !== null;
}

// ── File Operations ──────────────────────────────────────────────

/**
 * List files in a directory within the workspace.
 */
export async function listFiles(path: string = '/'): Promise<WorkspaceFile[]> {
    const dir = await resolveDirectory(path);
    if (!dir) return [];

    const files: WorkspaceFile[] = [];
    for await (const [name, handle] of (dir as any).entries()) {
        const entry: WorkspaceFile = {
            name,
            path: path === '/' ? `/${name}` : `${path}/${name}`,
            isDirectory: handle.kind === 'directory',
        };

        if (handle.kind === 'file') {
            try {
                const file = await (handle as FileSystemFileHandle).getFile();
                entry.size = file.size;
                entry.lastModified = file.lastModified;
            } catch { /* permission denied */ }
        }

        files.push(entry);
    }

    return files.sort((a, b) => {
        if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
        return a.name.localeCompare(b.name);
    });
}

/**
 * Read a file from the workspace.
 */
export async function readFile(path: string): Promise<string> {
    const handle = await resolveFile(path);
    if (!handle) throw new Error(`File not found: ${path}`);
    const file = await handle.getFile();
    return file.text();
}

/**
 * Read a file as ArrayBuffer (for binary files).
 */
export async function readFileBinary(path: string): Promise<ArrayBuffer> {
    const handle = await resolveFile(path);
    if (!handle) throw new Error(`File not found: ${path}`);
    const file = await handle.getFile();
    return file.arrayBuffer();
}

/**
 * Write a file to the workspace.
 */
export async function writeFile(path: string, content: string | ArrayBuffer): Promise<void> {
    const parts = path.split('/').filter(Boolean);
    const fileName = parts.pop()!;
    const dirPath = '/' + parts.join('/');

    // Ensure parent directory exists
    const dir = await resolveDirectory(dirPath, true);
    if (!dir) throw new Error(`Cannot create directory: ${dirPath}`);

    const fileHandle = await dir.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();

    emit('workspace:file-changed', { path, action: 'write' });
}

/**
 * Create a directory in the workspace.
 */
export async function mkdir(path: string): Promise<void> {
    await resolveDirectory(path, true);
}

/**
 * Delete a file or directory from the workspace.
 */
export async function deleteEntry(path: string): Promise<void> {
    const parts = path.split('/').filter(Boolean);
    const name = parts.pop()!;
    const parentPath = '/' + parts.join('/');

    const parent = await resolveDirectory(parentPath);
    if (!parent) throw new Error(`Parent directory not found: ${parentPath}`);

    await parent.removeEntry(name, { recursive: true });
    emit('workspace:file-changed', { path, action: 'delete' });
}

/**
 * Check if a file/directory exists.
 */
export async function exists(path: string): Promise<boolean> {
    try {
        const parts = path.split('/').filter(Boolean);
        const name = parts.pop()!;
        const parentPath = '/' + parts.join('/');

        const parent = await resolveDirectory(parentPath);
        if (!parent) return false;

        try {
            await parent.getFileHandle(name);
            return true;
        } catch {
            try {
                await parent.getDirectoryHandle(name);
                return true;
            } catch {
                return false;
            }
        }
    } catch {
        return false;
    }
}

// ── Directory Picker ─────────────────────────────────────────────

/**
 * Show a directory picker dialog and mount the selected directory.
 * Uses the File System Access API (Chrome/Edge).
 */
export async function pickDirectory(): Promise<FileSystemDirectoryHandle | null> {
    try {
        const handle = await (window as any).showDirectoryPicker({
            mode: 'readwrite',
        });
        await mountDirectory(handle);
        return handle;
    } catch (e) {
        // User cancelled or API not supported
        return null;
    }
}

// ── Helpers ──────────────────────────────────────────────────────

async function resolveDirectory(
    path: string,
    create: boolean = false
): Promise<FileSystemDirectoryHandle | null> {
    if (!workspaceHandle) return null;

    const parts = path.split('/').filter(Boolean);
    let current = workspaceHandle;

    for (const part of parts) {
        try {
            current = await current.getDirectoryHandle(part, { create });
        } catch {
            return null;
        }
    }

    return current;
}

async function resolveFile(path: string): Promise<FileSystemFileHandle | null> {
    const parts = path.split('/').filter(Boolean);
    const fileName = parts.pop();
    if (!fileName) return null;

    const dir = await resolveDirectory('/' + parts.join('/'));
    if (!dir) return null;

    try {
        return await dir.getFileHandle(fileName);
    } catch {
        return null;
    }
}
