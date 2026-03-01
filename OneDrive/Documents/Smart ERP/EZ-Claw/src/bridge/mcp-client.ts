/**
 * MCP Client — browser-based Model Context Protocol client.
 *
 * Connects to MCP servers using Streamable HTTP transport (SSE) or WebSocket.
 * All tool execution goes through the IronClaw security pipeline.
 *
 * MCP Spec: https://spec.modelcontextprotocol.io/
 *
 * Supports:
 * - Tool discovery and execution
 * - Resource listing and reading
 * - Prompt templates
 * - Connection management (multiple servers)
 */

export interface MCPServerConfig {
    id: string;
    name: string;
    url: string;
    transport: 'sse' | 'websocket';
    apiKey?: string;
    enabled: boolean;
}

export interface MCPTool {
    name: string;
    description: string;
    inputSchema: Record<string, any>;
    serverId: string;
}

export interface MCPResource {
    uri: string;
    name: string;
    description?: string;
    mimeType?: string;
    serverId: string;
}

export interface MCPPrompt {
    name: string;
    description?: string;
    arguments?: Array<{ name: string; description?: string; required?: boolean }>;
    serverId: string;
}

interface MCPMessage {
    jsonrpc: '2.0';
    id?: number;
    method?: string;
    params?: any;
    result?: any;
    error?: { code: number; message: string; data?: any };
}

/**
 * Client for a single MCP server connection.
 */
export class MCPConnection {
    readonly config: MCPServerConfig;
    private nextId = 1;
    private tools: MCPTool[] = [];
    private resources: MCPResource[] = [];
    private prompts: MCPPrompt[] = [];
    private connected = false;
    private eventSource: EventSource | null = null;
    private ws: WebSocket | null = null;
    private pendingRequests = new Map<number, {
        resolve: (value: any) => void;
        reject: (reason: any) => void;
    }>();

    constructor(config: MCPServerConfig) {
        this.config = config;
    }

    /**
     * Initialize connection and discover capabilities.
     */
    async connect(): Promise<void> {
        if (this.config.transport === 'websocket') {
            await this.connectWebSocket();
        } else {
            await this.connectSSE();
        }

        // Initialize the session
        const initResult = await this.request('initialize', {
            protocolVersion: '2024-11-05',
            capabilities: {
                tools: {},
                resources: { subscribe: false },
                prompts: {},
            },
            clientInfo: {
                name: 'EZ-Claw',
                version: '0.1.0',
            },
        });

        if (initResult) {
            this.connected = true;
            // Discover tools, resources, prompts
            await this.discoverCapabilities();
        }
    }

    /**
     * Connect via Server-Sent Events (Streamable HTTP).
     */
    private async connectSSE(): Promise<void> {
        const url = this.config.url.endsWith('/sse')
            ? this.config.url
            : `${this.config.url}/sse`;

        return new Promise((resolve, reject) => {
            this.eventSource = new EventSource(url);

            this.eventSource.onopen = () => resolve();

            this.eventSource.onmessage = (event) => {
                try {
                    const message: MCPMessage = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (err) {
                    console.error('[MCP] Parse error:', err);
                }
            };

            this.eventSource.onerror = (err) => {
                if (!this.connected) {
                    reject(new Error(`MCP SSE connection failed: ${this.config.url}`));
                }
            };
        });
    }

    /**
     * Connect via WebSocket.
     */
    private async connectWebSocket(): Promise<void> {
        const url = this.config.url.replace(/^http/, 'ws');

        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => resolve();

            this.ws.onmessage = (event) => {
                try {
                    const message: MCPMessage = JSON.parse(event.data);
                    this.handleMessage(message);
                } catch (err) {
                    console.error('[MCP] Parse error:', err);
                }
            };

            this.ws.onerror = () => {
                if (!this.connected) {
                    reject(new Error(`MCP WebSocket connection failed: ${this.config.url}`));
                }
            };

            this.ws.onclose = () => {
                this.connected = false;
            };
        });
    }

    /**
     * Handle incoming MCP message.
     */
    private handleMessage(message: MCPMessage): void {
        if (message.id !== undefined && this.pendingRequests.has(message.id)) {
            const pending = this.pendingRequests.get(message.id)!;
            this.pendingRequests.delete(message.id);

            if (message.error) {
                pending.reject(new Error(message.error.message));
            } else {
                pending.resolve(message.result);
            }
        }
    }

    /**
     * Send a JSON-RPC request.
     */
    async request(method: string, params?: any): Promise<any> {
        const id = this.nextId++;
        const message: MCPMessage = {
            jsonrpc: '2.0',
            id,
            method,
            params: params || {},
        };

        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });

            // Set timeout
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error(`MCP request timeout: ${method}`));
                }
            }, 30000);

            if (this.config.transport === 'websocket' && this.ws) {
                this.ws.send(JSON.stringify(message));
            } else {
                // For SSE, send via HTTP POST
                const postUrl = this.config.url.replace(/\/sse$/, '');
                const headers: HeadersInit = { 'Content-Type': 'application/json' };
                if (this.config.apiKey) {
                    headers['Authorization'] = `Bearer ${this.config.apiKey}`;
                }

                fetch(postUrl, {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(message),
                })
                    .then((res) => res.json())
                    .then((result) => this.handleMessage(result))
                    .catch((err) => {
                        this.pendingRequests.delete(id);
                        reject(err);
                    });
            }
        });
    }

    /**
     * Discover tools, resources, and prompts from the server.
     */
    private async discoverCapabilities(): Promise<void> {
        try {
            const toolsResult = await this.request('tools/list');
            this.tools = (toolsResult?.tools || []).map((t: any) => ({
                ...t,
                serverId: this.config.id,
            }));
        } catch {
            this.tools = [];
        }

        try {
            const resourcesResult = await this.request('resources/list');
            this.resources = (resourcesResult?.resources || []).map((r: any) => ({
                ...r,
                serverId: this.config.id,
            }));
        } catch {
            this.resources = [];
        }

        try {
            const promptsResult = await this.request('prompts/list');
            this.prompts = (promptsResult?.prompts || []).map((p: any) => ({
                ...p,
                serverId: this.config.id,
            }));
        } catch {
            this.prompts = [];
        }
    }

    /**
     * Call a tool on this server.
     */
    async callTool(name: string, arguments_: Record<string, any>): Promise<any> {
        return this.request('tools/call', { name, arguments: arguments_ });
    }

    /**
     * Read a resource from this server.
     */
    async readResource(uri: string): Promise<any> {
        return this.request('resources/read', { uri });
    }

    /**
     * Get a prompt from this server.
     */
    async getPrompt(name: string, arguments_?: Record<string, any>): Promise<any> {
        return this.request('prompts/get', { name, arguments: arguments_ });
    }

    /**
     * Disconnect from the server.
     */
    disconnect(): void {
        this.connected = false;
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.pendingRequests.clear();
    }

    get isConnected(): boolean {
        return this.connected;
    }

    get availableTools(): MCPTool[] {
        return this.tools;
    }

    get availableResources(): MCPResource[] {
        return this.resources;
    }

    get availablePrompts(): MCPPrompt[] {
        return this.prompts;
    }
}

