<script lang="ts">
    import { onMount, onDestroy, tick } from "svelte";
    import {
        SandboxManager,
        type SandboxTier,
        type ShellResult,
    } from "../bridge/sandbox-manager";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen, onClose }: Props = $props();

    let lines: Array<{
        text: string;
        type: "input" | "stdout" | "stderr" | "info";
    }> = $state([]);
    let inputText = $state("");
    let currentTier: SandboxTier = $state("container2wasm");
    let isExecuting = $state(false);
    let containerBooting = $state(false);
    let containerReady = $state(false);
    let nativeUrl = $state("ws://localhost:9229");
    let showTierMenu = $state(false);
    let terminalEl: HTMLDivElement | undefined = $state();
    let inputEl: HTMLInputElement | undefined = $state();

    let manager: SandboxManager | null = null;
    let cleanups: (() => void)[] = [];

    onMount(() => {
        // Use the singleton so we get a C2WRuntime attached
        manager = SandboxManager.getInstance();

        // Listen for terminal output from sandbox
        manager.onOutput((line) => {
            if (line.includes("\x1b[31m")) {
                lines = [
                    ...lines,
                    { text: line.replace(/\x1b\[\d+m/g, ""), type: "stderr" },
                ];
            } else {
                lines = [...lines, { text: line, type: "stdout" }];
            }
            scrollToBottom();
        });

        // Subscribe to container lifecycle events
        const offProgress = manager.onC2WEvent("c2w:progress", (data: any) => {
            if (data?.loaded && data?.total) {
                const pct = Math.round((data.loaded / data.total) * 100);
                const mb = (data.loaded / 1024 / 1024).toFixed(1);
                const totalMb = (data.total / 1024 / 1024).toFixed(1);
                // Update last progress line instead of appending
                const progressIdx = lines.findIndex(
                    (l) => l.type === "info" && l.text.startsWith("⏳ Downloading"),
                );
                const progressLine = {
                    text: `⏳ Downloading container... ${mb}MB / ${totalMb}MB (${pct}%)`,
                    type: "info" as const,
                };
                if (progressIdx >= 0) {
                    lines = lines.map((l, i) =>
                        i === progressIdx ? progressLine : l,
                    );
                } else {
                    lines = [...lines, progressLine];
                }
                scrollToBottom();
            }
        });
        cleanups.push(offProgress);

        const offReady = manager.onC2WEvent("c2w:ready", () => {
            containerBooting = false;
            containerReady = true;
            lines = [
                ...lines,
                {
                    text: "✅ Linux container ready! Full Alpine Linux sandbox active.",
                    type: "info",
                },
                { text: "", type: "info" },
            ];
            scrollToBottom();
        });
        cleanups.push(offReady);

        const offError = manager.onC2WEvent("c2w:error", (data: any) => {
            containerBooting = false;
            lines = [
                ...lines,
                {
                    text: `❌ Container error: ${data?.error || "Unknown error"}. Falling back to BusyBox shell.`,
                    type: "stderr",
                },
            ];
            scrollToBottom();
        });
        cleanups.push(offError);

        // Welcome message
        lines = [
            { text: "🦀 EZ-Claw Terminal — Secure Sandbox", type: "info" },
            {
                text: 'Type "help" for available commands. Use tier selector to switch sandbox mode.',
                type: "info",
            },
            { text: "", type: "info" },
        ];

        // Auto-boot the container
        if (!manager.isContainerBooted) {
            containerBooting = true;
            lines = [
                ...lines,
                {
                    text: "🐧 Booting Alpine Linux container...",
                    type: "info",
                },
            ];
            manager.bootContainer().catch((err) => {
                containerBooting = false;
                lines = [
                    ...lines,
                    {
                        text: `❌ Failed to boot container: ${err.message}. Using BusyBox fallback.`,
                        type: "stderr",
                    },
                ];
            });
        } else {
            containerReady = true;
            lines = [
                ...lines,
                {
                    text: "✅ Linux container already running.",
                    type: "info",
                },
            ];
        }
    });

    onDestroy(() => {
        for (const cleanup of cleanups) cleanup();
        cleanups = [];
    });

    function scrollToBottom() {
        tick().then(() => {
            if (terminalEl) terminalEl.scrollTop = terminalEl.scrollHeight;
        });
    }

    async function executeCommand() {
        const cmd = inputText.trim();
        if (!cmd || isExecuting || !manager) return;

        lines = [...lines, { text: `$ ${cmd}`, type: "input" }];
        inputText = "";
        isExecuting = true;

        // Clear command
        if (cmd === "clear") {
            lines = [];
            isExecuting = false;
            return;
        }

        try {
            const result = await manager.execute(cmd);
            // Output is emitted via onOutput listener
            if (result.timedOut) {
                lines = [
                    ...lines,
                    { text: `⏱ Command timed out`, type: "stderr" },
                ];
            }
        } catch (err: any) {
            lines = [
                ...lines,
                { text: `Error: ${err.message}`, type: "stderr" },
            ];
        }

        isExecuting = false;
        scrollToBottom();
        inputEl?.focus();
    }

    async function changeTier(tier: SandboxTier) {
        if (!manager) return;
        currentTier = tier;
        manager.setTier(tier);
        showTierMenu = false;

        const status = manager.getStatus();
        lines = [
            ...lines,
            { text: `Switched to ${status.info}`, type: "info" },
        ];

        if (tier === "container2wasm" && !manager.isContainerBooted) {
            containerBooting = true;
            lines = [
                ...lines,
                { text: "🐧 Booting Alpine Linux container...", type: "info" },
            ];
            try {
                await manager.bootContainer();
            } catch (err: any) {
                containerBooting = false;
                lines = [
                    ...lines,
                    {
                        text: `❌ Failed to boot: ${err.message}. Using BusyBox fallback.`,
                        type: "stderr",
                    },
                ];
            }
        }

        if (tier === "native" && !manager.isNativeConnected) {
            lines = [
                ...lines,
                { text: "Connecting to native CLI companion...", type: "info" },
            ];
            try {
                await manager.connectNative(nativeUrl);
                lines = [
                    ...lines,
                    {
                        text: "✅ Connected to native CLI companion!",
                        type: "info",
                    },
                ];
            } catch {
                lines = [
                    ...lines,
                    {
                        text: "❌ Failed to connect. Install: npm i -g ezclaw-node && ezclaw-node",
                        type: "stderr",
                    },
                ];
            }
        }
    }

    function handleKeydown(e: KeyboardEvent) {
        if (e === null) return;
        if (e.key === "Enter") {
            e.preventDefault();
            executeCommand();
        }
    }
</script>

{#if isOpen}
    <div class="terminal-overlay" onclick={onClose} role="presentation">
        <div
            class="terminal-panel glass-elevated"
            onclick={(e) => e.stopPropagation()}
            role="dialog"
        >
            <div class="terminal-header">
                <div class="header-left">
                    <span class="terminal-title">🖥️ Terminal</span>
                    <div class="tier-selector">
                        <button
                            class="tier-btn"
                            onclick={() => (showTierMenu = !showTierMenu)}
                        >
                            {currentTier.toUpperCase()}
                            {#if currentTier === "container2wasm"}
                                <span class="status-dot" class:ready={containerReady} class:booting={containerBooting}></span>
                            {/if}
                            <svg
                                width="12"
                                height="12"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                stroke-width="2"
                            >
                                <polyline points="6 9 12 15 18 9" />
                            </svg>
                        </button>
                        {#if showTierMenu}
                            <div class="tier-menu">
                                <button
                                    class="tier-option"
                                    class:active={currentTier ===
                                        "container2wasm"}
                                    onclick={() => changeTier("container2wasm")}
                                >
                                    <span class="tier-icon">🐧</span> Alpine
                                    (Full OS)
                                    <span class="tier-desc"
                                        >Real Linux sandbox</span
                                    >
                                </button>
                                <button
                                    class="tier-option"
                                    class:active={currentTier === "wasi"}
                                    onclick={() => changeTier("wasi")}
                                >
                                    <span class="tier-icon">🌐</span> Shell
                                    <span class="tier-desc"
                                        >Lightweight fallback</span
                                    >
                                </button>
                                <button
                                    class="tier-option"
                                    class:active={currentTier === "native"}
                                    onclick={() => changeTier("native")}
                                >
                                    <span class="tier-icon">💻</span> Native CLI
                                    <span class="tier-desc"
                                        >Host shell (companion)</span
                                    >
                                </button>
                            </div>
                        {/if}
                    </div>
                </div>
                <button class="close-btn" onclick={onClose} aria-label="Close"
                    >✕</button
                >
            </div>

            <div class="terminal-body" bind:this={terminalEl}>
                {#each lines as line}
                    <div class="terminal-line {line.type}">
                        {line.text}
                    </div>
                {/each}
                {#if isExecuting}
                    <div class="terminal-line info">⏳ Executing...</div>
                {/if}
            </div>

            <div class="terminal-input-area">
                <span class="prompt">$</span>
                <input
                    type="text"
                    class="terminal-input"
                    bind:this={inputEl}
                    bind:value={inputText}
                    onkeydown={handleKeydown}
                    placeholder="Type a command..."
                    disabled={isExecuting}
                />
            </div>
        </div>
    </div>
{/if}

<style>
    .terminal-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        padding: var(--space-lg);
    }

    .terminal-panel {
        width: 100%;
        max-width: 900px;
        height: 500px;
        display: flex;
        flex-direction: column;
        background: #0d1117;
        border-radius: var(--radius-lg);
        border: 1px solid rgba(99, 102, 241, 0.3);
        overflow: hidden;
    }

    .terminal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-sm) var(--space-md);
        background: #161b22;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: var(--space-md);
    }

    .terminal-title {
        font-weight: 600;
        color: #e6edf3;
        font-size: var(--text-sm);
    }

    .tier-selector {
        position: relative;
    }

    .tier-btn {
        background: rgba(99, 102, 241, 0.2);
        border: 1px solid rgba(99, 102, 241, 0.4);
        border-radius: var(--radius-sm);
        color: var(--accent-primary);
        padding: 4px 10px;
        font-size: var(--text-xs);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
        font-weight: 600;
        letter-spacing: 0.05em;
    }

    .tier-menu {
        position: absolute;
        top: 100%;
        left: 0;
        margin-top: 4px;
        background: #1c2128;
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: var(--radius-md);
        overflow: hidden;
        z-index: 10;
        min-width: 200px;
    }

    .tier-option {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        width: 100%;
        padding: var(--space-sm) var(--space-md);
        background: none;
        border: none;
        color: #e6edf3;
        cursor: pointer;
        font-size: var(--text-sm);
        text-align: left;
    }

    .tier-option:hover {
        background: rgba(99, 102, 241, 0.15);
    }
    .tier-option.active {
        background: rgba(99, 102, 241, 0.25);
    }

    .tier-desc {
        margin-left: auto;
        font-size: var(--text-xs);
        color: #8b949e;
    }

    .close-btn {
        background: none;
        border: none;
        color: #8b949e;
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
    }
    .close-btn:hover {
        color: #e6edf3;
    }

    .terminal-body {
        flex: 1;
        overflow-y: auto;
        padding: var(--space-md);
        font-family: "JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas",
            monospace;
        font-size: 13px;
        line-height: 1.5;
    }

    .terminal-line {
        white-space: pre-wrap;
        word-break: break-word;
    }

    .terminal-line.input {
        color: #58a6ff;
    }
    .terminal-line.stdout {
        color: #e6edf3;
    }
    .terminal-line.stderr {
        color: #f85149;
    }
    .terminal-line.info {
        color: #8b949e;
    }

    .terminal-input-area {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: #0d1117;
    }

    .prompt {
        color: #3fb950;
        font-family: "JetBrains Mono", "Fira Code", monospace;
        font-weight: 700;
        font-size: 14px;
    }

    .terminal-input {
        flex: 1;
        background: none;
        border: none;
        color: #e6edf3;
        font-family: "JetBrains Mono", "Fira Code", monospace;
        font-size: 13px;
        outline: none;
    }

    .terminal-input::placeholder {
        color: #484f58;
    }

    .status-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #484f58;
        display: inline-block;
    }
    .status-dot.ready {
        background: #3fb950;
        box-shadow: 0 0 4px #3fb950;
    }
    .status-dot.booting {
        background: #d29922;
        animation: blink 1s ease-in-out infinite;
    }
    @keyframes blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.3; }
    }
</style>
