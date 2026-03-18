/**
 * Claw Orchestrator v7.0 — Background Proxy Edition
 *
 * Each Claw is a named AI agent. This orchestrator now acts as a 
 * proxy for the 'claw-worker.ts' SharedWorker, which handles the 
 * actual WASM execution in the background.
 */

import {
    swapPersona,
    getActivePersonaId,
} from '../layers/persona-layer';
import {
    swapSkillSet,
    getActiveSkillSetId,
    listSkillSets,
    deleteSkillSet,
} from '../layers/skills-layer';
import { listPersonas } from '../layers/persona-layer';

// ── WebSocket Sync Bridge ─────────────────────────────────────────

let _ws: WebSocket | null = null;

function _initSync(): void {
    if (_ws || typeof window === 'undefined') return;
    
    try {
        _ws = new WebSocket('ws://localhost:8080');
        
        _ws.onopen = () => {
            console.log('[Claw Orchestrator] Connected to Bridge Relay');
            _syncAll();
        };

        _ws.onmessage = (e) => {
            try {
                const { type, payload } = JSON.parse(e.data);
                handleRemoteCommand(type, payload);
            } catch {}
        };

        _ws.onclose = () => {
            _ws = null;
            setTimeout(_initSync, 5000); // Reconnect
        };
    } catch {
        // Silent — bridge might not be running
    }
}

function _syncAll(): void {
    if (!_ws || _ws.readyState !== WebSocket.OPEN) return;
    _ws.send(JSON.stringify({
        type: 'STATE_SYNC',
        payload: { claws: Array.from(_claws.values()) }
    }));
}

function handleRemoteCommand(type: string, payload: any) {
    console.log('[Claw Orchestrator] Remote Command:', type, payload);
    switch (type) {
        case 'STATE_SYNC_REQ':
            _syncAll();
            break;
        case 'REMOTE_CHAT':
            const { id, message, providerConfig } = payload;
            runClawTask(id, { messages: [{ role: 'user', content: message }], providerConfig });
            break;
        case 'REMOTE_PANIC':
            panicFreezeAll();
            break;
    }
}

// ── Types ─────────────────────────────────────────────────────────

export type ClawStatus = 'running' | 'frozen' | 'killed';

export interface ClawData {
    id: string;
    clawName: string;
    emoji: string;
    personaId: string | null;
    skillSetId: string | null;
    status: ClawStatus;
    messages: Array<{ role: string; content: string; name?: string; tool_calls?: any[]; tool_call_id?: string }>;
    createdAt: string;
    updatedAt: string;
    model: string;
    provider: string;
}

// ── Core State ────────────────────────────────────────────────────

let _claws: Map<string, ClawData> = new Map();
let _listeners: Array<() => void> = [];
let _panicActive = false;
let _worker: SharedWorker | Worker | null = null;

const WIPEOUT_PHRASE = 'WIPEOUT CONFIRM';

// ── Helpers ───────────────────────────────────────────────────────

function _notify(): void {
    for (const listener of _listeners) listener();
}

function _persist(): void {
    try {
        const data = Array.from(_claws.values());
        localStorage.setItem('ezclaw_claws', JSON.stringify(data));
        _syncAll();
    } catch { /* quota exceeded — silent */ }
    _notify();
}

function _load(): void {
    try {
        const raw = localStorage.getItem('ezclaw_claws');
        if (raw) {
            const arr: ClawData[] = JSON.parse(raw);
            _claws = new Map(arr.map(c => [c.id, c]));
        }
    } catch { /* corrupt data — start fresh */ }
}

// ── Worker Bridge ─────────────────────────────────────────────────