// ── MCP Manager ──────────────────────────────────────────────────

/**
 * Manages multiple MCP server connections.
 */
export class MCPManager {
    private connections = new Map<string, MCPConnection>();
    private configs: MCPServerConfig[] = [];

    /**
     * Add a server configuration.
     */
    addServer(config: MCPServerConfig): void {
        this.configs.push(config);
    }

    /**
     * Remove a server.
     */
    removeServer(id: string): void {
        const conn = this.connections.get(id);
        if (conn) {
            conn.disconnect();
            this.connections.delete(id);
        }
        this.configs = this.configs.filter((c) => c.id !== id);
    }

    /**
     * Connect to all enabled servers.
     */
    async connectAll(): Promise<Map<string, Error | null>> {
        const results = new Map<string, Error | null>();

        for (const config of this.configs) {
            if (!config.enabled) continue;

            try {
                const conn = new MCPConnection(config);
                await conn.connect();
                this.connections.set(config.id, conn);
                results.set(config.id, null);
            } catch (err) {
                results.set(config.id, err as Error);
                console.error(`[MCP] Failed to connect to ${config.name}:`, err);
            }
        }

        return results;
    }

    /**
     * Get all tools across all connected servers.
     */
    allTools(): MCPTool[] {
        const tools: MCPTool[] = [];
        for (const conn of this.connections.values()) {
            tools.push(...conn.availableTools);
        }
        return tools;
    }

    /**
     * Generate JSON schemas for all MCP tools (for LLM function calling).
     */
    toolSchemas(): any[] {
        return this.allTools().map((tool) => ({
            type: 'function',
            function: {
                name: `mcp_${tool.serverId}_${tool.name}`,
                description: `[MCP: ${tool.serverId}] ${tool.description}`,
                parameters: tool.inputSchema,
            },
        }));
    }

    /**
     * Call an MCP tool by its qualified name (mcp_{serverId}_{toolName}).
     */
    async callTool(qualifiedName: string, arguments_: Record<string, any>): Promise<any> {
        const parts = qualifiedName.replace(/^mcp_/, '').split('_');
        const serverId = parts[0];
        const toolName = parts.slice(1).join('_');

        const conn = this.connections.get(serverId);
        if (!conn) {
            throw new Error(`MCP server not connected: ${serverId}`);
        }

        return conn.callTool(toolName, arguments_);
    }

    /**
     * Disconnect all servers.
     */
    disconnectAll(): void {
        for (const conn of this.connections.values()) {
            conn.disconnect();
        }
        this.connections.clear();
    }

    /**
     * Get connection status for all servers.
     */
    status(): Array<{ id: string; name: string; connected: boolean; tools: number }> {
        return this.configs.map((config) => {
            const conn = this.connections.get(config.id);
            return {
                id: config.id,
                name: config.name,
                connected: conn?.isConnected || false,
                tools: conn?.availableTools.length || 0,
            };
        });
    }

    /**
     * Export configs for persistence (excludes API keys).
     */
    exportConfigs(): string {
        const safe = this.configs.map(({ apiKey, ...rest }) => rest);
        return JSON.stringify(safe);
    }

    /**
     * Import configs from persistence.
     */
    importConfigs(json: string): void {
        try {
            this.configs = JSON.parse(json);
        } catch (err) {
            console.error('[MCP] Config import failed:', err);
        }
    }
}
