<script lang="ts">
  import type { SessionData } from "../bridge/storage-bridge";
  import { getClawCounts, type ClawStatus } from "../bridge/claw-orchestrator";

  interface Props {
    sessions: SessionData[];
    activeSessionId: string | null;
    isOpen: boolean;
    onNewClaw: (name: string, cloneFromId?: string) => void;
    onSelectSession: (id: string) => void;
    onDeleteSession: (id: string) => void;
    onClose: () => void;
  }

  let {
    sessions,
    activeSessionId,
    isOpen,
    onNewClaw,
    onSelectSession,
    onDeleteSession,
    onClose,
  }: Props = $props();

  // New Claw form state
  let showNewClawForm = $state(false);
  let newClawName = $state("");
  let cloneFromId = $state("");
  let showCloneDropdown = $state(false);

  function handleCreateClaw() {
    const name = newClawName.trim() || `Claw ${sessions.length + 1}`;
    onNewClaw(name, cloneFromId || undefined);
    newClawName = "";
    cloneFromId = "";
    showNewClawForm = false;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCreateClaw();
    } else if (e.key === "Escape") {
      showNewClawForm = false;
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }

  function statusIcon(status: ClawStatus | string): string {
    switch (status) {
      case "running":
        return "🟢";
      case "frozen":
        return "🔵";
      case "killed":
        return "⚫";
      default:
        return "🟢";
    }
  }

  function statusLabel(status: ClawStatus | string): string {
    switch (status) {
      case "running":
        return "Active";
      case "frozen":
        return "Frozen";
      case "killed":
        return "Killed";
      default:
        return "Active";
    }
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
{#if isOpen}
  <div class="sidebar-backdrop" onclick={onClose}></div>
{/if}

<aside class="sidebar glass-elevated" class:open={isOpen}>
  <div class="sidebar-header">
    <div class="sidebar-brand">
      <span class="brand-icon">🦀</span>
      <span class="brand-text">EZ-Claw</span>
    </div>
    <button
      class="btn btn-ghost btn-icon close-btn"
      onclick={onClose}
      aria-label="Close sidebar"
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

  <!-- New Claw Button / Form -->
  {#if showNewClawForm}
    <div class="new-claw-form">
      <label for="new-claw-name" class="field-label">Claw Name</label>
      <input
        id="new-claw-name"
        name="claw-name"
        type="text"
        class="claw-name-input"
        bind:value={newClawName}
        placeholder="Name your Claw..."
        onkeydown={handleKeydown}
      />
      <div class="clone-row">
        <label class="clone-label" for="clone-checkbox">
          <input id="clone-checkbox" name="is-clone" type="checkbox" bind:checked={showCloneDropdown} />
          Clone from existing
        </label>
        {#if showCloneDropdown && sessions.length > 0}
          <select id="clone-claw-id" name="clone-source" class="clone-select" bind:value={cloneFromId}>
            <option value="">— Select —</option>
            {#each sessions as s}
              <option value={s.id}
                >{s.emoji || "🦀"} {s.clawName || s.title}</option
              >
            {/each}
          </select>
        {/if}
      </div>
      <div class="form-actions">
        <button class="btn btn-primary btn-sm" onclick={handleCreateClaw}>
          🦀 Create
        </button>
        <button
          class="btn btn-ghost btn-sm"
          onclick={() => (showNewClawForm = false)}
        >
          Cancel
        </button>
      </div>
    </div>
  {:else}
    <button
      class="btn btn-primary new-claw-btn"
      onclick={() => (showNewClawForm = true)}
    >
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <line x1="12" y1="5" x2="12" y2="19" /><line
          x1="5"
          y1="12"
          x2="19"
          y2="12"
        />
      </svg>
      New Claw
    </button>
  {/if}

  <!-- Claw List -->
  <div class="sessions-list">
    {#each sessions as session (session.id)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="session-item"
        class:active={session.id === activeSessionId}
        class:frozen={session.status === "frozen"}
        class:killed={session.status === "killed"}
        onclick={() => onSelectSession(session.id)}
        role="button"
        tabindex="0"
      >
        <div class="session-info">
          <div class="claw-header">
            <span class="claw-emoji">{session.emoji || "🦀"}</span>
            <span class="claw-name"
              >{session.clawName || session.title || "Unnamed Claw"}</span
            >
            <span
              class="status-indicator"
              title={statusLabel(session.status || "running")}
            >
              {statusIcon(session.status || "running")}
            </span>
          </div>
          <span class="session-meta">{formatDate(session.updatedAt)}</span>
        </div>
        <div class="claw-actions">
          <button
            class="btn btn-ghost btn-icon clone-btn"
            onclick={(e) => {
              e.stopPropagation();
              newClawName = `${session.clawName || session.title} (clone)`;
              cloneFromId = session.id;
              showNewClawForm = true;
            }}
            aria-label="Clone claw"
            title="Clone this Claw"
          >
            📋
          </button>
          <button
            class="btn btn-ghost btn-icon delete-btn"
            onclick={(e) => {
              e.stopPropagation();
              onDeleteSession(session.id);
            }}
            aria-label="Delete claw"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              />
            </svg>
          </button>
        </div>
      </div>
    {/each}

    {#if sessions.length === 0}
      <div class="empty-sessions">
        <p>No Claws yet</p>
        <p class="empty-hint">Create your first Claw agent above</p>
      </div>
    {/if}
  </div>

  <div class="sidebar-footer">
    <div class="version-info">
      {#if true}
        {@const counts = getClawCounts()}
        <span class="badge badge-success">{counts.running} active</span>
        {#if counts.frozen > 0}
          <span class="badge badge-frozen">{counts.frozen} frozen</span>
        {/if}
      {/if}
      <span class="footer-text">Powered by EZ-Claw</span>
    </div>
  </div>
</aside>

<style>
  .sidebar-backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 49;
    display: none;
  }

  .sidebar {
    width: var(--sidebar-width);
    height: 100dvh;
    display: flex;
    flex-direction: column;
    border-right: 1px solid var(--border);
    flex-shrink: 0;
    overflow: hidden;
    transition: transform var(--transition-slow);
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md);
    border-bottom: 1px solid var(--border);
  }

  .sidebar-brand {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .brand-icon {
    font-size: 24px;
  }

  .brand-text {
    font-size: var(--text-lg);
    font-weight: 700;
    background: var(--accent-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .close-btn {
    display: none;
  }

  .new-claw-btn {
    margin: var(--space-md);
    width: calc(100% - var(--space-lg));
  }

  /* ── New Claw Form ─────────────────────────────────────── */
  .new-claw-form {
    padding: var(--space-sm) var(--space-md);
    border-bottom: 1px solid var(--border);
  }

  .claw-name-input {
    width: 100%;
    padding: 8px 12px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
    outline: none;
    margin-bottom: 8px;
  }

  .claw-name-input:focus {
    border-color: var(--accent-primary);
  }

  .clone-row {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: 8px;
  }

  .clone-label {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: var(--text-xs);
    color: var(--text-secondary);
    cursor: pointer;
  }

  .clone-label input[type="checkbox"] {
    accent-color: var(--accent-primary);
  }

  .clone-select {
    width: 100%;
    padding: 6px 8px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    color: var(--text-primary);
    font-size: var(--text-xs);
  }

  .form-actions {
    display: flex;
    gap: 6px;
  }

  /* ── Claw List ─────────────────────────────────────────── */
  .sessions-list {
    flex: 1;
    overflow-y: auto;
    padding: 0 var(--space-sm);
  }

  .session-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    padding: var(--space-sm) var(--space-md);
    margin-bottom: 2px;
    border: none;
    border-radius: var(--radius-sm);
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition);
    text-align: left;
    font-family: var(--font-sans);
    font-size: var(--text-sm);
  }

  .session-item:hover {
    background: var(--bg-hover);
    color: var(--text-primary);
  }

  .session-item.active {
    background: rgba(59, 130, 246, 0.1);
    color: var(--text-primary);
    border-left: 2px solid var(--accent-primary);
  }

  .session-item.frozen {
    opacity: 0.6;
  }

  .session-item.killed {
    opacity: 0.35;
    text-decoration: line-through;
  }

  .session-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .claw-header {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .claw-emoji {
    font-size: 16px;
    flex-shrink: 0;
  }

  .claw-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 500;
  }

  .status-indicator {
    font-size: 8px;
    flex-shrink: 0;
  }

  .session-meta {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    margin-top: 2px;
    padding-left: 22px;
  }

  .claw-actions {
    display: flex;
    gap: 2px;
    flex-shrink: 0;
  }

  .clone-btn,
  .delete-btn {
    opacity: 0;
    transition: opacity var(--transition);
  }

  .session-item:hover .clone-btn,
  .session-item:hover .delete-btn {
    opacity: 1;
  }

  .empty-sessions {
    text-align: center;
    padding: var(--space-xl);
    color: var(--text-tertiary);
  }

  .empty-hint {
    font-size: var(--text-xs);
    margin-top: var(--space-xs);
  }

  .sidebar-footer {
    padding: var(--space-md);
    border-top: 1px solid var(--border);
  }

  .version-info {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .footer-text {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  .badge-frozen {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
    padding: 2px 8px;
    border-radius: 12px;
    font-size: 11px;
  }

  @media (max-width: 768px) {
    .sidebar-backdrop {
      display: block;
    }

    .sidebar {
      position: fixed;
      left: 0;
      top: 0;
      z-index: 50;
      transform: translateX(-100%);
    }

    .sidebar.open {
      transform: translateX(0);
    }

    .close-btn {
      display: flex;
    }
  }
</style>
