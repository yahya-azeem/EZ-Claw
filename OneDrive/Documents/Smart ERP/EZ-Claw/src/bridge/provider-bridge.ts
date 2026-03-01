/**
 * Provider Bridge — handles HTTP streaming via browser fetch().
 *
 * The WASM core constructs request payloads and parses SSE chunks;
 * this bridge handles the actual network I/O using browser-native
 * fetch() with ReadableStream for SSE streaming.
 */

import { getWasm } from './wasm-loader';

export interface StreamCallbacks {
    onChunk: (text: string) => void;
    onToolCall?: (toolCalls: ToolCallData[]) => void;
    onDone: (fullText: string) => void;
    onError: (error: Error) => void;
}

export interface ToolCallData {
    id: string;
    name: string;
    arguments: string;
}

export interface ProviderConfig {
    provider: string;
    apiKey: string;
    model: string;
    temperature: number;
    apiUrl?: string;
}

/**
 * Send a chat completion request with SSE streaming.
 *
 * Uses WASM core to build the request and parse SSE lines;
 * TypeScript handles the actual fetch() and stream reading.
 */
export async function streamChat(
    messagesJson: string,
    config: ProviderConfig,
    callbacks: StreamCallbacks
): Promise<void> {
    const wasm = getWasm();

    // Build request body in WASM
    const body = wasm.build_provider_request(
        messagesJson,
        config.model,
        config.temperature,
        true // stream = true
    );

    // Resolve base URL
    let baseUrl = config.apiUrl || wasm.provider_base_url(config.provider);
    if (!baseUrl) {
        callbacks.onError(new Error(`No API URL configured for provider: ${config.provider}`));
        return;
    }

    // Build endpoint URL
    const endpoint = `${baseUrl}/chat/completions`;

    // Build headers
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    // Provider-specific auth headers
    if (config.provider === 'anthropic') {
        headers['x-api-key'] = config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
    } else {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    // OpenRouter requires extra headers
    if (config.provider === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'EZ-Claw';
    }

    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers,
            body,
        });

        if (!response.ok) {
            const errorText = await response.text();
            callbacks.onError(
                new Error(`API error ${response.status}: ${errorText}`)
            );
            return;
        }

        if (!response.body) {
            callbacks.onError(new Error('Response body is null'));
            return;
        }

        // Read the SSE stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop() || ''; // Keep incomplete line in buffer

            for (const line of lines) {
                if (!line.trim()) continue;

                try {
                    // Parse SSE line in WASM
                    const chunkJson = wasm.parse_sse_line(line);
                    const chunk = JSON.parse(chunkJson);

                    if (chunk.is_final) {
                        callbacks.onDone(fullText);
                        return;
                    }

                    if (chunk.delta) {
                        fullText += chunk.delta;
                        callbacks.onChunk(chunk.delta);
                    }
                } catch (parseErr) {
                    // Try to parse tool calls from the raw line
                    if (line.startsWith('data: ') && line.includes('tool_calls')) {
                        try {
                            const data = JSON.parse(line.slice(6));
                            const toolCallsJson = wasm.parse_sse_line(
                                `data: ${JSON.stringify(data)}`
                            );
                            // Additional tool call parsing would go here
                        } catch {
                            // Ignore parse errors for non-standard SSE lines
                        }
                    }
                }
            }
        }

        // Stream ended without [DONE]
        callbacks.onDone(fullText);
    } catch (err) {
        callbacks.onError(
            err instanceof Error ? err : new Error(String(err))
        );
    }
}

/**
 * Send a non-streaming chat completion request.
 * Returns the full response text.
 */
export async function chatCompletion(
    messagesJson: string,
    config: ProviderConfig
): Promise<string> {
    const wasm = getWasm();

    const body = wasm.build_provider_request(
        messagesJson,
        config.model,
        config.temperature,
        false // stream = false
    );

    let baseUrl = config.apiUrl || wasm.provider_base_url(config.provider);
    if (!baseUrl) {
        throw new Error(`No API URL configured for provider: ${config.provider}`);
    }

    const endpoint = `${baseUrl}/chat/completions`;

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (config.provider === 'anthropic') {
        headers['x-api-key'] = config.apiKey;
        headers['anthropic-version'] = '2023-06-01';
    } else {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    if (config.provider === 'openrouter') {
        headers['HTTP-Referer'] = window.location.origin;
        headers['X-Title'] = 'EZ-Claw';
    }

    const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    // Extract text from response
    return data.choices?.[0]?.message?.content || '';
}
