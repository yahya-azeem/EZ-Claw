<script lang="ts">
    import { onMount } from "svelte";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen, onClose }: Props = $props();

    type ChannelType = "telegram" | "discord" | "slack";

    interface ChannelEntry {
        type: ChannelType;
        name: string;
        enabled: boolean;
        status: "disconnected" | "connecting" | "connected" | "error";
        token: string;
        botToken?: string; // Slack needs app + bot token
        botName?: string;
        messageCount: number;
        error?: string;
    }

    let channels: ChannelEntry[] = $state([]);
    let showAddForm = $state(false);
    let addType: ChannelType = $state("telegram");
    let addToken = $state("");
    let addBotToken = $state("");
    let addName = $state("");

    onMount(() => {
        // Load saved channels from localStorage
        try {
            const saved = localStorage.getItem("ezclaw_channels");
            if (saved) channels = JSON.parse(saved);
        } catch {
            /* ignore */
        }
    });

    function saveChannels() {
        // Save without tokens for security (tokens should go through vault)
        const safe = channels.map((c) => ({
            type: c.type,
            name: c.name,
            enabled: c.enabled,
            status: "disconnected" as const,
            token: c.token ? "***" : "",
            botName: c.botName,
            messageCount: c.messageCount,
        }));
        localStorage.setItem("ezclaw_channels", JSON.stringify(safe));
    }

    function addChannel() {
        if (!addToken.trim()) return;

        const entry: ChannelEntry = {
            type: addType,
            name: addName.trim() || `My ${addType} Bot`,
            enabled: false,
            status: "disconnected",
            token: addToken.trim(),
            botToken: addType === "slack" ? addBotToken.trim() : undefined,
            messageCount: 0,
        };

        channels = [...channels, entry];
        showAddForm = false;
        addToken = "";
        addBotToken = "";
        addName = "";
        saveChannels();
    }

    function removeChannel(idx: number) {
        channels = channels.filter((_, i) => i !== idx);
        saveChannels();
    }

    async function toggleChannel(idx: number) {
        const ch = channels[idx];
        if (ch.status === "connected") {
            // Disconnect
            channels[idx] = { ...ch, status: "disconnected", enabled: false };
        } else {
            // Connect
            channels[idx] = { ...ch, status: "connecting", enabled: true };
            // Simulate connection (real connection would use channel-manager.ts)
            setTimeout(() => {
                channels[idx] = {
                    ...channels[idx],
                    status: "connected",
                    botName: `${ch.name} Bot`,
                };
                channels = [...channels];
            }, 1500);
        }
        channels = [...channels];
        saveChannels();
    }

    function getChannelIcon(type: ChannelType): string {
        switch (type) {
            case "telegram":
                return "✈️";
            case "discord":
                return "🎮";
            case "slack":
                return "💼";
        }
    }

    function getChannelColor(type: ChannelType): string {
        switch (type) {
            case "telegram":
                return "#0088cc";
            case "discord":
                return "#5865F2";
            case "slack":
                return "#4A154B";
        }
    }

    function getStatusColor(status: string): string {
        switch (status) {
            case "connected":
                return "#3fb950";
            case "connecting":
                return "#d29922";
            case "error":
                return "#f85149";
            default:
                return "#8b949e";
        }
    }
</script>

