<script lang="ts">
    /**
     * PanicButton — 🛑 Emergency stop for all Claw agents.
     *
     * Always visible. One click freezes EVERYTHING.
     * Shows overlay with Kill / Wipeout / Resume controls.
     */
    import {
        panicFreezeAll,
        isPanicActive,
        killClaw,
        wipeoutAll,
        resumeAll,
        getWipeoutPhrase,
        getClawCounts,
    } from "../bridge/claw-orchestrator";

    interface Props {
        activeClawId: string | null;
        onPanic: () => void;
        onResume: () => void;
        onKill: (id: string) => void;
    }

    let { activeClawId, onPanic, onResume, onKill }: Props = $props();

    let showOverlay = $state(false);
    let wipeoutStep = $state(0); // 0 = not started, 1-3 = confirmations entered
    let wipeoutInput = $state("");
    let wipeoutError = $state("");
    let wipeoutSuccess = $state(false);

    const PHRASE = getWipeoutPhrase();

    function handlePanic() {
        panicFreezeAll();
        showOverlay = true;
        wipeoutStep = 0;
        wipeoutInput = "";
        wipeoutError = "";
        wipeoutSuccess = false;
        onPanic();
    }

    function handleResume() {
        resumeAll();
        showOverlay = false;
        onResume();
    }

    function handleKillCurrent() {
        if (activeClawId) {
            killClaw(activeClawId);
            onKill(activeClawId);
        }
        showOverlay = false;
    }

    function handleWipeoutConfirm() {
        if (wipeoutInput.trim() !== PHRASE) {
            wipeoutError = `Incorrect. Type exactly: ${PHRASE}`;
            wipeoutInput = "";
            return;
        }
        wipeoutError = "";
        wipeoutStep++;
        wipeoutInput = "";

        if (wipeoutStep >= 3) {
            const success = wipeoutAll([PHRASE, PHRASE, PHRASE]);
            if (success) {
                wipeoutSuccess = true;
            } else {
                wipeoutError = "Wipeout failed. Please try again.";
                wipeoutStep = 0;
            }
        }
    }

    function handleWipeoutKeydown(e: KeyboardEvent) {
        if (e.key === "Enter") {
            e.preventDefault();
            handleWipeoutConfirm();
        }
    }
</script>

<!-- Panic Button — always visible -->
<button
    class="panic-btn"
    onclick={handlePanic}
    title="🛑 PANIC — Freeze all agents immediately"
    aria-label="Panic: freeze all agents"
>
    🛑
</button>

