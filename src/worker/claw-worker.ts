/**
 * Claw Background Worker v7.0
 * 
 * This worker hosts the persistent AI Claws. It runs as a SharedWorker 
 * to ensure that AI processing continues even if individual tabs are 
 * closed or refreshed.
 * 
 * It manages:
 * - WASM lifecycle (WasmAgent, WasmWorkspace)
 * - Autonomous AI loops (Tool execution)
 * - Real-time event broadcasting to all connected tabs
 */

import { initWasm, type EzClawWasm } from '../bridge/wasm-loader';
import { executeToolCall } from '../bridge/tool-runtime';
import { getDB, STORES } from '../bridge/db-bridge';
import { buildProviderHeaders } from '../bridge/providers';
import { initMemory } from '../bridge/memory-bridge';
import { getCopilotSession, type CopilotSession } from '../bridge/copilot-bridge';
import { NETWORK, CLAW_DEFAULTS, TIMEOUTS, EVENTS, WORKER } from '../bridge/constants';

// --- Internal State ---
let wasm: EzClawWasm | null = null;
let workspace: any = null;
const ports: Set<MessagePort> = new Set();
const activeTasks: Map<string, AbortController> = new Map();
let copilotSession: CopilotSession | null = null;
let initPromise: Promise<void> | null = null;

// --- Orchestration State (Single Source of Truth) ---
let _claws: Map<string, any> = new Map();
let _ws: WebSocket | null = null;

async function initSync() {
    if (_ws) return;
    try {
        console.log(`[Claw Worker] Attempting to connect to bridge: ${NETWORK.BRIDGE_RELAY_URL}`);
        _ws = new WebSocket(NETWORK.BRIDGE_RELAY_URL);
        _ws.onopen = () => console.log('[Claw Worker] ✅ Connected to Bridge Relay');
        _ws.onmessage = (e) => {
            console.log('[Claw Worker] 📥 Received Bridge Message:', e.data);
            try {
                const { type, payload } = JSON.parse(e.data);
                handleRemoteCommand(type, payload);
            } catch (err) {
                console.error('[Claw Worker] ❌ JSON Parse Error:', err);
            }
        };
        _ws.onclose = () => {
            console.warn('[Claw Worker] ⚠️ Bridge connection closed. Retrying...');
            _ws = null;
            setTimeout(initSync, NETWORK.RETRY_INTERVAL_MS);
        };
        _ws.onerror = (err) => {
            console.error('[Claw Worker] ❌ Bridge Socket Error:', err);
        };
    } catch (err) {
        console.error('[Claw Worker] ❌ Failed to create WebSocket:', err);
    }
}

async function handleRemoteCommand(type: string, payload: any) {
    switch (type) {
        case EVENTS.CREATE_CLAW:
            await createClaw(payload);
            break;
        case 'REMOTE_CHAT':
            const { id, message, providerConfig } = payload;
            let fullId = id;
            if (id.length === 8) {
                const found = Array.from(_claws.values()).find(c => c.id.startsWith(id));
                if (found) fullId = found.id;
            }
            handleRunTask({ clawId: fullId, messages: [{ role: 'user', content: message }], providerConfig }, null);
            break;
        case EVENTS.CLEAR_CLAWS:
            _claws.clear();
            const db = await getDB();
            await db.clear(STORES.SESSIONS);
            broadcast({ type: EVENTS.STATE_UPDATED, payload: { claws: [] } });
            break;
    }
}

async function createClaw(payload: any) {
    const { name, model, provider, id: externalId } = payload;
    const id = externalId || crypto.randomUUID();
    
    if (_claws.has(id)) return;

    const claw = {
        id,
        title: name || CLAW_DEFAULTS.NAME,
        clawName: name || CLAW_DEFAULTS.NAME,
        emoji: CLAW_DEFAULTS.EMOJI,
        status: CLAW_DEFAULTS.STATUS,
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        model,
        provider,
    };

    _claws.set(id, claw);
    const db = await getDB();
    await db.put(STORES.SESSIONS, claw);
    broadcast({ type: EVENTS.STATE_UPDATED, payload: { claws: Array.from(_claws.values()) } });
}

async function ensureWasmInitialized() {
    if (wasm) return;
    if (initPromise) return initPromise;
    
    initPromise = (async () => {
        console.log('[Claw Worker] Lazy-initializing WASM...');
        wasm = await initWasm();
        workspace = new (wasm as any).WasmWorkspace();
        await initMemory();
    })();
    
    return initPromise;
}

// --- Request/Response System with Main Thread ---
const pendingRequests: Map<string, (data: any) => void> = new Map();

