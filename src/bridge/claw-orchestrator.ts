/**
 * Claw Orchestrator v8.0 — Centralized Worker Proxy Edition
 *
 * This version removes all local tab-based sync logic (WebSocket, 
 * Leader Election) and delegates everything to the SharedWorker.
 * The orchestrator now acts as a thin proxy for the central state.
 */

import {
    swapPersona,
    getActivePersonaId,
    listPersonas
} from '../layers/persona-layer';
import {
    swapSkillSet,
    getActiveSkillSetId,
    listSkillSets,
    deleteSkillSet,
} from '../layers/skills-layer';
import { getDB, STORES } from './db-bridge';
import { type SessionData } from './storage-bridge';
import { EVENTS, WORKER } from './constants';

export type ClawStatus = 'running' | 'frozen' | 'killed';

// ── Shared State (Mirror of Worker) ───────────────────────────────

let _claws: Map<string, SessionData> = new Map();
let _listeners: Array<() => void> = [];
let _worker: any = null;
let _initPromise: Promise<any> | null = null;
let _broadcast: BroadcastChannel | null = null;

// ── Helpers ───────────────────────────────────────────────────────

function _notify(): void {
    for (const listener of _listeners) listener();
}

// ── Worker Bridge ─────────────────────────────────────────────────

async function _initWorker(): Promise<any> {
    if (_worker) return _worker;
    if (_initPromise) return _initPromise;

    // Use a static URL for Vite's static analysis to correctly bundle the worker
    const workerUrl = new URL('../worker/claw-worker.ts', import.meta.url);
    console.log(`[Orchestrator] Initializing DedicatedWorker at ${workerUrl}`);

    _initPromise = (async () => {
        try {
            const worker = new Worker(workerUrl, { type: WORKER.TYPE, name: WORKER.NAME });
            _worker = worker as any; // Cast for simplified postMessage usage

            worker.onmessage = (e) => {
                const data = e.data;
                if (data.type === 'CONNECTED') {
                    console.log(`[Orchestrator] Worker connected successfully`);
                }
                _handleWorkerEvent(data);
            };

            worker.onerror = (err) => {
                console.error('[Orchestrator] Worker Error:', err);
                _initPromise = null;
                _worker = null;
            };
            
            // Initialize BroadcastChannel for cross-tab sync
            _broadcast = new BroadcastChannel('ezclaw-sync');
            _broadcast.onmessage = (e) => {
                if (e.data.type === 'SYNC_STATE') {
                    _claws = new Map(e.data.claws.map((c: any) => [c.id, c]));
                    _notify();
                }
            };

            worker.postMessage({ type: EVENTS.INIT });
            return worker;
        } catch (err) {
            console.error('[Orchestrator] Failed to start Worker:', err);
            _initPromise = null;
            throw err;
        }
    })();

    return _initPromise;
}

function _handleWorkerEvent(event: any) {
    const { type, payload } = event;
    
    switch (type) {
        case EVENTS.STATE_UPDATED:
        case EVENTS.INIT_SUCCESS:
            if (payload && payload.claws) {
                _claws = new Map(payload.claws.map((c: any) => [c.id, c]));
                if (_broadcast) {
                    _broadcast.postMessage({ type: 'SYNC_STATE', claws: Array.from(_claws.values()) });
                }
                _notify();
            }
            break;
        case EVENTS.MESSAGE_ADD:
            const claw = _claws.get(payload.clawId);
            if (claw) {
                claw.messages = [...claw.messages, payload.message];
                _notify();
            }
            break;
        case EVENTS.TASK_STATUS: {
            const claw = _claws.get(payload.clawId);
            if (claw) {
                (claw as any).lastStatus = payload.status;
                _notify();
            }
            break;
        }
        case EVENTS.TASK_COMPLETE: {
            const claw = _claws.get(payload.clawId);
            if (claw) {
                (claw as any).lastStatus = null;
                (claw as any).lastError = null;
                _notify();
            }
            break;
        }
        case 'ERROR': {
            const claw = _claws.get(payload.clawId);
            if (claw) {
                (claw as any).lastError = payload.message;
                claw.messages = [...claw.messages, { 
                    role: 'assistant', 
                    content: `❌ **Error:** ${payload.message}` 
                }];
                _notify();
            }
            break;
        }
        case 'LOG':
            console.log(`[Worker Log]`, payload);
            break;
    }

    // Handle Requests from Worker
    if (event.isRequestFromWorker) {
        _handleWorkerRequest(event);
    }
}

