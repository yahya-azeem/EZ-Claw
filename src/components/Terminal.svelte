<script lang="ts">
    import { onMount } from "svelte";
    import TerminalView from "./TerminalView.svelte";
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
    
    let manager: SandboxManager | null = null;
    let terminalView: any = $state();

    onMount(() => {
        manager = SandboxManager.getInstance();
        const status = manager.getStatus();
        currentTier = status.tier;
        containerReady = manager.isContainerBooted;
    });

    // Handle updates when manager state changes
    $effect(() => {
        if (isOpen && manager) {
            const status = manager.getStatus();
            currentTier = status.tier;
            containerReady = manager.isContainerBooted;
        }
    });

    async function changeTier(tier: SandboxTier) {
        if (!manager) return;
        currentTier = tier;
        manager.setTier(tier);
        showTierMenu = false;

        if (tier === "container2wasm" && !manager.isContainerBooted) {
            containerBooting = true;
            containerReady = false;
            try {
                await manager.bootContainer();
                containerReady = true;
            } catch (err) {
                // Error is handled by TerminalView events
            } finally {
                containerBooting = false;
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

            <div class="terminal-body">
                <TerminalView bind:this={terminalView} />
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
        outline: none;
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