async function requestFromOrchestrator(type: string, payload: any): Promise<any> {
    const requestId = crypto.randomUUID();
    return new Promise((resolve) => {
        pendingRequests.set(requestId, resolve);
        broadcast({ type, payload, requestId, isRequestFromWorker: true });
    });
}

// --- Hybrid Worker Entry ---

// 1. SharedWorker Support
if (typeof (self as any).onconnect !== 'undefined') {
    (self as any).onconnect = (e: MessageEvent) => {
        const port = e.ports[0];
        ports.add(port);
        port.onmessage = (msg: MessageEvent) => handleMessage(msg, port);
        port.start();
        console.log('[Claw Worker] SharedWorker client connected.');
        
        // Proactive sync on connect
        initSync().catch(e => console.error("[Worker] Startup sync failed:", e));
    };
} else {
    // Top-level sync for Dedicated/Service Workers
    initSync().catch(e => console.error("[Worker] Startup sync failed:", e));
}

// 2. ServiceWorker Support
self.addEventListener('install', (event: any) => {
    console.log('[Claw Worker] ServiceWorker installing...');
    event.waitUntil((self as any).skipWaiting());
});

self.addEventListener('activate', (event: any) => {
    console.log('[Claw Worker] ServiceWorker activated.');
    event.waitUntil((self as any).clients.claim());
});

self.addEventListener('message', (event: MessageEvent) => {
    // Service Worker messages come through the 'message' event on self
    if (event.data && event.data.type) {
        handleMessage(event, event.source || (self as any));
    }
});

// 3. Dedicated Worker / Fallback Support
self.onmessage = (evt) => {
    if (evt.data && evt.data.type) {
        handleMessage(evt, self as any);
    }
};

async function handleMessage(event: MessageEvent, port: MessagePort | any) {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    const { type, payload, requestId } = data;
    
    // broadcast({ type: 'LOG', payload: `[Worker Debug] Received ${type}` });

    try {
        // 1. Handle Response to Worker-initiated Request
        if (type === EVENTS.RESPONSE && requestId) {
            const resolve = pendingRequests.get(requestId);
            if (resolve) {
                resolve(payload);
                pendingRequests.delete(requestId);
            }
            return;
        }

        // 1. Unified Event Aliasing (CLI support)
        if (type === 'STATE_SYNC_REQ') {
             // Worker uses type natively
        }
        if (type === 'REMOTE_CHAT' && payload) {
            // Map remote chat to internal task run
        }

        switch (type) {
            case EVENTS.PING:
                port.postMessage({ type: EVENTS.PONG, requestId });
                break;

            case EVENTS.INIT:
                (async () => {
                    try {
                        // Load from DB first (Critical State)
                        if (_claws.size === 0) {
                            const db = await getDB();
                            const all = await db.getAll(STORES.SESSIONS);
                            _claws = new Map(all.map(s => [s.id as string, s]));
                            console.log(`[Worker] Loaded ${_claws.size} sessions from DB`);
                        }
                        
                        // Signal success immediately so UI shows existing Claws
                        port.postMessage({ 
                            type: EVENTS.INIT_SUCCESS, 
                            payload: { claws: Array.from(_claws.values()) },
                            requestId 
                        });

                        // Defer secondary inits
                        ensureWasmInitialized().catch(e => console.error("[Worker] WASM defer failed:", e));
                        initSync().catch(e => console.error("[Worker] Sync defer failed:", e));
                    } catch (err: any) {
                        console.error("[Worker] INIT FATAL:", err);
                        port.postMessage({ type: 'ERROR', payload: { message: err.message }, requestId });
                    }
                })();
                break;

            case EVENTS.GET_CLAWS:
            case 'STATE_SYNC_REQ':
                port.postMessage({ 
                    type: EVENTS.STATE_UPDATED, 
                    payload: { claws: Array.from(_claws.values()) },
                    requestId 
                });
                break;

            case 'RESPONSE_FROM_MAIN':
                if (requestId && pendingRequests.has(requestId)) {
                    pendingRequests.get(requestId)!(payload);
                    pendingRequests.delete(requestId);
                }
                break;

            case EVENTS.CREATE_CLAW:
                await createClaw(payload);
                break;

            case EVENTS.CLEAR_CLAWS:
                _claws.clear();
                const db = await getDB();
                await db.clear(STORES.SESSIONS);
                broadcast({ type: EVENTS.STATE_UPDATED, payload: { claws: [] } });
                break;
                
            case EVENTS.DELETE_CLAW:
                const idToDelete = payload.id;
                _claws.delete(idToDelete);
                const dbDel = await getDB();
                await dbDel.delete(STORES.SESSIONS, idToDelete);
                broadcast({ type: EVENTS.STATE_UPDATED, payload: { claws: Array.from(_claws.values()) } });
                break;

            case EVENTS.UPDATE_CLAW:
                const { id: idToUpdate, updates } = payload;
                const existing = _claws.get(idToUpdate);
                if (existing) {
                    Object.assign(existing, updates);
                    existing.updatedAt = new Date().toISOString();
                    const dbUpd = await getDB();
                    await dbUpd.put(STORES.SESSIONS, existing);
                    broadcast({ type: EVENTS.STATE_UPDATED, payload: { claws: Array.from(_claws.values()) } });
                }
                break;
                
            case EVENTS.RUN_TASK:
                await handleRunTask(payload, port);
                break;

            case EVENTS.STOP_TASK:
                const controller = activeTasks.get(payload.clawId);
                if (controller) {
                    controller.abort();
                    activeTasks.delete(payload.clawId);
                }
                break;

            default:
                console.warn('[Claw Worker] Unknown message type:', type);
        }
    } catch (err: any) {
        console.error('[Claw Worker] Fatal Error:', err);
        port.postMessage({ 
            type: 'ERROR', 
            payload: { message: err.message, stack: err.stack }, 
            requestId 
        });
    }
}