async function _handleWorkerRequest(request: any) {
    const { type, payload, requestId } = request;
    const port = await _initWorker();
    
    try {
        if (type === 'COPILOT_SDK_CHAT') {
            // This would normally call the bridge-relay via WebSocket
            // For now, let's just proxy to the relay if connected
            throw new Error("SDK proxy not fully implemented in Orchestrator yet");
        }
        
        // port.postMessage({ type: 'RESPONSE', requestId, payload: { ... } });
    } catch (err: any) {
        port.postMessage({ type: 'RESPONSE', requestId, error: err.message });
    }
}

// ── API (Proxied to Worker) ───────────────────────────────────────

export async function initOrchestrator(): Promise<void> {
    await _initWorker();
}

export function onClawsChange(listener: () => void): () => void {
    _listeners.push(listener);
    return () => {
        _listeners = _listeners.filter(l => l !== listener);
    };
}

export function getAllClaws(): SessionData[] {
    return Array.from(_claws.values())
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function getClaw(id: string): SessionData | undefined {
    return _claws.get(id);
}

export async function createClaw(
    name: string,
    model: string,
    provider: string,
    emoji?: string,
    externalId?: string
): Promise<SessionData> {
    const id = externalId || crypto.randomUUID();
    const port = await _initWorker();
    
    port.postMessage({
        type: 'CREATE_CLAW',
        payload: { id, name, model, provider, emoji }
    });
    
    // Return a optimistic preview (worker will confirm via STATE_UPDATED)
    return { id, title: name, clawName: name, status: 'running', messages: [], model, provider } as any;
}

export async function runClawTask(id: string, payload: any): Promise<void> {
    console.log(`[Orchestrator] runClawTask for ${id}`, payload);
    const claw = _claws.get(id);
    if (claw) {
        (claw as any).lastStatus = 'Starting...';
        (claw as any).lastError = null;
        _notify();
    }
    const port = await _initWorker();
    // CRITICAL: Deep-clone payload to strip Svelte 5 Proxy wrappers.
    // Proxy objects fail the structured clone algorithm used by postMessage.
    const cleanPayload = JSON.parse(JSON.stringify({ clawId: id, ...payload }));
    console.log(`[Orchestrator] 🚀 Dispatching RUN_TASK for ${id}. Payload keys: ${Object.keys(cleanPayload)}`);
    port.postMessage({
        type: 'RUN_TASK',
        payload: cleanPayload
    });
}

export async function stopClawTask(id: string): Promise<void> {
    const port = await _initWorker();
    port.postMessage({
        type: 'STOP_TASK',
        payload: { clawId: id }
    });
}

export async function clearClaws(): Promise<void> {
    const port = await _initWorker();
    port.postMessage({ type: 'CLEAR_CLAWS' });
}

export async function deleteClaw(id: string): Promise<void> {
    const port = await _initWorker();
    port.postMessage({ type: 'DELETE_CLAW', payload: { id } });
}

export function cloneClaw(sourceId: string, name: string, model: string, provider: string): SessionData {
    const id = crypto.randomUUID();
    const source = _claws.get(sourceId);
    
    // Optimistic creation, worker will handle the rest
    createClaw(name, model, provider, source?.emoji, id);
    
    return { 
        id, title: name, clawName: name, status: 'running', 
        messages: source?.messages || [], 
        model, provider 
    } as any;
}

export async function activateClawLayers(id: string): Promise<void> {
    const claw = _claws.get(id);
    if (!claw) return;
    if (claw.personaId) await swapPersona(claw.personaId);
    if (claw.skillSetId) await swapSkillSet(claw.skillSetId);
}

// ── Migration Helpers ─────────────────────────────────────────────

export function killClaw(id: string): void {
    // Legacy support, should be moved to worker too if needed
    updateClaw(id, { status: 'killed' });
}

export async function updateClaw(id: string, updates: Partial<SessionData>): Promise<void> {
    const claw = _claws.get(id);
    if (!claw) return;
    // For now, local update + worker will eventually persist
    Object.assign(claw, updates);
    _notify();
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

// ── Panic & Wipeout (Proxied) ─────────────────────────────────────

export async function panicFreezeAll(): Promise<void> {
    const port = await _initWorker();
    port.postMessage({ type: 'PANIC_FREEZE' });
}

export async function resumeAll(): Promise<void> {
    const port = await _initWorker();
    port.postMessage({ type: 'RESUME_ALL' });
}

export async function wipeoutAll(confirmations: string[]): Promise<boolean> {
    const port = await _initWorker();
    port.postMessage({ type: 'WIPEOUT_ALL', payload: { confirmations } });
    return true;
}

export function getWipeoutPhrase(): string {
    return 'WIPEOUT CONFIRM';
}

export function isPanicActive(): boolean {
    return Array.from(_claws.values()).some(c => c.status === 'frozen');
}

export async function resumeClaw(id: string): Promise<void> {
    updateClaw(id, { status: 'running' });
    const port = await _initWorker();
    port.postMessage({ type: 'RESUME_CLAW', payload: { id } });
}
