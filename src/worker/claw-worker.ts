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

async function ensureWasmInitialized(): Promise<boolean> {
    if (wasm) return true;
    if (initPromise) {
        try {
            await Promise.race([
                initPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('WASM init timeout')), TIMEOUTS.WASM_INIT_MS))
            ]);
            return !!wasm;
        } catch (e) {
            console.warn('[Claw Worker] WASM init timed out or failed:', e);
            return false;
        }
    }
    
    initPromise = (async () => {
        console.log('[Claw Worker] Lazy-initializing WASM...');
        wasm = await initWasm();
        console.log('[Claw Worker] WASM loaded successfully');
        workspace = new (wasm as any).WasmWorkspace();
        await initMemory();
        console.log('[Claw Worker] WASM + Memory fully initialized');
    })();
    
    try {
        await Promise.race([
            initPromise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('WASM init timeout')), TIMEOUTS.WASM_INIT_MS))
        ]);
        return !!wasm;
    } catch (e) {
        console.warn('[Claw Worker] WASM init timed out or failed:', e);
        return false;
    }
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

// --- Unified Communication Layer ---

const onMessageGlobal = (msg: MessageEvent, targetPort: any) => {
    const data = msg.data;
    if (!data || !data.type) return;
    console.log(`%c[Worker] 📥 INCOMING: ${data.type}`, 'background: #222; color: #bada55; font-size: 14px');
    handleMessage(msg, targetPort).catch(err => {
        console.error(`[Worker] Error handling ${data.type}:`, err);
    });
};

// Detect worker context and set up message handler
const isSharedWorker = typeof (self as any).onconnect !== 'undefined';
console.log(`[Worker] Context: ${isSharedWorker ? 'SharedWorker' : 'DedicatedWorker'}`);

if (isSharedWorker) {
    // SharedWorker Entry
    (self as any).onconnect = (e: MessageEvent) => {
        const port = e.ports[0];
        ports.add(port);
        port.onmessage = (msg: MessageEvent) => onMessageGlobal(msg, port);
        port.start();
        console.log('[Worker] SharedWorker client connected.');
        broadcast({ type: 'INIT_ACK', payload: { version: '0.1.0' } });
        initSync().catch(e => console.error("[Worker] Startup sync failed:", e));
    };
} else {
    // DedicatedWorker Entry — use self.onmessage directly
    console.log('[Worker] Setting up DedicatedWorker message handler via self.onmessage');
    (self as any).onmessage = (event: MessageEvent) => {
        console.log(`[Worker] 🔔 Raw DedicatedWorker message received:`, event.data?.type || 'unknown');
        onMessageGlobal(event, self);
    };
}

// Initial signal for DedicatedWorker
console.log('[Claw Worker] Script execution complete.');
if (!isSharedWorker) {
    self.postMessage({ type: 'CONNECTED', payload: { id: 'worker-primary' } });
    initSync().catch(e => console.error("[Worker] Startup sync failed:", e));
}

async function handleMessage(event: MessageEvent, port: MessagePort | any) {
    const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    const { type, payload, requestId } = data;
    
    console.log(`[Worker] handleMessage: ${type}`, payload);

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
    
    // Cancel existing task for this claw if running
    activeTasks.get(clawId)?.abort();
    const abortController = new AbortController();
    activeTasks.set(clawId, abortController);
    const { signal } = abortController;

    try {
        const session = _claws.get(clawId);
        
        // Use session config if available, fallback to provided payload
        const runProvider = session?.provider || providerConfig?.provider || CLAW_DEFAULTS.PROVIDER;
        const runModel = session?.model || providerConfig?.model || CLAW_DEFAULTS.MODEL;
        const runTemp = session?.temperature ?? providerConfig?.temperature ?? CLAW_DEFAULTS.TEMPERATURE;
        const runApiUrl = session?.apiUrl || providerConfig?.apiUrl;

        // Try WASM init with timeout, but DON'T block if it fails
        broadcast({ type: 'TASK_STATUS', payload: { clawId, status: 'Initializing...' } });
        const wasmReady = await ensureWasmInitialized();
        
        if (wasmReady && wasm) {
            // === WASM-powered path (full agent with tools) ===
            await runWithWasm(clawId, messages, memories || [], identityPrompt || '', runProvider, runModel, runTemp, runApiUrl, providerConfig, signal);
        } else {
            // === Direct API fallback path (chat-only, no tools) ===
            console.warn('[Worker] WASM not available, using direct API fallback');
            await runDirectAPI(clawId, messages, runProvider, runModel, runTemp, runApiUrl, providerConfig, signal);
        }

        broadcast({ type: 'TASK_COMPLETE', payload: { clawId } });

    } catch (err: any) {
        if (err.name === 'AbortError') {
            broadcast({ type: 'TASK_STATUS', payload: { clawId, status: 'Cancelled' } });
        } else {
            console.error('[Worker] Task error:', err);
            broadcast({ type: 'ERROR', payload: { clawId, message: err.message } });
        }
    } finally {
        activeTasks.delete(clawId);
    }
}