async function handleRunTask(payload: any, port: MessagePort | any) {
    const { clawId, messages, providerConfig, identityPrompt, memories } = payload;
    broadcast({ type: 'LOG', payload: `[Worker] handleRunTask for ${clawId}` });
    
    await ensureWasmInitialized();
    if (!wasm) throw new Error('WASM failed to initialize in worker');

    // Cancel existing task for this claw if running
    activeTasks.get(clawId)?.abort();
    const abortController = new AbortController();
    activeTasks.set(clawId, abortController);

    const { signal } = abortController;

    try {
        const session = _claws.get(clawId);
        
        // Use session config if available, fallback to provided payload
        const runProvider = session?.provider || providerConfig.provider;
        const runModel = session?.model || providerConfig.model;
        const runTemp = session?.temperature ?? providerConfig.temperature ?? 0.7;
        const runApiUrl = session?.apiUrl || providerConfig.apiUrl;

        // Create agent instance in worker
        const agent = new (wasm as any).WasmAgent(JSON.stringify({
            default_provider: runProvider,
            default_model: runModel,
            default_temperature: runTemp,
        }));

        const builtMessagesJson = agent.build_messages(
            JSON.stringify(messages),
            JSON.stringify(memories),
            identityPrompt,
            new Date().toLocaleString(),
        );

        let loopMessages = JSON.parse(builtMessagesJson);
        const maxIterations = CLAW_DEFAULTS.MAX_ITERATIONS;
        
        // --- Agentic Loop ---
        for (let i = 0; i < maxIterations; i++) {
            if (signal.aborted) break;

            broadcast({ type: 'TASK_STATUS', payload: { clawId, status: i > 0 ? 'Thinking...' : 'Starting...' } });

            const toolsJson = new (wasm as any).WasmToolRegistry().to_llm_json();

            const requestBody = (wasm as any).build_provider_request_with_tools(
                JSON.stringify(loopMessages),
                runModel,
                runTemp,
                false,
                toolsJson
            );

            const baseUrl = runApiUrl || wasm.provider_base_url(runProvider);
            const endpoint = `${baseUrl}/chat/completions`;
            broadcast({ type: 'LOG', payload: `[Worker] Fetching ${endpoint} (Provider: ${runProvider})` });

            // Use the centralized header builder from providers.ts
            let apiKey = providerConfig.apiKey;
            if (!apiKey && providerConfig.provider === 'github-copilot') {
                // 1. Check for basic User Access Token from secrets
                const db = await getDB();
                const secret = await db.get(STORES.SECRETS, 'GITHUB_TOKEN');
                
                if (secret) {
                    // 2. Check if we need to refresh/get the Copilot Session Token
                    if (!copilotSession || Date.now() >= copilotSession.expires_at - TIMEOUTS.COPILOT_REFRESH_BUFFER_MS) {
                        broadcast({ type: 'TASK_STATUS', payload: { clawId, status: 'Refreshing Copilot Session...' } });
                        copilotSession = await getCopilotSession(secret.value);
                    }
                    apiKey = copilotSession.token;
                }
            }

            const headers = buildProviderHeaders(runProvider, apiKey || '');

            let assistantMsg: any;

            if (runProvider === 'github-copilot-sdk') {
                // Proxy to bridge relay via Main Thread (Orchestrator)
                broadcast({ type: 'TASK_STATUS', payload: { clawId, status: '📡 SDK Request...' } });
                
                const sdkResponse: any = await requestFromOrchestrator('COPILOT_SDK_CHAT', { messages: loopMessages });
                assistantMsg = { role: 'assistant', content: sdkResponse.content };
                
                // Note: SDK currently doesn't provide tool_calls in this simplified proxy
            } else {
                const response = await fetch(endpoint, {
                    method: 'POST',
                    headers,
                    body: requestBody,
                    signal
                });

                broadcast({ type: 'LOG', payload: `[Worker] Response Status: ${response.status}` });

                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(`API error ${response.status}: ${errText}`);
                }

                const data = await response.json();
                assistantMsg = data.choices?.[0]?.message;
            }

            if (!assistantMsg) throw new Error('No message from provider');

            // 1. Notify UI of arrival (if any tabs are open)
            broadcast({ type: 'MESSAGE_ADD', payload: { clawId, message: assistantMsg } });
            loopMessages.push(assistantMsg);

            // 2. Persist to DB for background recovery
            await persistToDB(clawId, assistantMsg);

            if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
                for (const tc of assistantMsg.tool_calls) {
                    if (signal.aborted) break;

                    const toolName = tc.function?.name || tc.name || 'unknown';
                    const toolArgs = tc.function?.arguments || tc.arguments || '{}';
                    const toolId = tc.id || crypto.randomUUID();

                    const argsSummary = toolArgs.length > 30 ? toolArgs.slice(0, 30) + '...' : toolArgs;
                    broadcast({ type: 'TASK_STATUS', payload: { clawId, status: `🔧 Running: ${toolName}(${argsSummary})` } });

                    let result: string;
                    try {
                        const res = await executeToolCall(agent, workspace, {
                            id: toolId,
                            name: toolName,
                            arguments: toolArgs
                        });
                        result = res.output || res.error || 'Success';
                    } catch (e: any) {
                        result = `Error: ${e.message}`;
                    }

                    const toolMsg = { role: 'tool', tool_call_id: toolId, name: toolName, content: result };
                    broadcast({ type: 'MESSAGE_ADD', payload: { clawId, message: toolMsg } });
                    loopMessages.push(toolMsg);
                    
                    // Persist tool result too
                    await persistToDB(clawId, toolMsg);
                }
                continue;
            }

            // No tool calls -> finished
            break;
        }

        agent.free();
        broadcast({ type: 'TASK_COMPLETE', payload: { clawId } });

    } catch (err: any) {
        if (err.name === 'AbortError') {
            broadcast({ type: 'TASK_STATUS', payload: { clawId, status: 'Cancelled' } });
        } else {
            broadcast({ type: 'ERROR', payload: { clawId, message: err.message } });
        }
    } finally {
        activeTasks.delete(clawId);
    }
}

