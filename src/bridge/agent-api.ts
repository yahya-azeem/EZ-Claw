/**
 * Headless Agent API — window.EZClaw
 *
 * A global JavaScript API for interacting with the EZ-Claw agent
 * outside of the Svelte UI (e.g., browser console, WebSocket, TUI).
 *
 * Usage:
 *   await EZClaw.init()
 *   await EZClaw.chat("Hello, agent!")
 *   EZClaw.listPersonas()
 *   EZClaw.switchPersona("persona-id")
 */

import { initWasm, getWasm, isWasmReady, type EzClawWasm } from './wasm-loader';
import { type ProviderConfig } from './provider-bridge';
import { NO_KEY_PROVIDERS } from './providers';
import { getConfig, saveConfig } from './storage-bridge';
import { recallMemories, storeMemory, initMemory, loadMemoryFromData, exportMemoryData } from './memory-bridge';
import {
    loadIdentity,
    saveIdentity,
    loadUser,
    saveUser,
    buildIdentityPrompt,
    buildBootstrapPrompt,
    isFirstRun,
    markBootstrapped,
    listPersonas,
    switchPersona,
    createPersona,
    deletePersona,
    renamePersona,
    exportPersonas,
    importPersonas,
    getActivePersonaId,
    type AgentIdentity,
    type PersonaEntry,
    type UserProfile,
} from './identity-bridge';
import { executeToolCall, type ToolCallRequest, type ToolCallResult } from './tool-runtime';
import { SandboxManager } from './sandbox-manager';

export interface EZClawConfig {
    provider: string;
    model: string;
    apiKey: string;
    temperature: number;
    apiUrl?: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    tool_calls?: any[];
    tool_call_id?: string;
    name?: string;
}

export interface ChatOptions {
    temperature?: number;
    model?: string;
    stream?: boolean;
    onToolCall?: (request: ToolCallRequest) => Promise<ToolCallResult>;
    onChunk?: (chunk: string) => void;
}

export interface EZClawAPI {
    // Initialization
    init(): Promise<void>;
    isReady(): boolean;
    getVersion(): string;

    // Chat
    chat(message: string, options?: ChatOptions): Promise<string>;

    // Identity
    getIdentity(): Promise<AgentIdentity>;
    setIdentity(identity: Partial<AgentIdentity>): Promise<AgentIdentity>;
    getUser(): Promise<UserProfile>;
    setUser(user: Partial<UserProfile>): Promise<UserProfile>;

    // Personas
    listPersonas(): Promise<PersonaEntry[]>;
    getActivePersonaId(): Promise<string | null>;
    switchPersona(id: string): Promise<boolean>;
    createPersona(label: string, fromCurrent?: boolean): Promise<PersonaEntry>;
    deletePersona(id: string): Promise<boolean>;
    renamePersona(id: string, newLabel: string): Promise<boolean>;
    exportPersonas(): Promise<string>;
    importPersonas(json: string): Promise<number>;

    // Config
    getConfig(): Promise<EZClawConfig>;
    setConfig(config: Partial<EZClawConfig>): Promise<void>;

    // Memory
    recallMemories(query: string, limit?: number): any[];
    storeMemory(key: string, content: string, category?: string): void;

    // Events
    on(event: string, callback: Function): void;
    off(event: string, callback: Function): void;
}

// Internal state
let _wasm: EzClawWasm | null = null;
let _sandbox: SandboxManager | null = null;
let _workspace: any = null; // Shared WasmWorkspace singleton
let _eventListeners: Map<string, Set<Function>> = new Map();
let _config: EZClawConfig = {
    provider: 'openrouter',
    model: 'google/gemini-2.0-flash-exp:free',
    apiKey: '',
    temperature: 0.7,
    apiUrl: '',
};

function getWorkspace(): any {
    if (!_wasm) throw new Error('EZClaw not initialized');
    if (!_workspace) {
        _workspace = new (_wasm as any).WasmWorkspace();
    }
    return _workspace;
}

// Load config from storage
async function loadConfig(): Promise<void> {
    try {
        const provider = await getConfig('provider');
        const model = await getConfig('model');
        const apiKey = await getConfig('apiKey');
        const temp = await getConfig('temperature');
        const apiUrl = await getConfig('apiUrl');

        if (provider) _config.provider = provider;
        if (model) _config.model = model;
        if (apiKey) _config.apiKey = apiKey;
        if (temp) _config.temperature = parseFloat(temp);
        if (apiUrl) _config.apiUrl = apiUrl;
    } catch { /* ignore */ }
}