async function _initWorker(): Promise<any> {
    if (_worker) return _worker;

    const workerUrl = new URL('../worker/claw-worker.ts', import.meta.url).href;

    // 0. Native Bridge (Tauri/Electron)
    if ((window as any).__TAURI__ || (window as any).electron) {
        console.log('[Claw Orchestrator] Native bridge detected. (Implementation pending for Tauri/Electron IPC)');
    }

    // 1. Try SharedWorker (Desktop / Android Chrome)
    if (typeof SharedWorker !== 'undefined') {
        try {
            const sw = new SharedWorker(workerUrl, { type: 'module', name: 'EZ-Claw-Worker' });
            _worker = sw.port as any;
            (_worker as any).onmessage = (e: MessageEvent) => handleWorkerEvent(e.data);
            (_worker as any).start();
            _worker?.postMessage({ type: 'INIT' });
            console.log('[Claw Orchestrator] Initialized SharedWorker');
            return _worker;
        } catch (e) {
            console.warn('[Claw Orchestrator] SharedWorker failed:', e);
        }
    }

    // 2. Try Service Worker (iOS Safari / PWA Fallback)
    if ('serviceWorker' in navigator) {
        try {
            const reg = await navigator.serviceWorker.register(workerUrl, { type: 'module', scope: '/' });
            await navigator.serviceWorker.ready;
            _worker = navigator.serviceWorker.controller || reg.active as any;
            
            navigator.serviceWorker.onmessage = (e) => handleWorkerEvent(e.data);
            _worker?.postMessage({ type: 'INIT' });
            
            console.log('[Claw Orchestrator] Initialized ServiceWorker');
            return _worker;
        } catch (e) {
            console.warn('[Claw Orchestrator] ServiceWorker failed:', e);
        }
    }

    // 3. Fallback: Dedicated Worker
    console.warn('[Claw Orchestrator] No persistent background worker available. Using Dedicated Worker.');
    _worker = new Worker(workerUrl, { type: 'module' });
    _worker.onmessage = (e) => handleWorkerEvent(e.data);
    _worker.postMessage({ type: 'INIT' });
    
    return _worker;
}

// Internal sync accessor (with lazy init)
function _getWorkerPort(): any {
    if (!_worker) {
        _initWorker(); // Fire and forget init if first access
    }
    return (_worker as any)?.port || _worker;
}

function handleWorkerEvent(event: any) {
    const { type, payload } = event;
    console.log('[Claw Orchestrator] Worker Event:', type, payload);

    switch (type) {
        case 'MESSAGE_ADD':
            const claw = _claws.get(payload.clawId);
            if (claw) {
                // Background worker is the source of truth for message order
                claw.messages = [...claw.messages, payload.message];
                _persist();
                _notify();
            }
            break;
        case 'TASK_STATUS':
            // Optional: update UI-only status indicator
            break;
        case 'TASK_COMPLETE':
            // Task finished naturally
            break;
        case 'ERROR':
            console.error('[Claw Worker Error]', payload);
            break;
    }
}

/** 
 * Proxy task execution to the worker. 
 * This is the primary way the UI triggers AI activity.
 */
export function runClawTask(id: string, payload: any): void {
    const port = _getWorkerPort() as any;
    if (!port) {
        console.error('[Claw Orchestrator] No worker port available for runClawTask');
        return;
    }
    port.postMessage({
        type: 'RUN_TASK',
        payload: { clawId: id, ...payload }
    });
}

/** 🛑 Stop execution in the worker immediately. */
export function stopClawTask(id: string): void {
    const port = _getWorkerPort() as any;
    if (!port) return;
    port.postMessage({
        type: 'STOP_TASK',
        payload: { clawId: id }
    });
}

// ── Lifecycle ─────────────────────────────────────────────────────

export function initOrchestrator(): void {
    _load();
    _initSync();
}

export function onClawsChange(listener: () => void): () => void {
    _listeners.push(listener);
    return () => {
        _listeners = _listeners.filter(l => l !== listener);
    };
}

// ── CRUD (Claw Management) ────────────────────────────────────────

const DEFAULT_EMOJIS = ['🦀', '🐙', '🦑', '🦞', '🦐', '🐍', '🦅', '🐺', '🦊', '🐲'];

function _pickEmoji(): string {
    return DEFAULT_EMOJIS[_claws.size % DEFAULT_EMOJIS.length];
}

export function createClaw(
    name: string,
    model: string,
    provider: string,
    emoji?: string,
): ClawData {
    const id = crypto.randomUUID();
    const claw: ClawData = {
        id,
        clawName: name || `Claw ${_claws.size + 1}`,
        emoji: emoji || _pickEmoji(),
        personaId: getActivePersonaId(),
        skillSetId: getActiveSkillSetId(),
        status: 'running',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        model,
        provider,
    };
    _claws.set(id, claw);
    _persist();
    return claw;
}

