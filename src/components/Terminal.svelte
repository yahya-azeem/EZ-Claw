<script lang="ts">
    import { onMount, onDestroy, tick } from "svelte";
    import { Terminal } from "xterm";
    import { FitAddon } from "xterm-addon-fit";
    import "xterm/css/xterm.css";
    import {
        SandboxManager,
        type SandboxTier,
    } from "../bridge/sandbox-manager";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen, onClose }: Props = $props();

    let currentTier: SandboxTier = $state("container2wasm");
    let containerBooting = $state(false);
    let containerReady = $state(false);
    let showTierMenu = $state(false);
    let terminalContainer: HTMLDivElement | undefined = $state();
    
    let manager: SandboxManager | null = null;
    let term: Terminal | null = null;
    let fitAddon: FitAddon | null = null;
    let cleanups: (() => void)[] = [];

    // Initialize xterm
    async function initTerminal() {
        if (!terminalContainer || term) return;

        console.log("[EZ-Claw] Initializing xterm.js (v2.1)...");

        term = new Terminal({
            cursorBlink: true,
            theme: {
// ... trimmed for readability in the prompt, but I will provide full content below
                background: "#0d1117",
                foreground: "#e6edf3",
                cursor: "#58a6ff",
                selectionBackground: "rgba(88, 166, 255, 0.3)",
                black: "#484f58",
                red: "#ff7b72",
                green: "#3fb950",
                yellow: "#d29922",
                blue: "#58a6ff",
                magenta: "#bc8cff",
                cyan: "#39c5bb",
                white: "#b1bac4",
            },
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 13,
            lineHeight: 1.4,
            scrollback: 1000,
            convertEol: true
        });

        fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalContainer);
        
        // Use tick to ensure the DOM is ready before fitting
        await tick();
        fitAddon.fit();
        term.focus();

        // Connect input
        term.onData((data) => {
            if (manager && containerReady) {
                manager.sendStdin(data);
            }
        });

        // Welcome
        term.writeln("\x1b[1;34m🦀 EZ-TERM 2.2 — Secure Sandbox\x1b[0m");
        term.writeln("\x1b[2mInteractive Alpine Linux session active. Type directly below.\x1b[0m\n");
    }

    onMount(async () => {
        console.log("[EZ-Claw] Terminal.svelte mounted (v2.2)");
        await initTerminal();
        
        manager = SandboxManager.getInstance();

        // Proxy output to xterm
        const offOutput = manager.onOutput((data) => {
            if (term) term.write(data);
        });
        cleanups.push(offOutput);

        // Progress events
        const offProgress = manager.onC2WEvent("c2w:progress", (data: any) => {
            if (data?.loaded && data?.total && term) {
                const pct = Math.round((data.loaded / data.total) * 100);
                const mb = (data.loaded / 1024 / 1024).toFixed(1);
                const totalMb = (data.total / 1024 / 1024).toFixed(1);
                
                // Clear line and write progress
                term.write(`\r\x1b[K⏳ Downloading container... ${mb}MB / ${totalMb}MB (${pct}%)`);
            }
        });
        cleanups.push(offProgress);

        const offReady = manager.onC2WEvent("c2w:ready", () => {
            containerBooting = false;
            containerReady = true;
            if (term) {
                term.write("\n\r\x1b[1;32m✅ Linux container ready!\x1b[0m\n\n");
            }
        });
        cleanups.push(offReady);

        const offError = manager.onC2WEvent("c2w:error", (data: any) => {
            containerBooting = false;
            if (term) {
                term.writeln(`\r\n\x1b[1;31m❌ Container error: ${data?.error || "Unknown"}\x1b[0m`);
            }
        });
        cleanups.push(offError);

        // Update local state from manager
        const status = manager.getStatus();
        currentTier = status.tier;
        containerReady = manager.isContainerBooted;

        // Auto-boot if not running and we are on container tier
        if (currentTier === "container2wasm" && !manager.isContainerBooted) {
            containerBooting = true;
            term?.writeln("🐧 Booting Alpine Linux container...");
            manager.bootContainer().catch((err) => {
                containerBooting = false;
                term?.writeln(`\r\n\x1b[31mFailed to boot: ${err.message}\x1b[0m`);
            });
        } else if (containerReady) {
            term?.writeln("\x1b[32m✅ Linux container already running.\x1b[0m\n");
        }

        // Handle resize
        const resizeObserver = new ResizeObserver(() => {
            if (isOpen) {
                fitAddon?.fit();
            }
        });
        if (terminalContainer) resizeObserver.observe(terminalContainer);
        cleanups.push(() => resizeObserver.disconnect());
    });

    // Re-fit when opening modal
    $effect(() => {
        if (isOpen && fitAddon) {
            tick().then(() => fitAddon?.fit());
        }
    });

    onDestroy(() => {
        for (const cleanup of cleanups) cleanup();
        term?.dispose();
    });

    async function changeTier(tier: SandboxTier) {
        if (!manager || !term) return;
        currentTier = tier;
        manager.setTier(tier);
        showTierMenu = false;

        const info = manager.getStatus().info;
        term.writeln(`\n\x1b[1;34m[*] Switched to ${info}\x1b[0m`);

        if (tier === "container2wasm" && !manager.isContainerBooted) {
            containerBooting = true;
            containerReady = false;
            term.writeln("🐧 Booting Alpine Linux container...");
            try {
                await manager.bootContainer();
            } catch (err: any) {
                containerBooting = false;
                term.writeln(`\x1b[31m❌ Failed to boot: ${err.message}\x1b[0m`);
            }
        } else if (tier === "container2wasm") {
            containerReady = true;
        }
    }
