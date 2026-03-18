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

// --- Internal State ---
let wasm: EzClawWasm | null = null;
let workspace: any = null;
const ports: Set<MessagePort> = new Set();
const activeTasks: Map<string, AbortController> = new Map();

// --- Hybrid Worker Entry ---

// 1. SharedWorker Support
if (typeof (self as any).onconnect !== 'undefined') {
    (self as any).onconnect = (e: MessageEvent) => {
        const port = e.ports[0];
        ports.add(port);
        port.onmessage = (evt) => handleIncomingMessage(evt.data, port);
        port.start();
        console.log('[Claw Worker] SharedWorker client connected.');
    };
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

self.addEventListener('message', (event: any) => {
    // Service Worker messages come through the 'message' event on self
    if (event.data && event.data.type) {
        handleIncomingMessage(event.data, event.source || event.target);
    }
});

// 3. Dedicated Worker / Fallback Support
self.onmessage = (evt) => {
    if (evt.data && evt.data.type) {
        handleIncomingMessage(evt.data, self as any);
    }
};

async function handleIncomingMessage(data: any, port: MessagePort | any) {
    const { type, payload, requestId } = data;

    try {
        switch (type) {
            case 'PING':
                port.postMessage({ type: 'PONG', requestId });
                break;

            case 'INIT':
                if (!wasm) {
                    wasm = await initWasm();
                    workspace = new (wasm as any).WasmWorkspace();
                }
                port.postMessage({ type: 'INIT_SUCCESS', requestId });
                break;

            case 'RUN_TASK':
                await handleRunTask(payload, port);
                break;

            case 'STOP_TASK':
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
        port.postMessage({ type: 'ERROR', payload: err.message, requestId });
    }
}

async function handleRunTask(payload: any, port: MessagePort | any) {
    const { clawId, messages, providerConfig, identityPrompt, memories } = payload;
    
    if (!wasm) throw new Error('WASM not initialized in worker');

    // Cancel existing task for this claw if running
    activeTasks.get(clawId)?.abort();
    const abortController = new AbortController();
    activeTasks.set(clawId, abortController);

    const { signal } = abortController;

    try {
        // Create agent instance in worker
        const agent = new (wasm as any).WasmAgent(JSON.stringify({
            default_provider: providerConfig.provider,
            default_model: providerConfig.model,
            default_temperature: providerConfig.temperature,
        }));

        const builtMessagesJson = agent.build_messages(
            JSON.stringify(messages),
            JSON.stringify(memories),
            identityPrompt,
            new Date().toLocaleString(),
        );

        let loopMessages = JSON.parse(builtMessagesJson);
        const maxIterations = 10;
        
        // --- Agentic Loop ---
        for (let i = 0; i < maxIterations; i++) {
            if (signal.aborted) break;

            broadcast({ type: 'TASK_STATUS', payload: { clawId, status: i > 0 ? 'Thinking...' : 'Starting...' } });

            const toolsJson = new (wasm as any).WasmToolRegistry().to_llm_json();

            const requestBody = (wasm as any).build_provider_request_with_tools(
                JSON.stringify(loopMessages),
                providerConfig.model,
                providerConfig.temperature,
                false,
                toolsJson
            );

            const baseUrl = providerConfig.apiUrl || wasm.provider_base_url(providerConfig.provider);
            const endpoint = `${baseUrl}/chat/completions`;

            // Simple header builder (copied from providers.ts logic to be worker-safe)
            const headers: Record<string, string> = { 'Content-Type': 'application/json' };
            if (providerConfig.apiKey) {
                if (providerConfig.provider === 'openai' || providerConfig.provider === 'deepseek') {
                    headers['Authorization'] = `Bearer ${providerConfig.apiKey}`;
                } else if (providerConfig.provider === 'anthropic') {
                    headers['x-api-key'] = providerConfig.apiKey;
                    headers['anthropic-version'] = '2023-06-01';
                }
            }

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: requestBody,
                signal
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            const assistantMsg = data.choices?.[0]?.message;
            if (!assistantMsg) throw new Error('No message from provider');

            // Notify UI of arrival
            broadcast({ type: 'MESSAGE_ADD', payload: { clawId, message: assistantMsg } });
            loopMessages.push(assistantMsg);

            if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
                for (const tc of assistantMsg.tool_calls) {
                    if (signal.aborted) break;

                    const toolName = tc.function?.name || tc.name || 'unknown';
                    const toolArgs = tc.function?.arguments || tc.arguments || '{}';
                    const toolId = tc.id || crypto.randomUUID();

                    broadcast({ type: 'TASK_STATUS', payload: { clawId, status: `🔧 Running: ${toolName}...` } });

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

    // 3. Fallback for Dedicated Worker
    if (ports.size === 0 && !(self as any).clients) {
        (self as any).postMessage(msg);
    }
}