export function cloneClaw(
    fromId: string,
    newName: string,
    model: string,
    provider: string,
): ClawData | null {
    const source = _claws.get(fromId);
    if (!source) return null;

    const id = crypto.randomUUID();
    const claw: ClawData = {
        id,
        clawName: newName || `${source.clawName} (clone)`,
        emoji: source.emoji,
        personaId: source.personaId,
        skillSetId: source.skillSetId,
        status: 'running',
        messages: [], 
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        model: model || source.model,
        provider: provider || source.provider,
    };
    _claws.set(id, claw);
    _persist();
    return claw;
}

export function getClaw(id: string): ClawData | undefined {
    return _claws.get(id);
}

export function getAllClaws(): ClawData[] {
    return Array.from(_claws.values())
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function updateClaw(id: string, updates: Partial<ClawData>): void {
    const claw = _claws.get(id);
    if (!claw) return;
    Object.assign(claw, updates, { updatedAt: new Date().toISOString() });
    _claws.set(id, claw);
    _persist();
}

export function deleteClaw(id: string): void {
    _claws.delete(id);
    stopClawTask(id); // Stop background work too
    _persist();
}

// ── Concurrency & Layer Activation ────────────────────────────────

export function canClawProceed(id: string): boolean {
    const claw = _claws.get(id);
    return !!claw && claw.status === 'running';
}

export function activateClawLayers(id: string): void {
    const claw = _claws.get(id);
    if (!claw) return;
    if (claw.personaId) swapPersona(claw.personaId);
    if (claw.skillSetId) swapSkillSet(claw.skillSetId);
}

// ── PANIC CONTROLS ────────────────────────────────────────────────

export function panicFreezeAll(): void {
    _panicActive = true;
    for (const [id, claw] of _claws) {
        if (claw.status === 'running') {
            claw.status = 'frozen';
            _claws.set(id, claw);
            stopClawTask(id);
        }
    }
    _persist();
}

export function isPanicActive(): boolean {
    return _panicActive;
}

export function killClaw(id: string): void {
    const claw = _claws.get(id);
    if (!claw) return;
    claw.status = 'killed';
    _claws.set(id, claw);
    stopClawTask(id);
    _persist();
}

export function resumeAll(): void {
    _panicActive = false;
    for (const [id, claw] of _claws) {
        if (claw.status === 'frozen') {
            claw.status = 'running';
            _claws.set(id, claw);
        }
    }
    _persist();
}

export function resumeClaw(id: string): void {
    const claw = _claws.get(id);
    if (!claw || claw.status !== 'frozen') return;
    claw.status = 'running';
    _claws.set(id, claw);
    const anyFrozen = Array.from(_claws.values()).some(c => c.status === 'frozen');
    if (!anyFrozen) _panicActive = false;
    _persist();
}

// ── Wipeout ───────────────────────────────────────────────────────

export function wipeoutAll(confirmations: string[]): boolean {
    if (confirmations.length !== 3 || !confirmations.every(c => c === WIPEOUT_PHRASE)) {
        return false;
    }

    const personas = listPersonas();
    for (const p of personas) {
        try { localStorage.removeItem(`ezclaw_persona_${p.id}`); } catch {}
    }

    const skillSets = listSkillSets();
    for (const ss of skillSets) {
        deleteSkillSet(ss.id);
    }

    for (const [id, claw] of _claws) {
        claw.personaId = null;
        claw.skillSetId = null;
        stopClawTask(id);
        _claws.set(id, claw);
    }

    try {
        localStorage.removeItem('ezclaw_personas');
        localStorage.removeItem('ezclaw_active_persona');
        localStorage.removeItem('ezclaw:skills');
        localStorage.removeItem('ezclaw:skillsets');
        localStorage.removeItem('ezclaw:active_skillset');
    } catch {}

    _persist();
    return true;
}

export function getWipeoutPhrase(): string {
    return WIPEOUT_PHRASE;
}

export function getClawCounts(): { total: number; running: number; frozen: number; killed: number } {
    let running = 0, frozen = 0, killed = 0;
    for (const claw of _claws.values()) {
        switch (claw.status) {
            case 'running': running++; break;
            case 'frozen': frozen++; break;
            case 'killed': killed++; break;
        }
    }
    return { total: _claws.size, running, frozen, killed };
}