// === Direct API Path (no WASM dependency) ===
async function runDirectAPI(
    clawId: string, messages: any[], runProvider: string, runModel: string,
    runTemp: number, runApiUrl: string | undefined, providerConfig: any, signal: AbortSignal
) {
    broadcast({ type: 'TASK_STATUS', payload: { clawId, status: 'Thinking...' } });

    // Build the request body manually (no WASM)
    const requestBody = JSON.stringify({
        model: runModel,
        messages: messages,
        temperature: runTemp,
        stream: false,
    });

    // Determine endpoint
    const baseUrl = runApiUrl || getDefaultApiUrl(runProvider);
    const endpoint = `${baseUrl}/chat/completions`;
    broadcast({ type: 'LOG', payload: `[Worker] Direct API → ${endpoint} (${runProvider}/${runModel})` });

    // Build headers
    const apiKey = providerConfig?.apiKey || '';
    const headers = buildProviderHeaders(runProvider, apiKey);

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: requestBody,
        signal
    });

    broadcast({ type: 'LOG', payload: `[Worker] Response: ${response.status}` });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const assistantMsg = data.choices?.[0]?.message;

    if (!assistantMsg) throw new Error('No message from provider');

    broadcast({ type: 'MESSAGE_ADD', payload: { clawId, message: assistantMsg } });
    await persistToDB(clawId, assistantMsg);
}

// Helper for getting API base URL without WASM
function getDefaultApiUrl(provider: string): string {
    const urls: Record<string, string> = {
        'openrouter': 'https://openrouter.ai/api/v1',
        'openai': 'https://api.openai.com/v1',
        'anthropic': 'https://api.anthropic.com/v1',
        'ollama': 'http://localhost:11434/v1',
        'zerogravity': 'http://localhost:8741/v1',
    };
    return urls[provider] || 'https://openrouter.ai/api/v1';
}

// === WASM-powered path ===
async function runWithWasm(
    clawId: string, messages: any[], memories: any[], identityPrompt: string,
    runProvider: string, runModel: string, runTemp: number,
    runApiUrl: string | undefined, providerConfig: any, signal: AbortSignal
) {
    if (!wasm) throw new Error('WASM not available');

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
    
    for (let i = 0; i < maxIterations; i++) {
        if (signal.aborted) break;

        broadcast({ type: 'TASK_STATUS', payload: { clawId, status: i > 0 ? 'Thinking...' : 'Starting...' } });

        const toolsJson = new (wasm as any).WasmToolRegistry().to_llm_json();
        const requestBody = (wasm as any).build_provider_request_with_tools(
            JSON.stringify(loopMessages), runModel, runTemp, false, toolsJson
        );

        const baseUrl = runApiUrl || wasm.provider_base_url(runProvider);
        const endpoint = `${baseUrl}/chat/completions`;
        broadcast({ type: 'LOG', payload: `[Worker] Fetching ${endpoint} (Provider: ${runProvider})` });

        let apiKey = providerConfig?.apiKey;
        if (!apiKey && providerConfig?.provider === 'github-copilot') {
            const db = await getDB();
            const secret = await db.get(STORES.SECRETS, 'GITHUB_TOKEN');
            if (secret) {
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
            broadcast({ type: 'TASK_STATUS', payload: { clawId, status: '📡 SDK Request...' } });
            const sdkResponse: any = await requestFromOrchestrator('COPILOT_SDK_CHAT', { messages: loopMessages });
            assistantMsg = { role: 'assistant', content: sdkResponse.content };
        } else {
            const response = await fetch(endpoint, { method: 'POST', headers, body: requestBody, signal });
            broadcast({ type: 'LOG', payload: `[Worker] Response Status: ${response.status}` });
            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API error ${response.status}: ${errText}`);
            }
            const data = await response.json();
            assistantMsg = data.choices?.[0]?.message;
        }

        if (!assistantMsg) throw new Error('No message from provider');

        broadcast({ type: 'MESSAGE_ADD', payload: { clawId, message: assistantMsg } });
        loopMessages.push(assistantMsg);
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
                    const res = await executeToolCall(agent, workspace, { id: toolId, name: toolName, arguments: toolArgs });
                    result = res.output || res.error || 'Success';
                } catch (e: any) {
                    result = `Error: ${e.message}`;
                }
                const toolMsg = { role: 'tool', tool_call_id: toolId, name: toolName, content: result };
                broadcast({ type: 'MESSAGE_ADD', payload: { clawId, message: toolMsg } });
                loopMessages.push(toolMsg);
                await persistToDB(clawId, toolMsg);
            }
            continue;
        }
        break;
    }
    agent.free();
}

async function broadcast(msg: any) {
    // 1. Dispatch to SharedWorker ports
    if (ports.size > 0) {
        ports.forEach(p => p.postMessage(msg));
    }
    
    // 2. Dispatch to ServiceWorker clients
    if ((self as any).clients && (self as any).clients.matchAll) {
        const clients = await (self as any).clients.matchAll();
        clients.forEach((client: any) => client.postMessage(msg));
    }

    // 3. Broadcast to Bridge Relay (CLI Sync)
    if (_ws && _ws.readyState === 1) {
        try {
            _ws.send(JSON.stringify(msg));
        } catch (err) {
            console.error('[Claw Worker] Failed to send to Bridge:', err);
        }
    }

    // 4. ALWAYS postMessage for DedicatedWorker (not just fallback!)
    // This is how we communicate back to the orchestrator.
    if (typeof (self as any).onconnect === 'undefined' && ports.size === 0) {
        try {
            (self as any).postMessage(msg);
        } catch (e) {
            // Swallow if postMessage not available
        }
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