async function broadcast(msg: any) {
    // 1. Dispatch to SharedWorker ports
    ports.forEach(p => p.postMessage(msg));
    
    // 2. Dispatch to ServiceWorker clients
    if ((self as any).clients && (self as any).clients.matchAll) {
        const clients = await (self as any).clients.matchAll();
        clients.forEach((client: any) => client.postMessage(msg));
    }

    // 3. Broadcast to Bridge Relay (CLI Sync)
    if (_ws && _ws.readyState === 1) { // 1 = WebSocket.OPEN
        try {
            _ws.send(JSON.stringify(msg));
        } catch (err) {
            console.error('[Claw Worker] Failed to send to Bridge:', err);
        }
    }

    // 4. Fallback for Dedicated Worker
    if (ports.size === 0 && !(self as any).clients && !(_ws && _ws.readyState === 1)) {
        (self as any).postMessage(msg);
    }
}

async function persistToDB(clawId: string, message: any) {
    try {
        const claw = _claws.get(clawId);
        if (claw) {
            claw.messages = [...(claw.messages || []), message];
            claw.updatedAt = new Date().toISOString();
            
            const db = await getDB();
            await db.put(STORES.SESSIONS, claw);
            
            // Broadcast update to all tabs
            broadcast({ type: 'STATE_UPDATED', payload: { claws: Array.from(_claws.values()) } });
            
            // Forward to bridge relay for CLI feedback
            if (_ws && _ws.readyState === WebSocket.OPEN) {
                _ws.send(JSON.stringify({ type: 'MESSAGE_ADD', payload: { clawId, message } }));
            }
        }
    } catch (err) {
        console.error('[Claw Worker] Persistence failed:', err);
    }
}
