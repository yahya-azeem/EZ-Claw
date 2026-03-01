/**
 * Tool Runtime Bridge — routes WASM tool calls through the security pipeline.
 *
 * This is the execution layer that sits between the WASM agent engine and browser APIs.
 * All tool execution follows IronClaw's security pipeline:
 *
 *   WASM Agent → check_tool_security() → TS Bridge Executes → secure_tool_response() → WASM Agent
 *
 * Built-in tools:
 * - web_search: DuckDuckGo search (free, no key)
 * - web_fetch: Fetch URL content
 * - read_file / write_file / list_dir: Workspace FS operations
 * - memory_store / memory_recall: Persistent memory
 * - shell_exec: Sandboxed shell (requires permission)
 */

import type { WasmAgent, WasmAgentLoop, WasmWorkspace } from './wasm-loader';
import { storeMemory, recallMemories, listMemories } from './memory-bridge';
import { setFact, loadIdentity, updateIdentityField, saveIdentity, type AgentIdentity } from './identity-bridge';

export interface ToolCallRequest {
    id: string;
    name: string;
    arguments: string;
}

export interface ToolCallResult {
    call_id: string;
    success: boolean;
    output: string;
    error?: string;
    duration_ms: number;
}

export interface SecurityCheckResult {
    approved: boolean;
    rejection_reason?: string;
    needs_confirmation: boolean;
    confirmation_prompt?: string;
    credential_mapping?: {
        credential_id: string;
        inject_type: string;
        inject_key: string;
        inject_prefix: string;
    };
    warnings: string[];
    sanitized_body?: string;
}

/**
 * Execute a tool call through the full security pipeline.
 */
export async function executeToolCall(
    agent: WasmAgent,
    workspace: WasmWorkspace,
    toolCall: ToolCallRequest,
    onConfirmationNeeded?: (prompt: string) => Promise<boolean>
): Promise<ToolCallResult> {
    const startTime = performance.now();
    let args: Record<string, any>;

    try {
        args = JSON.parse(toolCall.arguments);
    } catch {
        return {
            call_id: toolCall.id,
            success: false,
            output: '',
            error: `Invalid tool arguments: ${toolCall.arguments}`,
            duration_ms: 0,
        };
    }

    // ─── Step 1: Security Check ───
    const targetUrl = args.url || '';
    const secCheckJson = agent.check_tool_security(toolCall.name, toolCall.arguments, targetUrl);
    const secCheck: SecurityCheckResult = JSON.parse(secCheckJson);

    if (!secCheck.approved && !secCheck.needs_confirmation) {
        return {
            call_id: toolCall.id,
            success: false,
            output: '',
            error: `Security: ${secCheck.rejection_reason || 'Denied'}`,
            duration_ms: performance.now() - startTime,
        };
    }

    if (secCheck.needs_confirmation && onConfirmationNeeded) {
        const confirmed = await onConfirmationNeeded(secCheck.confirmation_prompt || 'Allow this action?');
        if (!confirmed) {
            return {
                call_id: toolCall.id,
                success: false,
                output: '',
                error: 'User denied tool execution',
                duration_ms: performance.now() - startTime,
            };
        }
    }

    // ─── Step 2: Execute Tool ───
    let rawOutput: string;
    try {
        rawOutput = await dispatchTool(toolCall.name, args, workspace, secCheck);
    } catch (err: any) {
        return {
            call_id: toolCall.id,
            success: false,
            output: '',
            error: err.message || String(err),
            duration_ms: performance.now() - startTime,
        };
    }

    // ─── Step 3: Security Response Check ───
    const secResponseJson = agent.secure_tool_response(toolCall.name, rawOutput);
    const secResponse = JSON.parse(secResponseJson);

    // Log warnings to console
    if (secResponse.warnings?.length) {
        console.warn('[EZ-Claw Security]', secResponse.warnings);
    }

    return {
        call_id: toolCall.id,
        success: true,
        output: secResponse.output || rawOutput,
        duration_ms: performance.now() - startTime,
    };
}

/**
 * Dispatch to the appropriate tool handler.
 */
