<script lang="ts">
    /**
     * ToolCallBubble — collapsible tool execution card.
     * Shows tool name, status, arguments, and result with permission confirm/deny buttons.
     */

    interface Props {
        toolName: string;
        arguments: string;
        status:
            | "pending"
            | "running"
            | "success"
            | "error"
            | "denied"
            | "waiting";
        result?: string;
        error?: string;
        durationMs?: number;
        needsConfirmation?: boolean;
        confirmationPrompt?: string;
        warnings?: string[];
        onConfirm?: () => void;
        onDeny?: () => void;
    }

    let {
        toolName,
        arguments: toolArgs,
        status,
        result,
        error,
        durationMs,
        needsConfirmation = false,
        confirmationPrompt,
        warnings = [],
        onConfirm,
        onDeny,
    }: Props = $props();

    let expanded = $state(false);

    const TOOL_ICONS: Record<string, string> = {
        web_search: "🔍",
        web_fetch: "🌐",
        read_file: "📄",
        write_file: "✏️",
        list_dir: "📁",
        memory_store: "💾",
        memory_recall: "🧠",
        shell_exec: "⚡",
    };

    const STATUS_COLORS: Record<string, string> = {
        pending: "var(--text-tertiary)",
        running: "var(--accent-primary)",
        success: "var(--success)",
        error: "var(--error)",
        denied: "var(--warning)",
        waiting: "var(--warning)",
    };

    function formatDuration(ms: number): string {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    }

    function formatArgs(args: string): string {
        try {
            return JSON.stringify(JSON.parse(args), null, 2);
        } catch {
            return args;
        }
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="tool-call" class:expanded class:has-warning={warnings.length > 0}>
    <div class="tool-header" onclick={() => (expanded = !expanded)}>
        <div class="tool-icon">{TOOL_ICONS[toolName] || "🔧"}</div>
        <div class="tool-info">
            <span class="tool-name">{toolName}</span>
            <span class="tool-status" style:color={STATUS_COLORS[status]}>
                {#if status === "running"}
                    <span class="pulse-dot"></span>
                {/if}
                {status}
                {#if durationMs}
                    <span class="duration">({formatDuration(durationMs)})</span>
                {/if}
            </span>
        </div>
        <div class="expand-icon" class:rotated={expanded}>
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
            >
                <polyline points="6 9 12 15 18 9" />
            </svg>
        </div>
    </div>

    {#if needsConfirmation && status === "waiting"}
        <div class="confirmation-bar">
            <span class="confirm-prompt"
                >{confirmationPrompt || `Allow ${toolName}?`}</span
            >
            <div class="confirm-actions">
                <button class="btn btn-sm confirm-allow" onclick={onConfirm}
                    >✓ Allow</button
                >
                <button class="btn btn-sm confirm-deny" onclick={onDeny}
                    >✗ Deny</button
                >
            </div>
        </div>
    {/if}

    {#if warnings.length > 0}
        <div class="warnings">
            {#each warnings as warning}
                <div class="warning-item">{warning}</div>
            {/each}
        </div>
    {/if}

    {#if expanded}
        <div class="tool-details">
            <div class="detail-section">
                <span class="detail-label">Arguments</span>
                <pre class="detail-code">{formatArgs(toolArgs)}</pre>
            </div>
            {#if result}
                <div class="detail-section">
                    <span class="detail-label">Result</span>
                    <pre class="detail-code result-code">{result.slice(
                            0,
                            2000,
                        )}{result.length > 2000 ? "..." : ""}</pre>
                </div>
            {/if}
            {#if error}
                <div class="detail-section">
                    <span class="detail-label error-label">Error</span>
                    <pre class="detail-code error-code">{error}</pre>
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    .tool-call {
        margin: var(--space-sm) 0;
        border-radius: var(--radius-md);
        background: rgba(30, 41, 59, 0.5);
        border: 1px solid var(--border);
        overflow: hidden;
        transition: all var(--transition);
        animation: fadeIn 0.3s ease-out;
    }

    .tool-call:hover {
        border-color: rgba(148, 163, 184, 0.2);
    }

    .tool-call.has-warning {
        border-color: rgba(245, 158, 11, 0.3);
    }

    .tool-header {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        cursor: pointer;
        user-select: none;
        transition: background var(--transition);
    }

    .tool-header:hover {
        background: var(--bg-hover);
    }

    .tool-icon {
        font-size: 18px;
        flex-shrink: 0;
    }

    .tool-info {
        flex: 1;
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        min-width: 0;
    }

    .tool-name {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--text-primary);
    }

    .tool-status {
        font-size: var(--text-xs);
        display: flex;
        align-items: center;
        gap: 4px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .pulse-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--accent-primary);
        animation: pulse 1s ease-in-out infinite;
    }

    .duration {
        color: var(--text-tertiary);
        text-transform: none;
        letter-spacing: 0;
    }

    .expand-icon {
        transition: transform var(--transition);
        color: var(--text-tertiary);
        flex-shrink: 0;
    }

    .expand-icon.rotated {
        transform: rotate(180deg);
    }

    .confirmation-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-sm) var(--space-md);
        background: rgba(245, 158, 11, 0.08);
        border-top: 1px solid rgba(245, 158, 11, 0.2);
        gap: var(--space-sm);
    }

    .confirm-prompt {
        font-size: var(--text-sm);
        color: var(--warning);
    }

    .confirm-actions {
        display: flex;
        gap: var(--space-xs);
        flex-shrink: 0;
    }

    .confirm-allow {
        background: var(--success);
        color: white;
        border: none;
        border-radius: var(--radius-sm);
    }

    .confirm-deny {
        background: var(--error);
        color: white;
        border: none;
        border-radius: var(--radius-sm);
    }

    .warnings {
        padding: var(--space-xs) var(--space-md);
        border-top: 1px solid rgba(245, 158, 11, 0.15);
    }

    .warning-item {
        font-size: var(--text-xs);
        color: var(--warning);
        padding: 2px 0;
    }

    .tool-details {
        padding: var(--space-sm) var(--space-md);
        border-top: 1px solid var(--border);
        animation: fadeIn 0.2s ease-out;
    }

    .detail-section {
        margin-bottom: var(--space-sm);
    }

    .detail-section:last-child {
        margin-bottom: 0;
    }

    .detail-label {
        font-size: var(--text-xs);
        font-weight: 500;
        color: var(--text-tertiary);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: block;
        margin-bottom: var(--space-xs);
    }

    .error-label {
        color: var(--error);
    }

    .detail-code {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        background: var(--bg-secondary);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        padding: var(--space-sm);
        overflow-x: auto;
        max-height: 200px;
        overflow-y: auto;
        white-space: pre-wrap;
        word-break: break-all;
        line-height: 1.5;
        margin: 0;
    }

    .result-code {
        border-color: rgba(34, 197, 94, 0.2);
    }

    .error-code {
        border-color: rgba(239, 68, 68, 0.2);
        color: var(--error);
    }
</style>