const EZClaw: EZClawAPI = {
    /**
     * Initialize the EZ-Claw API.
     * Must be called before any other methods.
     */
    async init(): Promise<void> {
        if (_wasm) return; // Already initialized

        // Initialize storage first
        const { initStorage } = await import('./storage-bridge');
        await initStorage();
        await loadConfig();

        // Initialize WASM
        _wasm = await initWasm();

        // Initialize memory
        try {
            await initMemory();
        } catch { /* ignore */ }

        // Create sandbox manager and workspace
        _sandbox = new SandboxManager({ tier: 'wasi', enabled: true });
        _workspace = new (_wasm as any).WasmWorkspace();

        console.log('[EZClaw] Initialized');
    },

    /**
     * Check if the API is ready.
     */
    isReady(): boolean {
        return _wasm !== null && isWasmReady();
    },

    /**
     * Get the WASM version string.
     */
    getVersion(): string {
        if (!_wasm) throw new Error('EZClaw not initialized. Call init() first.');
        return _wasm.version();
    },

    /**
     * Send a chat message and get a response.
     */
    async chat(message: string, options?: ChatOptions): Promise<string> {
        if (!_wasm) throw new Error('EZClaw not initialized. Call init() first.');
        
        if (!NO_KEY_PROVIDERS.includes(_config.provider) && !_config.apiKey) {
            throw new Error('No API key configured. Call setConfig() first.');
        }

        const opt = {
            temperature: options?.temperature ?? _config.temperature,
            model: options?.model ?? _config.model,
            stream: options?.stream ?? false,
            onToolCall: options?.onToolCall,
            onChunk: options?.onChunk,
        };

        // Build messages with identity and memories
        const messages: ChatMessage[] = [{ role: 'user', content: message }];

        let identityPrompt = await buildIdentityPrompt();
        if (await isFirstRun()) {
            identityPrompt += '\n\n' + await buildBootstrapPrompt();
        }

        let memoriesArr: string[] = [];
        try {
            const recalled = recallMemories(message, 5);
            memoriesArr = recalled.map(m => `[${m.category}] ${m.key}: ${m.content}`);
        } catch { /* Memory not initialized */ }

        // Create agent
        const agent = new (_wasm as any).WasmAgent(JSON.stringify({
            default_provider: _config.provider,
            default_model: opt.model,
            default_temperature: opt.temperature,
        }));

        // Build messages
        const builtMessagesJson = agent.build_messages(
            JSON.stringify(messages),
            JSON.stringify(memoriesArr),
            identityPrompt,
            new Date().toLocaleString(),
        );

        // Agentic loop: non-streaming with tool call handling
        let loopMessages = JSON.parse(builtMessagesJson);
        const maxIterations = 10;
        let finalResponse = '';
        const workspace = getWorkspace();

        // Build headers
        const { buildProviderHeaders } = await import('./providers');
        let baseUrl = _config.apiUrl || _wasm.provider_base_url(_config.provider);
        const endpoint = `${baseUrl}/chat/completions`;
        const headers = buildProviderHeaders(_config.provider, _config.apiKey);

        for (let i = 0; i < maxIterations; i++) {
            const requestBody = _wasm.build_provider_request(
                JSON.stringify(loopMessages),
                opt.model,
                opt.temperature,
                false,
            );

            const response = await fetch(endpoint, {
                method: 'POST',
                headers,
                body: requestBody,
            });

            if (!response.ok) {
                const errText = await response.text();
                throw new Error(`API error ${response.status}: ${errText}`);
            }

            const data = await response.json();
            const choice = data.choices?.[0];
            if (!choice) throw new Error('No response from model');

            const assistantMsg = choice.message;

            // Handle tool calls
            if (assistantMsg.tool_calls?.length > 0) {
                loopMessages.push(assistantMsg);

                for (const tc of assistantMsg.tool_calls) {
                    const request: ToolCallRequest = {
                        id: tc.id || crypto.randomUUID(),
                        name: tc.function?.name || tc.name || 'unknown',
                        arguments: tc.function?.arguments || tc.arguments || '{}',
                    };

                    let result: ToolCallResult;
                    if (options?.onToolCall) {
                        result = await options.onToolCall(request);
                    } else {
                        result = await executeToolCall(agent, workspace, request);
                    }

                    loopMessages.push({
                        role: 'tool',
                        tool_call_id: request.id,
                        content: result.output || result.error || '',
                    });
                }
                continue;
            }

            // No tool calls — final text response
            finalResponse = assistantMsg.content || '';
            break;
        }

        agent.free();

        // Handle first-run bootstrap completion
        if (await isFirstRun() && finalResponse.includes('bootstrapped')) {
            await markBootstrapped();
        }

        return finalResponse;
    },

    /**
     * Get the current agent identity.
     */
    async getIdentity(): Promise<AgentIdentity> {
        return await loadIdentity();
    },

    /**
     * Update the agent identity.
     */
    async setIdentity(identity: Partial<AgentIdentity>): Promise<AgentIdentity> {
        const current = await loadIdentity();
        const updated = { ...current, ...identity, updatedAt: new Date().toISOString() } as AgentIdentity;
        await saveIdentity(updated);
        return updated;
    },

    /**
     * Get the current user profile.
     */
    async getUser(): Promise<UserProfile> {
        return await loadUser();
    },

    /**
     * Update the user profile.
     */
    async setUser(user: Partial<UserProfile>): Promise<UserProfile> {
        const current = await loadUser();
        const updated = { ...current, ...user } as UserProfile;
        await saveUser(updated);
        return updated;
    },

    /**
     * List all saved personas.
     */
    async listPersonas(): Promise<PersonaEntry[]> {
        return await listPersonas();
    },

    /**
     * Get the active persona ID.
     */
    async getActivePersonaId(): Promise<string | null> {
        return await getActivePersonaId();
    },

    /**
     * Switch to a different persona.
     */
    async switchPersona(id: string): Promise<boolean> {
        return await switchPersona(id);
    },

    /**
     * Create a new persona.
     */
    async createPersona(label: string, fromCurrent: boolean = false): Promise<PersonaEntry> {
        return await createPersona(label, fromCurrent);
    },

    /**
     * Delete a persona.
     */
    async deletePersona(id: string): Promise<boolean> {
        return await deletePersona(id);
    },

    /**
     * Rename a persona.
     */
    async renamePersona(id: string, newLabel: string): Promise<boolean> {
        return await renamePersona(id, newLabel);
    },

    /**
     * Export all personas as JSON.
     */
    async exportPersonas(): Promise<string> {
        return await exportPersonas();
    },

    /**
     * Import personas from JSON.
     */
    async importPersonas(json: string): Promise<number> {
        return await importPersonas(json);
    },

    /**
     * Get current configuration.
     */
    async getConfig(): Promise<EZClawConfig> {
        await loadConfig();
        return { ..._config };
    },

    /**
     * Update configuration.
     */
    async setConfig(config: Partial<EZClawConfig>): Promise<void> {
        _config = { ..._config, ...config };

        // Persist to storage
        if (config.provider !== undefined) {
            _config.provider = 'openrouter'; // Set provider to openrouter
            await saveConfig('provider', _config.provider);
        }
        _config.model = 'google/gemini-2.0-flash-exp:free'; // Set model to gemini
        await saveConfig('model', _config.model); // Save the hardcoded model
        if (config.apiKey !== undefined) await saveConfig('apiKey', config.apiKey);
        if (config.temperature !== undefined) await saveConfig('temperature', String(config.temperature));
        if (config.apiUrl !== undefined) await saveConfig('apiUrl', config.apiUrl || '');
    },

    /**
     * Recall memories matching a query.
     */
    recallMemories(query: string, limit: number = 5): any[] {
        return recallMemories(query, limit);
    },

    /**
     * Store a memory.
     */
    storeMemory(key: string, content: string, category: string = 'general'): void {
        storeMemory(key, content, category);
    },

    /**
     * Register an event listener.
     */
    on(event: string, callback: Function): void {
        if (!_eventListeners.has(event)) {
            _eventListeners.set(event, new Set());
        }
        _eventListeners.get(event)!.add(callback);
    },

    /**
     * Remove an event listener.
     */
    off(event: string, callback: Function): void {
        _eventListeners.get(event)?.delete(callback);
    },
};

// Emit events internally
function emit(event: string, data?: any): void {
    _eventListeners.get(event)?.forEach(cb => cb(data));
}

// Expose to window
if (typeof window !== 'undefined') {
    (window as any).EZClaw = EZClaw;
}

export default EZClaw;