async function dispatchTool(
    name: string,
    args: Record<string, any>,
    workspace: WasmWorkspace,
    secCheck: SecurityCheckResult
): Promise<string> {
    switch (name) {
        case 'web_search':
            return await toolWebSearch(args.query, args.max_results || 5, secCheck);

        case 'web_fetch':
            return await toolWebFetch(args.url, secCheck);

        case 'read_file':
            return toolReadFile(workspace, args.path);

        case 'write_file':
            return toolWriteFile(workspace, args.path, args.content);

        case 'list_dir':
            return toolListDir(workspace, args.path || '/');

        case 'memory_store': {
            const key = args.key || `mem-${Date.now()}`;
            const content = args.content || args.value || '';
            const category = args.category || 'core';
            try {
                storeMemory(key, content, category);
                return `Memory stored: key="${key}", category="${category}", content="${content.slice(0, 100)}..."}`;
            } catch (e: any) {
                return `Memory store failed: ${e.message}`;
            }
        }

        case 'memory_recall': {
            const query = args.query || '';
            const limit = args.limit || 5;
            try {
                const results = recallMemories(query, limit);
                if (results.length === 0) return `No memories found for: "${query}"`;
                return results.map(m =>
                    `[${m.category}] ${m.key}: ${m.content} (score: ${(m.score || 0).toFixed(2)})`
                ).join('\n');
            } catch (e: any) {
                return `Memory recall failed: ${e.message}`;
            }
        }

        case 'update_identity': {
            const identity = loadIdentity();
            if (args.name) {
                identity.name = args.name;
                identity.facts['name'] = args.name;
            }
            if (args.personality) {
                identity.personality = args.personality;
            }
            if (args.instructions) {
                identity.instructions = args.instructions;
            }
            if (args.fact_key && args.fact_value) {
                identity.facts[args.fact_key] = args.fact_value;
            }
            saveIdentity(identity);
            // Also store in memory for cross-chat recall
            try {
                if (args.name) storeMemory('identity_name', `My name is ${args.name}`, 'identity');
                if (args.fact_key) storeMemory(`identity_${args.fact_key}`, args.fact_value, 'identity');
            } catch { /* silent */ }
            return `Identity updated: ${JSON.stringify(identity, null, 2)}`;
        }

        case 'shell_exec':
            return `Shell execution not available in current sandbox mode. Configure native CLI companion for shell access.`;

        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}

// ── Built-in Tool Implementations ────────────────────────────────

/**
 * Web search via DuckDuckGo HTML (free, no API key needed).
 */
async function toolWebSearch(
    query: string,
    maxResults: number,
    secCheck: SecurityCheckResult
): Promise<string> {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;

    const headers: HeadersInit = {};

    // Inject credentials if mapped
    if (secCheck.credential_mapping) {
        const cm = secCheck.credential_mapping;
        if (cm.inject_type === 'header') {
            // Credentials would be decrypted and injected here by the WASM vault
            // For DuckDuckGo this isn't needed (free API)
        }
    }

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const results: string[] = [];

    // Abstract (instant answer)
    if (data.Abstract) {
        results.push(`**Summary**: ${data.Abstract}\nSource: ${data.AbstractURL}`);
    }

    // Related topics
    if (data.RelatedTopics) {
        for (const topic of data.RelatedTopics.slice(0, maxResults)) {
            if (topic.Text) {
                results.push(`- ${topic.Text}${topic.FirstURL ? ` (${topic.FirstURL})` : ''}`);
            }
        }
    }

    if (results.length === 0) {
        return `No results found for: "${query}"`;
    }

    return results.join('\n\n');
}

/**
 * Fetch URL content.
 */
async function toolWebFetch(url: string, secCheck: SecurityCheckResult): Promise<string> {
    const headers: HeadersInit = {};

    // Inject credentials at boundary (IronClaw pattern)
    if (secCheck.credential_mapping) {
        const cm = secCheck.credential_mapping;
        if (cm.inject_type === 'header') {
            // In production, decrypt from vault and inject:
            // headers[cm.inject_key] = cm.inject_prefix + decryptedValue;
        }
    }

    const response = await fetch(url, { headers });
    if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const data = await response.json();
        return JSON.stringify(data, null, 2).slice(0, 10000);
    }

    const text = await response.text();
    // Strip HTML tags for cleaner output
    const cleaned = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return cleaned.slice(0, 10000);
}

/**
 * Read file from workspace.
 */
function toolReadFile(workspace: WasmWorkspace, path: string): string {
    try {
        return workspace.read_file(path);
    } catch (e: any) {
        throw new Error(`read_file: ${e.message || e}`);
    }
}

/**
 * Write file to workspace.
 */
function toolWriteFile(workspace: WasmWorkspace, path: string, content: string): string {
    try {
        workspace.write_file(path, content);
        return `File written: ${path} (${content.length} bytes)`;
    } catch (e: any) {
        throw new Error(`write_file: ${e.message || e}`);
    }
}

/**
 * List directory in workspace.
 */
function toolListDir(workspace: WasmWorkspace, path: string): string {
    const json = workspace.list_dir(path);
    const entries = JSON.parse(json);
    if (entries.error) {
        throw new Error(`list_dir: ${entries.error}`);
    }

    if (entries.length === 0) {
        return `(empty directory)`;
    }

    return entries
        .map((e: any) => `${e.is_dir ? '📁' : '📄'} ${e.name}${e.is_dir ? '/' : ` (${e.size}b)`}`)
        .join('\n');
}
