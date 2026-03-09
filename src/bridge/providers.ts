/**
 * Shared Provider & Model Configuration.
 *
 * Single source of truth for provider names, model lists, default models,
 * API URLs, and auth requirements. Used by App.svelte, Settings.svelte,
 * Chat.svelte, agent-api.ts, and provider-bridge.ts.
 */

// ── Providers that don't require an API key ──
export const NO_KEY_PROVIDERS = ['zerogravity', 'ollama'];

// ── Provider definitions ──
export interface ProviderDef {
    id: string;
    name: string;
    defaultModel: string;
    models: string[];
    /** Display labels for each model (parallel to models array) */
    modelLabels?: string[];
    free: boolean;
    defaultApiUrl?: string;
}

export const PROVIDERS: ProviderDef[] = [
    {
        id: 'deepseek',
        name: 'DeepSeek',
        defaultModel: 'deepseek-chat',
        models: ['deepseek-chat', 'deepseek-reasoner'],
        modelLabels: ['DeepSeek V3-0324', 'DeepSeek R1'],
        free: true,
    },
    {
        id: 'openrouter',
        name: 'OpenRouter',
        defaultModel: 'deepseek/deepseek-chat',
        models: [
            'deepseek/deepseek-chat',
            'deepseek/deepseek-r1',
            'google/gemini-2.5-flash-preview',
            'google/gemini-2.5-pro-preview',
            'meta-llama/llama-4-maverick:free',
            'qwen/qwen3-235b-a22b',
            'anthropic/claude-sonnet-4-20250514',
            'openai/gpt-4.1',
        ],
        modelLabels: [
            'DeepSeek V3-0324 (Free)',
            'DeepSeek R1 (Free)',
            'Gemini 2.5 Flash Preview',
            'Gemini 2.5 Pro Preview',
            'Llama 4 Maverick (Free)',
            'Qwen 3 235B-A22B',
            'Claude Sonnet 4',
            'GPT-4.1',
        ],
        free: true,
    },
    {
        id: 'openai',
        name: 'OpenAI',
        defaultModel: 'gpt-4.1-mini',
        models: ['gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o3-mini', 'o4-mini'],
        free: false,
    },
    {
        id: 'anthropic',
        name: 'Anthropic',
        defaultModel: 'claude-sonnet-4-20250514',
        models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-3-5-haiku-20241022'],
        modelLabels: ['Claude Sonnet 4', 'Claude Opus 4', 'Claude 3.5 Haiku'],
        free: false,
    },
    {
        id: 'ollama',
        name: 'Ollama (Local)',
        defaultModel: 'llama3',
        models: ['llama3', 'llama3.3', 'mistral', 'codellama', 'deepseek-coder-v2', 'qwen2.5'],
        free: true,
        defaultApiUrl: 'http://localhost:11434/v1',
    },
    {
        id: 'custom',
        name: 'Custom OpenAI-compatible',
        defaultModel: '',
        models: [''],
        free: false,
    },
    {
        id: 'puter',
        name: 'Puter (User-Pays)',
        defaultModel: 'gpt-4.1-mini',
        models: ['gpt-4.1-mini', 'gpt-4.1', 'claude-sonnet-4'],
        free: false,
        defaultApiUrl: 'https://api.puter.com/v1',
    },
    {
        id: 'zerogravity',
        name: 'ZeroGravity (Antigravity)',
        defaultModel: 'sonnet-4.6',
        models: [
            'opus-4.6', 'sonnet-4.6',
            'gemini-3-flash', 'gemini-3.1-pro',
            'gemini-3.1-pro-high', 'gemini-3.1-pro-low',
            'gemini-3-pro-image',
        ],
        modelLabels: [
            'Claude Opus 4.6', 'Claude Sonnet 4.6',
            'Gemini 3 Flash', 'Gemini 3.1 Pro',
            'Gemini 3.1 Pro (High)', 'Gemini 3.1 Pro (Low)',
            'Gemini 3 Pro (Images)',
        ],
        free: false,
        defaultApiUrl: 'http://localhost:8741/v1',
    },
];

// ── Lookup helpers ──

export function getProvider(id: string): ProviderDef | undefined {
    return PROVIDERS.find(p => p.id === id);
}

export function getDefaultModel(providerId: string): string {
    return getProvider(providerId)?.defaultModel || 'deepseek-chat';
}

export function getValidModels(providerId: string): string[] {
    return getProvider(providerId)?.models || [];
}

export function getDefaultApiUrl(providerId: string): string {
    return getProvider(providerId)?.defaultApiUrl || '';
}

export function isValidProvider(id: string): boolean {
    return PROVIDERS.some(p => p.id === id);
}

export function needsApiKey(providerId: string): boolean {
    return !NO_KEY_PROVIDERS.includes(providerId);
}

/**
 * Build the correct HTTP headers for a given provider.
 * Centralizes the duplicated header logic from provider-bridge.ts and Chat.svelte.
 */
export function buildProviderHeaders(provider: string, apiKey: string): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (provider === 'anthropic') {
        headers['x-api-key'] = apiKey;
        headers['anthropic-version'] = '2023-06-01';
    } else if (NO_KEY_PROVIDERS.includes(provider)) {
        // No auth header needed
    } else if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`;
    }

    if (provider === 'openrouter' && typeof window !== 'undefined') {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'EZ-Claw';
    }

    return headers;
}
