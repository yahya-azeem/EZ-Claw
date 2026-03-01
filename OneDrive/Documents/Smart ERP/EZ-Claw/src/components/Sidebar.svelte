<script lang="ts">
  import type { SessionData } from "../bridge/storage-bridge";

  interface Props {
    sessions: SessionData[];
    activeSessionId: string | null;
    isOpen: boolean;
    onNewSession: () => void;
    onSelectSession: (id: string) => void;
    onDeleteSession: (id: string) => void;
    onClose: () => void;
  }

  let {
    sessions,
    activeSessionId,
    isOpen,
    onNewSession,
    onSelectSession,
    onDeleteSession,
    onClose,
  }: Props = $props();

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

  function truncateTitle(title: string, maxLen: number = 30): string {
    return title.length > maxLen ? title.slice(0, maxLen) + "..." : title;
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

  <button class="btn btn-primary new-chat-btn" onclick={onNewSession}>
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
    New Chat
  </button>

  <div class="sessions-list">
    {#each sessions as session (session.id)}
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="session-item"
        class:active={session.id === activeSessionId}
        onclick={() => onSelectSession(session.id)}
        role="button"
        tabindex="0"
      >
        <div class="session-info">
          <span class="session-title">{truncateTitle(session.title)}</span>
          <span class="session-meta">{formatDate(session.updatedAt)}</span>
        </div>
        <button
          class="btn btn-ghost btn-icon delete-btn"
          onclick={(e) => {
            e.stopPropagation();
            onDeleteSession(session.id);
          }}
          aria-label="Delete session"
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
    {/each}

    {#if sessions.length === 0}
      <div class="empty-sessions">
        <p>No conversations yet</p>
        <p class="empty-hint">Start a new chat above</p>
      </div>
    {/if}
  </div>

  <div class="sidebar-footer">
    <div class="version-info">
      <span class="badge badge-success">WASM</span>
      <span class="footer-text">Powered by ZeroClaw</span>
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

  .new-chat-btn {
    margin: var(--space-md);
    width: calc(100% - var(--space-lg));
  }

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

  .session-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .session-title {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .session-meta {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    margin-top: 2px;
  }

  .delete-btn {
    opacity: 0;
    transition: opacity var(--transition);
    flex-shrink: 0;
  }

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
  }

  .footer-text {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
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
