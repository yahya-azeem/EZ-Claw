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
import { streamChat, chatCompletion, type ProviderConfig } from './provider-bridge';
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
    getIdentity(): AgentIdentity;
    setIdentity(identity: Partial<AgentIdentity>): AgentIdentity;
    getUser(): UserProfile;
    setUser(user: Partial<UserProfile>): UserProfile;

    // Personas
    listPersonas(): PersonaEntry[];
    getActivePersonaId(): string | null;
    switchPersona(id: string): boolean;
    createPersona(label: string, fromCurrent?: boolean): PersonaEntry;
    deletePersona(id: string): boolean;
    renamePersona(id: string, newLabel: string): boolean;
    exportPersonas(): string;
    importPersonas(json: string): number;

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
let _eventListeners: Map<string, Set<Function>> = new Map();
let _config: EZClawConfig = {
    provider: 'deepseek',
    model: 'deepseek-chat',
    apiKey: '',
    temperature: 0.7,
    apiUrl: '',
};

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

        // Create sandbox manager
        _sandbox = new SandboxManager({ tier: 'wasi', enabled: true });

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
        if (!_config.apiKey) throw new Error('No API key configured. Call setConfig() first.');

        const opt = {
            temperature: options?.temperature ?? _config.temperature,
            model: options?.model ?? _config.model,
            stream: options?.stream ?? false,
            onToolCall: options?.onToolCall,
            onChunk: options?.onChunk,
        };

        // Build messages with identity and memories
        const messages: ChatMessage[] = [{ role: 'user', content: message }];

        let identityPrompt = buildIdentityPrompt();
        if (isFirstRun()) {
            identityPrompt += '\n\n' + buildBootstrapPrompt();
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

        const providerConfig: ProviderConfig = {
            provider: _config.provider,
            apiKey: _config.apiKey,
            model: opt.model,
            temperature: opt.temperature,
            apiUrl: _config.apiUrl || undefined,
        };

        // For now, use non-streaming (full response)
        const response = await chatCompletion(
            builtMessagesJson,
            providerConfig,
            false, // non-streaming
            async (toolCallJson: string) => {
                const toolCalls = JSON.parse(toolCallJson);
                const results: ToolCallResult[] = [];

                for (const tc of toolCalls) {
                    const request: ToolCallRequest = {
                        id: tc.id,
                        name: tc.function.name,
                        arguments: tc.function.arguments,
                    };

                    let result: ToolCallResult;
                    if (options?.onToolCall) {
                        result = await options.onToolCall(request);
                    } else {
                        result = await executeToolCall(agent, null as any, request);
                    }

                    results.push(result);
                }

                return JSON.stringify(results);
            }
        );

        agent.free();

        // Handle first-run bootstrap completion
        if (isFirstRun() && response.includes('bootstrapped')) {
            markBootstrapped();
        }

        return response;
    },

    /**
     * Get the current agent identity.
     */
    getIdentity(): AgentIdentity {
        return loadIdentity();
    },

    /**
     * Update the agent identity.
     */
    setIdentity(identity: Partial<AgentIdentity>): AgentIdentity {
        const current = loadIdentity();
        const updated = { ...current, ...identity, updatedAt: new Date().toISOString() };
        saveIdentity(updated);
        return updated;
    },

    /**
     * Get the current user profile.
     */
    getUser(): UserProfile {
        return loadUser();
    },

    /**
     * Update the user profile.
     */
    setUser(user: Partial<UserProfile>): UserProfile {
        const current = loadUser();
        const updated = { ...current, ...user };
        saveUser(updated);
        return updated;
    },

    /**
     * List all saved personas.
     */
    listPersonas(): PersonaEntry[] {
        return listPersonas();
    },

    /**
     * Get the active persona ID.
     */
    getActivePersonaId(): string | null {
        return getActivePersonaId();
    },

    /**
     * Switch to a different persona.
     */
    switchPersona(id: string): boolean {
        return switchPersona(id);
    },

    /**
     * Create a new persona.
     */
    createPersona(label: string, fromCurrent: boolean = false): PersonaEntry {
        return createPersona(label, fromCurrent);
    },

    /**
     * Delete a persona.
     */
    deletePersona(id: string): boolean {
        return deletePersona(id);
    },

    /**
     * Rename a persona.
     */
    renamePersona(id: string, newLabel: string): boolean {
        return renamePersona(id, newLabel);
    },

    /**
     * Export all personas as JSON.
     */
    exportPersonas(): string {
        return exportPersonas();
    },

    /**
     * Import personas from JSON.
     */
    importPersonas(json: string): number {
        return importPersonas(json);
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
        if (config.provider !== undefined) await saveConfig('provider', config.provider);
        if (config.model !== undefined) await saveConfig('model', config.model);
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