</script>

{#if isOpen}
    <div class="terminal-overlay" onclick={onClose} role="presentation">
        <div
            class="terminal-panel glass-elevated"
            onclick={(e) => e.stopPropagation()}
            onkeydown={(e) => e.key === 'Escape' && onClose()}
            tabindex="-1"
            role="dialog"
            aria-label="Terminal"
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
                            <div class="tier-menu shadow-lg">
                                <button
                                    class="tier-option"
                                    class:active={currentTier === "container2wasm"}
                                    onclick={() => changeTier("container2wasm")}
                                >
                                    <span>🐳 Container (Linux)</span>
                                    <span class="tier-desc">Alpine userland</span>
                                </button>
                                <button
                                    class="tier-option"
                                    class:active={currentTier === "wasi"}
                                    onclick={() => changeTier("wasi")}
                                >
                                    <span>🐚 Shell (WASI)</span>
                                    <span class="tier-desc">BusyBox fallback</span>
                                </button>
                                <button
                                    class="tier-option"
                                    class:active={currentTier === "native"}
                                    onclick={() => changeTier("native")}
                                >
                                    <span>💻 Native (Companion)</span>
                                    <span class="tier-desc">Local CLI access</span>
                                </button>
                            </div>
                        {/if}
                    </div>
                </div>

                <div class="header-right">
                    <button class="close-btn" onclick={onClose} aria-label="Close terminal">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                    </button>
                </div>
            </div>

            <div class="terminal-body" bind:this={terminalContainer}>
                <!-- xterm.js will mount here -->
            </div>
        </div>
    </div>
{/if}

<style>
    .terminal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.1s ease-out;
    }

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }

    .terminal-panel {
        width: 90%;
        height: 80%;
        max-width: 1000px;
        background: #0d1117;
        border: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        animation: slideUp 0.2s ease-out;
    }

    @keyframes slideUp {
        from { transform: translateY(20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }

    .terminal-header {
        height: 40px;
        background: #161b22;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 var(--space-md);
    }

    .header-left {
        display: flex;
        align-items: center;
        gap: var(--space-md);
    }

    .terminal-title {
        color: #8b949e;
        font-size: var(--text-xs);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }

    .tier-selector {
        position: relative;
    }

    .tier-btn {
        background: #21262d;
        border: 1px solid rgba(240, 246, 252, 0.1);
        border-radius: var(--radius-md);
        color: #c9d1d9;
        padding: 4px 10px;
        font-size: var(--text-xs);
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 6px;
        font-weight: 600;
        letter-spacing: 0.05em;
    }

    .tier-btn:hover {
        background: #30363d;
        border-color: #8b949e;
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
        flex-direction: column;
        padding: var(--space-sm) var(--space-md);
        background: none;
        border: none;
        color: #e6edf3;
        cursor: pointer;
        font-size: var(--text-sm);
        text-align: left;
        width: 100%;
        transition: background 0.2s;
    }

    .tier-option:hover {
        background: rgba(99, 102, 241, 0.15);
    }
    .tier-option.active {
        background: rgba(99, 102, 241, 0.25);
    }

    .tier-desc {
        font-size: 10px;
        color: #8b949e;
        margin-top: 2px;
    }

    .header-right {
        display: flex;
        align-items: center;
    }

    .close-btn {
        background: none;
        border: none;
        color: #8b949e;
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--radius-sm);
    }

    .close-btn:hover {
        background: #f85149;
        color: white;
    }

    .terminal-body {
        flex: 1;
        background: #0d1117;
        padding: 8px;
        min-height: 0;
    }

    :global(.xterm) {
        height: 100%;
        padding: 4px;
    }

    .status-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: #484f58;
    }
    .status-dot.ready {
        background: #3fb950;
        box-shadow: 0 0 8px rgba(63, 185, 80, 0.5);
    }
    .status-dot.booting {
        background: #d29922;
        animation: pulse 1.5s infinite;
    }

    @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.4; }
    }
</style>
