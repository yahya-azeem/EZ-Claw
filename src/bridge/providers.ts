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
        id: 'openrouter',
        name: 'OpenRouter',
        defaultModel: 'google/gemini-2.0-flash-exp:free',
        models: [
            'google/gemini-2.0-flash-exp:free',
            'anthropic/claude-3.5-sonnet',
            'meta-llama/llama-3.3-70b-instruct',
            'meta-llama/llama-4-maverick:free',
            'qwen/qwen3-235b-a22b',
            'anthropic/claude-sonnet-4-20250514',
            'openai/gpt-4.1',
        ],
        modelLabels: [
            'Gemini 2.0 Flash (Free)',
            'Claude 3.5 Sonnet',
            'Llama 3.3 70B',
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
        id: 'github-copilot',
        name: 'GitHub Copilot (Models)',
        defaultModel: 'gpt-4o',
        models: [
            'gpt-4o', 'gpt-4o-mini', 'o1-preview', 'o1-mini',
            'claude-3-5-sonnet', 'claude-3-haiku', 'claude-3-opus',
            'gemini-1.5-pro', 'gemini-1.5-flash',
            'llama-3.3-70b', 'phi-3.5-moe'
        ],
        modelLabels: [
            'GPT-4o', 'GPT-4o mini', 'o1 Preview', 'o1 mini',
            'Claude 3.5 Sonnet', 'Claude 3 Haiku', 'Claude 3 Opus',
            'Gemini 1.5 Pro', 'Gemini 1.5 Flash',
            'Llama 3.3 70B', 'Phi-3.5 MoE'
        ],
        free: false,
        defaultApiUrl: 'https://models.inference.ai.azure.com',
    },
    {
        id: 'github-copilot-sdk',
        name: 'GitHub Copilot (SDK)',
        defaultModel: 'claude-3-haiku',
        models: ['gpt-4o', 'gpt-4o-mini', 'claude-3-5-sonnet', 'claude-3-haiku', 'gemini-1.5-pro'],
        free: true, // Handled by server auth
    },
    {
        id: 'zerogravity',
        name: 'ZeroGravity (Antigravity)',
        defaultModel: 'gemini-3-flash',
        models: ['gemini-3-flash', 'sonnet-4.6', 'sonnet-4.0', 'opus-3.8', 'haiku-4.2'],
        modelLabels: ['Gemini 3 Flash (Fast)', 'Sonnet 4.6 (Intelligence)', 'Sonnet 4.0', 'Opus 3.8 (Infinite)', 'Haiku 4.2 (Speed)'],
        free: false,
        defaultApiUrl: 'http://localhost:8741/v1',
    },
];

// ── Lookup helpers ──

export function getProvider(id: string): ProviderDef | undefined {
    return PROVIDERS.find(p => p.id === id);
}

export function getDefaultModel(providerId: string): string {
    return getProvider(providerId)?.defaultModel || 'google/gemini-2.0-flash-exp:free';
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

    if (provider === 'openrouter') {
        const origin = typeof self !== 'undefined' ? self.location.origin : '';
        headers['HTTP-Referer'] = origin;
        headers['X-Title'] = 'EZ-Claw';
    }

    return headers;
}
