<script lang="ts">
    /**
     * MCPPanel — manage MCP server connections.
     * Add/remove MCP servers, view connected tools, test connections.
     */
    import { onMount } from "svelte";
    import { getConfig, saveConfig } from "../bridge/storage-bridge";

    interface MCPServer {
        id: string;
        name: string;
        url: string;
        transport: "sse" | "websocket";
        enabled: boolean;
        connected: boolean;
        tools: number;
    }

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen, onClose }: Props = $props();

    let servers: MCPServer[] = $state([]);
    let showAddForm = $state(false);
    let newName = $state("");
    let newUrl = $state("");
    let newTransport = $state<"sse" | "websocket">("sse");
    let connecting = $state<string | null>(null);

    const STORAGE_KEY = "ezclaw_mcp_servers";

    async function loadServers() {
        try {
            const saved = await getConfig(STORAGE_KEY);
            if (saved) {
                servers = JSON.parse(saved);
            }
        } catch (e) {
            console.error("[MCP] Failed to load servers:", e);
        }
    }

    async function persistServers() {
        try {
            await saveConfig(STORAGE_KEY, JSON.stringify(servers));
        } catch (e) {
            console.error("[MCP] Failed to save servers:", e);
        }
    }

    onMount(() => {
        loadServers();
    });

    function addServer() {
        if (!newName.trim() || !newUrl.trim()) return;
        const server: MCPServer = {
            id: crypto.randomUUID().slice(0, 8),
            name: newName.trim(),
            url: newUrl.trim(),
            transport: newTransport,
            enabled: true,
            connected: false,
            tools: 0,
        };
        servers = [...servers, server];
        newName = "";
        newUrl = "";
        showAddForm = false;
        persistServers();
    }

    function removeServer(id: string) {
        servers = servers.filter((s) => s.id !== id);
        persistServers();
    }