{#if isOpen}
    <div class="channels-overlay" onclick={onClose} role="presentation">
        <div
            class="channels-panel glass-elevated"
            onclick={(e) => e.stopPropagation()}
            role="dialog"
        >
            <div class="panel-header">
                <h2>📡 Messaging Channels</h2>
                <button class="close-btn" onclick={onClose} aria-label="Close"
                    >✕</button
                >
            </div>

            <div class="panel-body">
                <div class="section-info">
                    <p>
                        Connect EZ-Claw to messaging platforms. Your agent will
                        respond to messages automatically.
                    </p>
                    <p class="info-note">
                        All connections are 100% client-side — no server
                        required.
                    </p>
                </div>

                {#if channels.length === 0}
                    <div class="empty-state">
                        <div class="empty-icon">📡</div>
                        <p>No channels configured</p>
                        <button
                            class="add-btn primary"
                            onclick={() => (showAddForm = true)}
                        >
                            + Add Channel
                        </button>
                    </div>
                {:else}
                    <div class="channels-list">
                        {#each channels as channel, i}
                            <div
                                class="channel-card"
                                style="--ch-color: {getChannelColor(
                                    channel.type,
                                )}"
                            >
                                <div class="channel-header">
                                    <span class="channel-icon"
                                        >{getChannelIcon(channel.type)}</span
                                    >
                                    <div class="channel-info">
                                        <span class="channel-name"
                                            >{channel.name}</span
                                        >
                                        <span class="channel-type"
                                            >{channel.type}</span
                                        >
                                    </div>
                                    <div
                                        class="channel-status"
                                        style="color: {getStatusColor(
                                            channel.status,
                                        )}"
                                    >
                                        <span
                                            class="status-dot"
                                            style="background: {getStatusColor(
                                                channel.status,
                                            )}"
                                        ></span>
                                        {channel.status}
                                    </div>
                                </div>

                                <div class="channel-details">
                                    {#if channel.botName}
                                        <span class="detail"
                                            >🤖 {channel.botName}</span
                                        >
                                    {/if}
                                    <span class="detail"
                                        >💬 {channel.messageCount} messages</span
                                    >
                                </div>

                                <div class="channel-actions">
                                    <button
                                        class="action-btn"
                                        class:connected={channel.status ===
                                            "connected"}
                                        onclick={() => toggleChannel(i)}
                                    >
                                        {channel.status === "connected"
                                            ? "Disconnect"
                                            : channel.status === "connecting"
                                              ? "Connecting..."
                                              : "Connect"}
                                    </button>
                                    <button
                                        class="action-btn danger"
                                        onclick={() => removeChannel(i)}
                                    >
                                        Remove
                                    </button>
                                </div>
                            </div>
                        {/each}
                    </div>

                    <button
                        class="add-btn"
                        onclick={() => (showAddForm = true)}
                    >
                        + Add Another Channel
                    </button>
                {/if}

                {#if showAddForm}
                    <div class="add-form">
                        <h3>Add Channel</h3>

                        <div class="form-group">
                            <label>Platform</label>
                            <div class="platform-selector">
                                <button
                                    class="platform-btn"
                                    class:active={addType === "telegram"}
                                    onclick={() => (addType = "telegram")}
                                >
                                    ✈️ Telegram
                                </button>
                                <button
                                    class="platform-btn"
                                    class:active={addType === "discord"}
                                    onclick={() => (addType = "discord")}
                                >
                                    🎮 Discord
                                </button>
                                <button
                                    class="platform-btn"
                                    class:active={addType === "slack"}
                                    onclick={() => (addType = "slack")}
                                >
                                    💼 Slack
                                </button>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Bot Name</label>
                            <input
                                type="text"
                                bind:value={addName}
                                placeholder={`My ${addType} Bot`}
                            />
                        </div>

                        <div class="form-group">
                            <label>
                                {#if addType === "telegram"}Bot Token (from
                                    @BotFather)
                                {:else if addType === "discord"}Bot Token (from
                                    Discord Developer Portal)
                                {:else}App-Level Token (xapp-...)
                                {/if}
                            </label>
                            <input
                                type="password"
                                bind:value={addToken}
                                placeholder={addType === "slack"
                                    ? "xapp-1-..."
                                    : "Bot token"}
                            />
                        </div>

                        {#if addType === "slack"}
                            <div class="form-group">
                                <label>Bot OAuth Token (xoxb-...)</label>
                                <input
                                    type="password"
                                    bind:value={addBotToken}
                                    placeholder="xoxb-..."
                                />
                            </div>
                        {/if}

                        <div class="setup-help">
                            {#if addType === "telegram"}
                                <p>
                                    1. Open Telegram, search for <strong
                                        >@BotFather</strong
                                    >
                                </p>
                                <p>
                                    2. Send <code>/newbot</code> and follow the prompts
                                </p>
                                <p>3. Copy the bot token and paste it above</p>
                            {:else if addType === "discord"}
                                <p>
                                    1. Go to <strong
                                        >discord.com/developers</strong
                                    >
                                </p>
                                <p>
                                    2. Create an Application → Bot → Copy Token
                                </p>
                                <p>3. Enable MESSAGE CONTENT intent</p>
                                <p>
                                    4. Invite bot to your server with Messages
                                    permission
                                </p>
                            {:else}
                                <p>
                                    1. Go to <strong>api.slack.com/apps</strong>
                                </p>
                                <p>
                                    2. Create App → Enable Socket Mode → Copy
                                    App Token
                                </p>
                                <p>
                                    3. Install to workspace → Copy Bot OAuth
                                    Token
                                </p>
                            {/if}
                        </div>

                        <div class="form-actions">
                            <button
                                class="cancel-btn"
                                onclick={() => {
                                    showAddForm = false;
                                    addToken = "";
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                class="save-btn"
                                onclick={addChannel}
                                disabled={!addToken.trim()}
                            >
                                Add Channel
                            </button>
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .channels-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-lg);
    }

    .channels-panel {
        width: 100%;
        max-width: 640px;
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        border-radius: var(--radius-lg);
        overflow: hidden;
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-md) var(--space-lg);
        border-bottom: 1px solid var(--border-primary);
    }

    .panel-header h2 {
        margin: 0;
        font-size: var(--text-lg);
    }

    .close-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
    }
    .close-btn:hover {
        color: var(--text-primary);
    }

    .panel-body {
        flex: 1;
        overflow-y: auto;
        padding: var(--space-lg);
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
    }

    .section-info p {
        margin: 0;
        color: var(--text-secondary);
        font-size: var(--text-sm);
    }

    .info-note {
        color: var(--accent-primary) !important;
        font-size: var(--text-xs) !important;
        margin-top: var(--space-xs) !important;
    }

    .empty-state {
        text-align: center;
        padding: var(--space-xl);
        color: var(--text-secondary);
    }

    .empty-icon {
        font-size: 48px;
        margin-bottom: var(--space-md);
    }

    .channels-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
    }

    .channel-card {
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-md);
        padding: var(--space-md);
        border-left: 3px solid var(--ch-color);
    }

    .channel-header {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin-bottom: var(--space-sm);
    }

    .channel-icon {
        font-size: 24px;
    }

    .channel-info {
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    .channel-name {
        font-weight: 600;
        font-size: var(--text-sm);
    }

    .channel-type {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        text-transform: capitalize;
    }

    .channel-status {
        display: flex;
        align-items: center;
        gap: 6px;
        font-size: var(--text-xs);
        text-transform: capitalize;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        display: inline-block;
    }

    .channel-details {
        display: flex;
        gap: var(--space-md);
        margin-bottom: var(--space-sm);
    }

    .detail {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
    }

    .channel-actions {
        display: flex;
        gap: var(--space-sm);
    }

    .action-btn {
        padding: 4px 12px;
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-primary);
        background: var(--bg-tertiary);
        color: var(--text-primary);
        font-size: var(--text-xs);
        cursor: pointer;
    }

    .action-btn:hover {
        background: var(--bg-hover);
    }
    .action-btn.connected {
        color: #f85149;
        border-color: rgba(248, 81, 73, 0.4);
    }
    .action-btn.danger {
        color: #f85149;
    }
    .action-btn.danger:hover {
        background: rgba(248, 81, 73, 0.15);
    }

    .add-btn {
        padding: var(--space-sm) var(--space-md);
        border-radius: var(--radius-md);
        border: 1px dashed var(--border-primary);
        background: none;
        color: var(--text-secondary);
        font-size: var(--text-sm);
        cursor: pointer;
        text-align: center;
    }

    .add-btn:hover {
        border-color: var(--accent-primary);
        color: var(--accent-primary);
    }
    .add-btn.primary {
        border-style: solid;
        background: var(--accent-primary);
        color: white;
        border-color: var(--accent-primary);
    }

    .add-form {
        background: var(--bg-secondary);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-md);
        padding: var(--space-lg);
    }

    .add-form h3 {
        margin: 0 0 var(--space-md);
        font-size: var(--text-md);
    }

    .form-group {
        margin-bottom: var(--space-md);
    }

    .form-group label {
        display: block;
        font-size: var(--text-sm);
        font-weight: 500;
        margin-bottom: var(--space-xs);
        color: var(--text-secondary);
    }

    .form-group input {
        width: 100%;
        padding: var(--space-sm) var(--space-md);
        background: var(--bg-tertiary);
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        font-size: var(--text-sm);
    }

    .form-group input:focus {
        outline: none;
        border-color: var(--accent-primary);
    }

    .platform-selector {
        display: flex;
        gap: var(--space-sm);
    }

    .platform-btn {
        flex: 1;
        padding: var(--space-sm);
        border-radius: var(--radius-sm);
        border: 1px solid var(--border-primary);
        background: var(--bg-tertiary);
        color: var(--text-primary);
        font-size: var(--text-sm);
        cursor: pointer;
        text-align: center;
    }

    .platform-btn:hover {
        border-color: var(--accent-primary);
    }
    .platform-btn.active {
        background: rgba(99, 102, 241, 0.15);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
    }

    .setup-help {
        background: rgba(99, 102, 241, 0.08);
        border-radius: var(--radius-sm);
        padding: var(--space-md);
        margin-bottom: var(--space-md);
    }

    .setup-help p {
        margin: 0 0 var(--space-xs);
        font-size: var(--text-xs);
        color: var(--text-secondary);
    }

    .setup-help code {
        background: rgba(99, 102, 241, 0.2);
        padding: 1px 6px;
        border-radius: 3px;
        font-size: var(--text-xs);
    }

    .form-actions {
        display: flex;
        justify-content: flex-end;
        gap: var(--space-sm);
    }

    .cancel-btn {
        padding: var(--space-sm) var(--space-md);
        background: none;
        border: 1px solid var(--border-primary);
        border-radius: var(--radius-sm);
        color: var(--text-secondary);
        cursor: pointer;
    }

    .save-btn {
        padding: var(--space-sm) var(--space-md);
        background: var(--accent-primary);
        border: none;
        border-radius: var(--radius-sm);
        color: white;
        cursor: pointer;
        font-weight: 600;
    }

    .save-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }
</style>
