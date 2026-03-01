<script lang="ts">
    /**
     * SecurityDashboard — IronClaw-inspired security overview.
     * Shows credential vault status, allowlist editor, leak detection log,
     * prompt injection alerts, tool permission matrix, and audit log.
     */

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen, onClose }: Props = $props();

    let activeTab = $state<"overview" | "allowlist" | "permissions" | "audit">(
        "overview",
    );
    let newDomain = $state("");
    let newDomainLabel = $state("");

    // Simulated state (will connect to WasmAgent/SandboxManager)
    let stats = $state({
        credentialsCount: 0,
        allowlistCount: 12, // Built-in defaults
        leakBlocksCount: 0,
        promptBlocksCount: 0,
        sandboxPolicy: "WorkspaceWrite",
        autonomyLevel: "Semi",
    });

    let allowlistEntries = $state([
        {
            domain: "api.openai.com",
            path: "/v1/*",
            label: "OpenAI",
            builtin: true,
        },
        {
            domain: "api.anthropic.com",
            path: "/v1/*",
            label: "Anthropic",
            builtin: true,
        },
        {
            domain: "api.deepseek.com",
            path: "/*",
            label: "DeepSeek",
            builtin: true,
        },
        {
            domain: "openrouter.ai",
            path: "/api/*",
            label: "OpenRouter",
            builtin: true,
        },
        {
            domain: "generativelanguage.googleapis.com",
            path: "/*",
            label: "Google AI",
            builtin: true,
        },
        {
            domain: "api.duckduckgo.com",
            path: "/*",
            label: "DuckDuckGo",
            builtin: true,
        },
    ]);

    let auditLog = $state([
        {
            tool: "web_search",
            action: "approved",
            details: "Security checks passed",
            time: "2m ago",
        },
        {
            tool: "read_file",
            action: "approved",
            details: "Security checks passed",
            time: "5m ago",
        },
    ]);

    function addDomain() {
        if (!newDomain.trim()) return;
        allowlistEntries = [
            ...allowlistEntries,
            {
                domain: newDomain.trim(),
                path: "/*",
                label: newDomainLabel.trim() || newDomain.trim(),
                builtin: false,
            },
        ];
        newDomain = "";
        newDomainLabel = "";
    }

    function removeDomain(index: number) {
        if (allowlistEntries[index].builtin) return;
        allowlistEntries = allowlistEntries.filter((_, i) => i !== index);
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="sec-overlay" onclick={onClose}>
        <div
            class="sec-panel glass-elevated"
            onclick={(e) => e.stopPropagation()}
        >
            <div class="sec-header">
                <div class="sec-title">
                    <span class="sec-icon">🛡️</span>
                    <h3>IronClaw Security</h3>
                </div>
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

            <!-- Tabs -->
            <div class="sec-tabs">
                <button
                    class="tab"
                    class:active={activeTab === "overview"}
                    onclick={() => (activeTab = "overview")}>Overview</button
                >
                <button
                    class="tab"
                    class:active={activeTab === "allowlist"}
                    onclick={() => (activeTab = "allowlist")}>Allowlist</button
                >
                <button
                    class="tab"
                    class:active={activeTab === "permissions"}
                    onclick={() => (activeTab = "permissions")}
                    >Permissions</button
                >
                <button
                    class="tab"
                    class:active={activeTab === "audit"}
                    onclick={() => (activeTab = "audit")}>Audit Log</button
                >
            </div>

            <div class="sec-body">
                {#if activeTab === "overview"}
                    <div class="overview-grid">
                        <div class="stat-card">
                            <span class="stat-icon">🔐</span>
                            <span class="stat-value"
                                >{stats.credentialsCount}</span
                            >
                            <span class="stat-label">Stored Credentials</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icon">🌐</span>
                            <span class="stat-value"
                                >{stats.allowlistCount}</span
                            >
                            <span class="stat-label">Allowed Domains</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icon">🚫</span>
                            <span class="stat-value"
                                >{stats.leakBlocksCount}</span
                            >
                            <span class="stat-label">Leaks Blocked</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-icon">🛡️</span>
                            <span class="stat-value"
                                >{stats.promptBlocksCount}</span
                            >
                            <span class="stat-label">Injections Blocked</span>
                        </div>
                    </div>

                    <div class="policy-section">
                        <h4>Active Policies</h4>
                        <div class="policy-row">
                            <span class="policy-label">Sandbox Policy</span>
                            <select
                                class="input policy-select"
                                bind:value={stats.sandboxPolicy}
                            >
                                <option value="ReadOnly">🔒 Read Only</option>
                                <option value="WorkspaceWrite"
                                    >📝 Workspace Write</option
                                >
                                <option value="FullAccess"
                                    >⚡ Full Access</option
                                >
                            </select>
                        </div>
                        <div class="policy-row">
                            <span class="policy-label">Autonomy Level</span>
                            <select
                                class="input policy-select"
                                bind:value={stats.autonomyLevel}
                            >
                                <option value="Manual"
                                    >🖐️ Manual (confirm all)</option
                                >
                                <option value="Semi"
                                    >⚖️ Semi (confirm destructive)</option
                                >
                                <option value="Auto"
                                    >🤖 Auto (no confirmation)</option
                                >
                            </select>
                        </div>
                    </div>

                    <div class="pipeline-info">
                        <h4>Security Pipeline</h4>
                        <div class="pipeline-steps">
                            <span class="pipe-step">Permission</span>
                            <span class="pipe-arrow">→</span>
                            <span class="pipe-step">Allowlist</span>
                            <span class="pipe-arrow">→</span>
                            <span class="pipe-step">Leak Scan</span>
                            <span class="pipe-arrow">→</span>
                            <span class="pipe-step">Credential Inject</span>
                            <span class="pipe-arrow">→</span>
                            <span class="pipe-step active-step">Execute</span>
                        </div>
                    </div>
                {:else if activeTab === "allowlist"}
                    <div class="allowlist-section">
                        <div class="add-domain">
                            <input
                                class="input"
                                bind:value={newDomain}
                                placeholder="Domain (e.g. api.example.com)"
                            />
                            <input
                                class="input label-input"
                                bind:value={newDomainLabel}
                                placeholder="Label"
                            />
                            <button
                                class="btn btn-primary btn-sm"
                                onclick={addDomain}>Add</button
                            >
                        </div>
                        <div class="domain-list">
                            {#each allowlistEntries as entry, i}
                                <div
                                    class="domain-entry"
                                    class:builtin={entry.builtin}
                                >
                                    <div class="domain-info">
                                        <span class="domain-name"
                                            >{entry.domain}{entry.path}</span
                                        >
                                        <span class="domain-label"
                                            >{entry.label}</span
                                        >
                                    </div>
                                    {#if entry.builtin}
                                        <span class="badge badge-primary"
                                            >Built-in</span
                                        >
                                    {:else}
                                        <button
                                            class="btn btn-ghost btn-icon btn-sm"
                                            onclick={() => removeDomain(i)}
                                            >✕</button
                                        >
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    </div>
                {:else if activeTab === "permissions"}
                    <div class="permissions-section">
                        <div class="perm-matrix">
                            <div class="perm-header-row">
                                <span class="perm-header">Tool</span>
                                <span class="perm-header">HTTP</span>
                                <span class="perm-header">FS</span>
                                <span class="perm-header">Shell</span>
                                <span class="perm-header">MCP</span>
                            </div>
                            {#each [{ name: "web_search", http: "✅", fs: "❌", shell: "❌", mcp: "❌" }, { name: "web_fetch", http: "✅", fs: "❌", shell: "❌", mcp: "❌" }, { name: "read_file", http: "❌", fs: "✅", shell: "❌", mcp: "❌" }, { name: "write_file", http: "❌", fs: "✅", shell: "❌", mcp: "❌" }, { name: "list_dir", http: "❌", fs: "✅", shell: "❌", mcp: "❌" }, { name: "memory_store", http: "❌", fs: "❌", shell: "❌", mcp: "❌" }, { name: "shell_exec", http: "❌", fs: "⚠️", shell: "⚠️", mcp: "❌" }] as tool}
                                <div class="perm-row">
                                    <span class="perm-tool">{tool.name}</span>
                                    <span class="perm-val">{tool.http}</span>
                                    <span class="perm-val">{tool.fs}</span>
                                    <span class="perm-val">{tool.shell}</span>
                                    <span class="perm-val">{tool.mcp}</span>
                                </div>
                            {/each}
                        </div>
                        <p class="perm-legend">
                            ✅ Allowed &nbsp; ⚠️ Ask &nbsp; ❌ Denied
                        </p>
                    </div>
                {:else if activeTab === "audit"}
                    <div class="audit-section">
                        {#if auditLog.length === 0}
                            <p class="empty-audit">No audit entries yet</p>
                        {:else}
                            {#each auditLog as entry}
                                <div class="audit-entry">
                                    <span class="audit-tool">{entry.tool}</span>
                                    <span
                                        class="audit-action"
                                        class:approved={entry.action ===
                                            "approved"}
                                        class:denied={entry.action === "denied"}
                                        >{entry.action}</span
                                    >
                                    <span class="audit-details"
                                        >{entry.details}</span
                                    >
                                    <span class="audit-time">{entry.time}</span>
                                </div>
                            {/each}
                        {/if}
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .sec-overlay {
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

    .sec-panel {
        width: min(700px, 95vw);
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        border-radius: var(--radius-lg);
        overflow: hidden;
        animation: fadeIn 0.3s ease-out;
    }

    .sec-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-md) var(--space-lg);
        border-bottom: 1px solid var(--border);
    }

    .sec-title {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
    }

    .sec-icon {
        font-size: 20px;
    }
    .sec-header h3 {
        margin: 0;
        font-size: var(--text-lg);
    }

    .sec-tabs {
        display: flex;
        border-bottom: 1px solid var(--border);
        overflow-x: auto;
        flex-shrink: 0;
    }

    .tab {
        padding: var(--space-sm) var(--space-md);
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        color: var(--text-secondary);
        cursor: pointer;
        font-family: var(--font-sans);
        font-size: var(--text-sm);
        transition: all var(--transition);
        white-space: nowrap;
    }

    .tab:hover {
        color: var(--text-primary);
        background: var(--bg-hover);
    }
    .tab.active {
        color: var(--text-accent);
        border-bottom-color: var(--accent-primary);
    }

    .sec-body {
        flex: 1;
        overflow-y: auto;
        padding: var(--space-lg);
    }

    /* Overview */
    .overview-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: var(--space-md);
        margin-bottom: var(--space-lg);
    }

    .stat-card {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: var(--space-md);
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        border: 1px solid var(--border);
        text-align: center;
        gap: var(--space-xs);
    }

    .stat-icon {
        font-size: 24px;
    }
    .stat-value {
        font-size: var(--text-xl);
        font-weight: 700;
        color: var(--text-primary);
    }
    .stat-label {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
    }

    .policy-section {
        margin-bottom: var(--space-lg);
    }
    .policy-section h4,
    .pipeline-info h4 {
        font-size: var(--text-base);
        margin-bottom: var(--space-sm);
        color: var(--text-secondary);
    }

    .policy-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-sm) 0;
        gap: var(--space-md);
    }

    .policy-label {
        font-size: var(--text-sm);
        color: var(--text-secondary);
    }
    .policy-select {
        max-width: 240px;
        font-size: var(--text-sm);
    }

    .pipeline-steps {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        flex-wrap: wrap;
        padding: var(--space-md);
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        border: 1px solid var(--border);
    }

    .pipe-step {
        padding: var(--space-xs) var(--space-sm);
        border-radius: var(--radius-sm);
        background: var(--bg-secondary);
        font-size: var(--text-xs);
        font-weight: 500;
        color: var(--text-secondary);
        border: 1px solid var(--border);
    }

    .pipe-step.active-step {
        background: rgba(59, 130, 246, 0.15);
        color: var(--text-accent);
        border-color: var(--accent-primary);
    }

    .pipe-arrow {
        color: var(--text-tertiary);
        font-size: var(--text-sm);
    }

    /* Allowlist */
    .add-domain {
        display: flex;
        gap: var(--space-sm);
        margin-bottom: var(--space-md);
    }

    .label-input {
        max-width: 120px;
    }

    .domain-list {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }

    .domain-entry {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-sm);
        transition: background var(--transition);
    }

    .domain-entry:hover {
        background: var(--bg-hover);
    }

    .domain-info {
        display: flex;
        flex-direction: column;
        min-width: 0;
    }
    .domain-name {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--text-primary);
    }
    .domain-label {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
    }

    /* Permissions */
    .perm-matrix {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .perm-header-row,
    .perm-row {
        display: grid;
        grid-template-columns: 2fr 1fr 1fr 1fr 1fr;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        align-items: center;
    }

    .perm-header-row {
        border-bottom: 1px solid var(--border);
    }
    .perm-header {
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--text-tertiary);
        text-transform: uppercase;
    }

    .perm-row:hover {
        background: var(--bg-hover);
        border-radius: var(--radius-sm);
    }
    .perm-tool {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        color: var(--text-primary);
    }
    .perm-val {
        font-size: var(--text-sm);
        text-align: center;
    }

    .perm-legend {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        margin-top: var(--space-md);
        text-align: center;
    }

    /* Audit */
    .audit-entry {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-sm);
        font-size: var(--text-sm);
    }

    .audit-entry:hover {
        background: var(--bg-hover);
    }
    .audit-tool {
        font-family: var(--font-mono);
        font-weight: 500;
        min-width: 100px;
    }
    .audit-action {
        font-size: var(--text-xs);
        font-weight: 500;
        text-transform: uppercase;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
    }
    .audit-action.approved {
        background: rgba(34, 197, 94, 0.15);
        color: var(--success);
    }
    .audit-action.denied {
        background: rgba(239, 68, 68, 0.15);
        color: var(--error);
    }
    .audit-details {
        flex: 1;
        color: var(--text-secondary);
    }
    .audit-time {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        flex-shrink: 0;
    }

    .empty-audit {
        text-align: center;
        color: var(--text-tertiary);
        padding: var(--space-xl);
    }

    @media (max-width: 768px) {
        .sec-panel {
            width: 100vw;
            max-height: 100vh;
            border-radius: 0;
        }
        .sec-overlay {
            padding: 0;
        }
        .overview-grid {
            grid-template-columns: repeat(2, 1fr);
        }
        .add-domain {
            flex-direction: column;
        }
        .label-input {
            max-width: 100%;
        }
    }
</style>
