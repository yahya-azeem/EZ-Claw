<script lang="ts">
    /**
     * CloudSyncPanel — Google Drive cloud sync UI.
     *
     * Sign in with Google, push/pull data to/from your Drive.
     * No server involved — everything goes through the browser.
     */
    import {
        signInWithGoogle,
        signOut,
        syncToCloud,
        syncFromCloud,
        getSyncStatus,
        getCloudClientId,
        setCloudClientId,
        onSyncChange,
    } from "../bridge/cloud-sync";
    import { onMount, onDestroy } from "svelte";

    interface Props {
        onClose: () => void;
    }

    let { onClose }: Props = $props();

    let status = $state(getSyncStatus());
    let clientId = $state(getCloudClientId());
    let showClientIdInput = $state(!getCloudClientId());

    let unsubscribe: (() => void) | undefined;

    onMount(() => {
        unsubscribe = onSyncChange(() => {
            status = getSyncStatus();
        });
    });

    onDestroy(() => {
        if (unsubscribe) unsubscribe();
    });

    function handleSaveClientId() {
        setCloudClientId(clientId.trim());
        showClientIdInput = false;
    }

    async function handleSignIn() {
        try {
            await signInWithGoogle();
            status = getSyncStatus();
        } catch {
            status = getSyncStatus();
        }
    }

    function handleSignOut() {
        signOut();
        status = getSyncStatus();
    }

    async function handlePush() {
        await syncToCloud();
        status = getSyncStatus();
    }

    async function handlePull() {
        await syncFromCloud();
        status = getSyncStatus();
    }

    function formatTime(iso: string | null): string {
        if (!iso) return "Never";
        const d = new Date(iso);
        return d.toLocaleString();
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={onClose}>
    <div class="modal-content cloud-panel" onclick={(e) => e.stopPropagation()}>
        <div class="panel-header">
            <h2>☁️ Cloud Sync</h2>
            <button
                class="btn btn-ghost btn-icon"
                onclick={onClose}
                aria-label="Close">✕</button
            >
        </div>

        <p class="panel-desc">
            Sync your Claws, Personas, Skills, and Settings to your Google
            Drive.
            <strong>No server involved</strong> — data goes directly to your Drive.
        </p>

        {#if !clientId || showClientIdInput}
            <div class="setup-section">
                <h3>Setup Required</h3>
                <p class="setup-hint">
                    To enable cloud sync, create a Google Cloud OAuth Client ID:
                </p>
                <ol class="setup-steps">
                    <li>
                        Go to <a
                            href="https://console.cloud.google.com/apis/credentials"
                            target="_blank"
                            rel="noopener">Google Cloud Console</a
                        >
                    </li>
                    <li>Create an OAuth 2.0 Client ID (Web application)</li>
                    <li>
                        Add your site URL to "Authorized JavaScript origins"
                    </li>
                    <li>Enable the Google Drive API</li>
                    <li>Paste the Client ID below</li>
                </ol>
                <div class="client-id-row">
                    <input
                        type="text"
                        class="input"
                        bind:value={clientId}
                        placeholder="123456789.apps.googleusercontent.com"
                    />
                    <button
                        class="btn btn-primary btn-sm"
                        onclick={handleSaveClientId}
                        disabled={!clientId.trim()}
                    >
                        Save
                    </button>
                </div>
            </div>
        {:else}
            <!-- Logged In / Out State -->
            {#if status.loggedIn && status.user}
                <div class="user-card">
                    {#if status.user.picture}
                        <img
                            class="user-avatar"
                            src={status.user.picture}
                            alt={status.user.name}
                            referrerpolicy="no-referrer"
                        />
                    {:else}
                        <div class="user-avatar-placeholder">👤</div>
                    {/if}
                    <div class="user-info">
                        <strong>{status.user.name}</strong>
                        <span>{status.user.email}</span>
                    </div>
                    <button
                        class="btn btn-ghost btn-sm"
                        onclick={handleSignOut}
                    >
                        Sign out
                    </button>
                </div>

                <div class="sync-status">
                    <span class="sync-label">Last sync:</span>
                    <span class="sync-time">{formatTime(status.lastSync)}</span>
                </div>

                {#if status.error}
                    <div class="sync-error">⚠️ {status.error}</div>
                {/if}

                <div class="sync-actions">
                    <button
                        class="sync-btn push"
                        onclick={handlePush}
                        disabled={status.syncing}
                    >
                        {#if status.syncing}
                            <span class="spin">↻</span> Syncing...
                        {:else}
                            ☁️↑ Push to Cloud
                        {/if}
                    </button>
                    <button
                        class="sync-btn pull"
                        onclick={handlePull}
                        disabled={status.syncing}
                    >
                        {#if status.syncing}
                            <span class="spin">↻</span> Syncing...
                        {:else}
                            ☁️↓ Pull from Cloud
                        {/if}
                    </button>
                </div>

                <p class="sync-hint">
                    <strong>Push</strong> saves your current data to Drive.
                    <strong>Pull</strong> restores from Drive (overwrites local).
                </p>

                <button
                    class="btn btn-ghost btn-sm change-id"
                    onclick={() => (showClientIdInput = true)}
                >
                    Change Client ID
                </button>
            {:else}
                <div class="sign-in-section">
                    <button class="google-btn" onclick={handleSignIn}>
                        <svg width="18" height="18" viewBox="0 0 48 48">
                            <path
                                fill="#EA4335"
                                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                            />
                            <path
                                fill="#4285F4"
                                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                            />
                            <path
                                fill="#FBBC05"
                                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                            />
                            <path
                                fill="#34A853"
                                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                            />
                        </svg>
                        Sign in with Google
                    </button>
                    <p class="sign-in-hint">
                        Your data syncs to your own Google Drive. We never see
                        it.
                    </p>
                </div>

                {#if status.error}
                    <div class="sync-error">⚠️ {status.error}</div>
                {/if}
            {/if}
        {/if}
    </div>
</div>

<style>
    .cloud-panel {
        max-width: 460px;
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
    }

    .panel-header h2 {
        font-size: 18px;
        margin: 0;
    }

    .panel-desc {
        font-size: 13px;
        color: var(--text-secondary);
        margin-bottom: 20px;
        line-height: 1.5;
    }

    /* Setup Section */
    .setup-section {
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        padding: 16px;
    }

    .setup-section h3 {
        font-size: 14px;
        margin-bottom: 8px;
    }

    .setup-hint {
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 12px;
    }

    .setup-steps {
        font-size: 12px;
        color: var(--text-secondary);
        padding-left: 20px;
        margin-bottom: 12px;
        line-height: 1.8;
    }

    .setup-steps a {
        color: var(--text-accent);
    }

    .client-id-row {
        display: flex;
        gap: 8px;
    }

    .client-id-row .input {
        flex: 1;
        font-size: 12px;
        padding: 8px 10px;
    }

    /* User Card */
    .user-card {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        margin-bottom: 16px;
    }

    .user-avatar {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .user-avatar-placeholder {
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background: var(--bg-hover);
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        flex-shrink: 0;
    }

    .user-info {
        flex: 1;
        min-width: 0;
    }

    .user-info strong {
        display: block;
        font-size: 13px;
    }

    .user-info span {
        font-size: 11px;
        color: var(--text-secondary);
    }

    /* Sync Status */
    .sync-status {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        color: var(--text-secondary);
        margin-bottom: 12px;
    }

    .sync-time {
        color: var(--text-primary);
    }

    .sync-error {
        font-size: 12px;
        color: #ef4444;
        background: rgba(239, 68, 68, 0.08);
        padding: 8px 12px;
        border-radius: var(--radius-sm);
        margin-bottom: 12px;
    }

    /* Sync Actions */
    .sync-actions {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
    }

    .sync-btn {
        flex: 1;
        padding: 12px;
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        background: var(--bg-tertiary);
        color: var(--text-primary);
        font-family: var(--font-sans);
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 500;
    }

    .sync-btn:hover:not(:disabled) {
        background: var(--bg-hover);
        border-color: var(--border-active);
    }

    .sync-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .sync-btn.push:hover:not(:disabled) {
        border-color: rgba(59, 130, 246, 0.5);
    }

    .sync-btn.pull:hover:not(:disabled) {
        border-color: rgba(34, 197, 94, 0.5);
    }

    .sync-hint {
        font-size: 11px;
        color: var(--text-tertiary);
        line-height: 1.5;
        margin-bottom: 12px;
    }

    .change-id {
        font-size: 11px;
        color: var(--text-tertiary);
    }

    .spin {
        display: inline-block;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(360deg);
        }
    }

    /* Google Sign-In Button */
    .sign-in-section {
        text-align: center;
        padding: 20px 0;
    }

    .google-btn {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 10px 24px;
        background: white;
        color: #333;
        border: 1px solid #dadce0;
        border-radius: 8px;
        font-family: var(--font-sans);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
    }

    .google-btn:hover {
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        border-color: #c0c0c0;
    }

    .sign-in-hint {
        font-size: 12px;
        color: var(--text-tertiary);
        margin-top: 12px;
    }
</style>