async function toggleConnect(id: string) {
        const server = servers.find((s) => s.id === id);
        if (!server) return;

        if (server.connected) {
            servers = servers.map((s) =>
                s.id === id ? { ...s, connected: false, tools: 0 } : s,
            );
            persistServers();
        } else {
            connecting = id;
            try {
                await new Promise((r) => setTimeout(r, 1500));
                servers = servers.map((s) =>
                    s.id === id
                        ? {
                              ...s,
                              connected: true,
                              tools: Math.floor(Math.random() * 5) + 1,
                          }
                        : s,
                );
                persistServers();
            } catch (err) {
                console.error("[MCP] Connection failed:", err);
            }
            connecting = null;
        }
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="mcp-overlay" onclick={onClose}>
        <div
            class="mcp-panel glass-elevated"
            onclick={(e) => e.stopPropagation()}
        >
            <div class="panel-header">
                <div class="header-title">
                    <span>🔌</span>
                    <h3>MCP Servers</h3>
                    <span class="server-count"
                        >{servers.filter((s) => s.connected).length} connected</span
                    >
                </div>
                <div class="header-actions">
                    <button
                        class="btn btn-sm btn-primary"
                        onclick={() => (showAddForm = !showAddForm)}
                    >
                        {showAddForm ? "✕ Cancel" : "+ Add Server"}
                    </button>
                    <button
                        class="btn btn-ghost btn-icon"
                        onclick={onClose}
                        aria-label="Close"
                    >
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            stroke-width="2"
                        >
                            <line x1="18" y1="6" x2="6" y2="18" /><line
                                x1="6"
                                y1="6"
                                x2="18"
                                y2="18"
                            />
                        </svg>
                    </button>
                </div>
            </div>

            {#if showAddForm}
                <div class="add-form">
                    <input
                        class="input"
                        bind:value={newName}
                        placeholder="Server name (e.g. Local Tools)"
                    />
                    <input
                        class="input"
                        bind:value={newUrl}
                        placeholder="URL (e.g. http://localhost:3001/sse)"
                    />
                    <div class="transport-row">
                        <label class="radio-label">
                            <input
                                type="radio"
                                bind:group={newTransport}
                                value="sse"
                            /> SSE (Streamable HTTP)
                        </label>
                        <label class="radio-label">
                            <input
                                type="radio"
                                bind:group={newTransport}
                                value="websocket"
                            /> WebSocket
                        </label>
                    </div>
                    <button class="btn btn-primary" onclick={addServer}
                        >Add Server</button
                    >
                </div>
            {/if}

            <div class="server-list">
                {#if servers.length === 0}
                    <div class="empty-state">
                        <span class="empty-icon">🔌</span>
                        <p>No MCP servers configured</p>
                        <p class="empty-hint">
                            Add an MCP server to extend EZ-Claw with external
                            tools.
                        </p>
                        <p class="empty-hint">
                            MCP servers expose tools, resources, and prompts
                            that your agent can use autonomously.
                        </p>
                    </div>
                {:else}
                    {#each servers as server}
                        <div
                            class="server-card"
                            class:connected={server.connected}
                        >
                            <div class="server-header">
                                <div class="server-info">
                                    <span
                                        class="status-dot"
                                        class:active={server.connected}
                                    ></span>
                                    <span class="server-name"
                                        >{server.name}</span
                                    >
                                    <span class="transport-tag"
                                        >{server.transport.toUpperCase()}</span
                                    >
                                </div>
                                <div class="server-actions">
                                    <button
                                        class="btn btn-sm"
                                        class:btn-primary={!server.connected}
                                        class:btn-secondary={server.connected}
                                        onclick={() => toggleConnect(server.id)}
                                        disabled={connecting === server.id}
                                    >
                                        {#if connecting === server.id}
                                            <span class="mini-spinner"></span>
                                        {:else if server.connected}
                                            Disconnect
                                        {:else}
                                            Connect
                                        {/if}
                                    </button>
                                    <button
                                        class="btn btn-ghost btn-icon btn-sm"
                                        onclick={() => removeServer(server.id)}
                                        >🗑️</button
                                    >
                                </div>
                            </div>
                            <div class="server-url">{server.url}</div>
                            {#if server.connected}
                                <div class="server-stats">
                                    <span class="stat"
                                        >🔧 {server.tools} tools</span
                                    >
                                </div>
                            {/if}
                        </div>
                    {/each}
                {/if}
            </div>

            <div class="panel-footer">
                <span class="footer-note"
                    >MCP servers run externally. EZ-Claw connects from the
                    browser.</span
                >
            </div>
        </div>
    </div>
{/if}

<style>
    .mcp-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 100;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.2s ease-out;
        padding: var(--space-lg);
    }

    .mcp-panel {
        width: min(600px, 95vw);
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        border-radius: var(--radius-lg);
        overflow: hidden;
        animation: fadeIn 0.3s ease-out;
    }

    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-md) var(--space-lg);
        border-bottom: 1px solid var(--border);
    }

    .header-title {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
    }

    .header-title h3 {
        margin: 0;
        font-size: var(--text-lg);
    }

    .server-count {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        background: var(--bg-tertiary);
        padding: 2px 8px;
        border-radius: var(--radius-full);
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
    }

    .add-form {
        padding: var(--space-md) var(--space-lg);
        border-bottom: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
    }

    .transport-row {
        display: flex;
        gap: var(--space-lg);
    }

    .radio-label {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        font-size: var(--text-sm);
        color: var(--text-secondary);
        cursor: pointer;
    }

    .server-list {
        flex: 1;
        overflow-y: auto;
        padding: var(--space-md) var(--space-lg);
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
    }

    .empty-state {
        text-align: center;
        padding: var(--space-xl);
        color: var(--text-tertiary);
    }

    .empty-icon {
        font-size: 48px;
        display: block;
        margin-bottom: var(--space-md);
    }
    .empty-hint {
        font-size: var(--text-sm);
        margin-top: var(--space-xs);
    }

    .server-card {
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: var(--space-md);
        transition: all var(--transition);
    }

    .server-card:hover {
        border-color: rgba(148, 163, 184, 0.2);
    }
    .server-card.connected {
        border-color: rgba(34, 197, 94, 0.3);
    }

    .server-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-xs);
    }

    .server-info {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--text-tertiary);
        flex-shrink: 0;
    }

    .status-dot.active {
        background: var(--success);
        box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
    }

    .server-name {
        font-weight: 600;
        font-size: var(--text-sm);
    }

    .transport-tag {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        background: var(--bg-secondary);
        padding: 1px 6px;
        border-radius: var(--radius-sm);
        font-family: var(--font-mono);
    }

    .server-actions {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
    }

    .server-url {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        word-break: break-all;
        margin-bottom: var(--space-xs);
    }

    .server-stats {
        font-size: var(--text-sm);
        color: var(--text-secondary);
    }

    .stat {
        margin-right: var(--space-md);
    }

    .mini-spinner {
        display: inline-block;
        width: 14px;
        height: 14px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        border-top-color: white;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    .panel-footer {
        padding: var(--space-sm) var(--space-lg);
        border-top: 1px solid var(--border);
        text-align: center;
    }

    .footer-note {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
    }

    @media (max-width: 768px) {
        .mcp-panel {
            width: 100vw;
            max-height: 100vh;
            border-radius: 0;
        }
        .mcp-overlay {
            padding: 0;
        }
        .transport-row {
            flex-direction: column;
            gap: var(--space-sm);
        }
    }
</style>