<!-- Panic Overlay -->
{#if showOverlay}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="panic-overlay">
        <div class="panic-modal glass-elevated">
            <div class="panic-header">
                <span class="panic-icon">🛑</span>
                <h2>ALL AGENTS FROZEN</h2>
                <p class="panic-subtitle">
                    All Claws have been halted. No further actions are being
                    taken.
                </p>
            </div>

            <div class="panic-stats">
                {#if true}
                    {@const counts = getClawCounts()}
                    <span class="stat">🔵 {counts.frozen} frozen</span>
                    <span class="stat">⚫ {counts.killed} killed</span>
                {/if}
            </div>

            <div class="panic-actions">
                <!-- Resume -->
                <button class="action-btn resume" onclick={handleResume}>
                    <span class="action-icon">▶️</span>
                    <div class="action-info">
                        <strong>Resume All</strong>
                        <span>Unfreeze all agents and continue as normal</span>
                    </div>
                </button>

                <!-- Kill Current -->
                {#if activeClawId}
                    <button class="action-btn kill" onclick={handleKillCurrent}>
                        <span class="action-icon">💀</span>
                        <div class="action-info">
                            <strong>Kill Current Agent</strong>
                            <span>Permanently terminate the active Claw</span>
                        </div>
                    </button>
                {/if}

                <!-- Wipeout -->
                <div class="action-btn wipeout-section">
                    <span class="action-icon">☢️</span>
                    <div class="action-info">
                        <strong>Wipeout All Personas & Skills</strong>
                        <span
                            >Erase all agent identities and learned skills. <b
                                >Workspaces are kept safe.</b
                            ></span
                        >

                        {#if !wipeoutSuccess}
                            <div class="wipeout-confirm">
                                <p class="wipeout-warning">
                                    ⚠️ Type <code>{PHRASE}</code> three times to
                                    confirm ({3 - wipeoutStep} remaining)
                                </p>
                                <div class="wipeout-input-row">
                                    <input
                                        type="text"
                                        class="input-field"
                                        bind:value={wipeoutInput}
                                        placeholder={PHRASE}
                                        onkeydown={handleWipeoutKeydown}
                                    />
                                    <button
                                        class="btn btn-sm btn-danger"
                                        onclick={handleWipeoutConfirm}
                                        disabled={!wipeoutInput.trim()}
                                    >
                                        {wipeoutStep + 1}/3
                                    </button>
                                </div>
                                {#if wipeoutError}
                                    <p class="wipeout-error">{wipeoutError}</p>
                                {/if}
                            </div>
                        {:else}
                            <p class="wipeout-done">
                                ✅ All personas and skills have been erased.
                                Workspaces are untouched.
                            </p>
                        {/if}
                    </div>
                </div>
            </div>
        </div>
    </div>
{/if}

<style>
    .panic-btn {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 2px solid rgba(239, 68, 68, 0.4);
        background: rgba(239, 68, 68, 0.1);
        font-size: 18px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        flex-shrink: 0;
    }

    .panic-btn:hover {
        background: rgba(239, 68, 68, 0.25);
        border-color: rgba(239, 68, 68, 0.8);
        transform: scale(1.1);
        box-shadow: 0 0 16px rgba(239, 68, 68, 0.4);
    }

    .panic-btn:active {
        transform: scale(0.95);
    }

    .panic-overlay {
        position: fixed;
        inset: 0;
        background: rgba(20, 0, 0, 0.85);
        backdrop-filter: blur(8px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
        animation: panicFadeIn 0.2s ease-out;
    }

    @keyframes panicFadeIn {
        from {
            opacity: 0;
        }
        to {
            opacity: 1;
        }
    }

    .panic-modal {
        max-width: 520px;
        width: 100%;
        border-radius: 16px;
        padding: 32px;
        border: 2px solid rgba(239, 68, 68, 0.4);
        animation: panicSlideIn 0.3s ease-out;
    }

    @keyframes panicSlideIn {
        from {
            transform: translateY(-20px);
            opacity: 0;
        }
        to {
            transform: translateY(0);
            opacity: 1;
        }
    }

    .panic-header {
        text-align: center;
        margin-bottom: 24px;
    }

    .panic-icon {
        font-size: 48px;
        display: block;
        margin-bottom: 12px;
        filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.6));
        animation: panicPulse 1s ease-in-out infinite;
    }

    @keyframes panicPulse {
        0%,
        100% {
            opacity: 1;
        }
        50% {
            opacity: 0.6;
        }
    }

    .panic-header h2 {
        font-size: 22px;
        color: #ef4444;
        font-weight: 800;
        letter-spacing: 2px;
        margin-bottom: 8px;
    }

    .panic-subtitle {
        color: rgba(255, 255, 255, 0.6);
        font-size: 14px;
    }

    .panic-stats {
        display: flex;
        justify-content: center;
        gap: 16px;
        margin-bottom: 24px;
        font-size: 13px;
        color: rgba(255, 255, 255, 0.5);
    }

    .panic-actions {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .action-btn {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 16px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.04);
        cursor: pointer;
        transition: all 0.2s ease;
        text-align: left;
        font-family: var(--font-sans);
        color: var(--text-primary);
        width: 100%;
    }

    .action-btn:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
    }

    .action-btn.resume:hover {
        border-color: rgba(34, 197, 94, 0.5);
        background: rgba(34, 197, 94, 0.08);
    }

    .action-btn.kill:hover {
        border-color: rgba(239, 68, 68, 0.5);
        background: rgba(239, 68, 68, 0.08);
    }

    .action-icon {
        font-size: 22px;
        flex-shrink: 0;
        margin-top: 2px;
    }

    .action-info {
        flex: 1;
    }

    .action-info strong {
        display: block;
        font-size: 14px;
        margin-bottom: 2px;
    }

    .action-info span {
        font-size: 12px;
        color: rgba(255, 255, 255, 0.5);
    }

    .wipeout-section {
        cursor: default;
        border-color: rgba(239, 68, 68, 0.2);
    }

    .wipeout-confirm {
        margin-top: 12px;
    }

    .wipeout-warning {
        font-size: 12px;
        color: #f59e0b;
        margin-bottom: 8px;
    }

    .wipeout-warning code {
        background: rgba(245, 158, 11, 0.2);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 11px;
    }

    .wipeout-input-row {
        display: flex;
        gap: 8px;
    }

    .wipeout-input-row .input-field {
        flex: 1;
        padding: 6px 10px;
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 6px;
        color: white;
        font-size: 13px;
        outline: none;
        font-family: var(--font-mono, monospace);
    }

    .wipeout-input-row .input-field:focus {
        border-color: #f59e0b;
    }

    .btn-danger {
        background: #ef4444;
        color: white;
        border: none;
        padding: 6px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
    }

    .btn-danger:disabled {
        opacity: 0.4;
        cursor: not-allowed;
    }

    .wipeout-error {
        font-size: 12px;
        color: #ef4444;
        margin-top: 6px;
    }

    .wipeout-done {
        font-size: 13px;
        color: #22c55e;
        margin-top: 8px;
    }
</style>
