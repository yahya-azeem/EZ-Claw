<script lang="ts">
  interface Props {
    sessionTitle: string;
    model: string;
    provider: string;
    wasmStatus: boolean;
    onToggleSidebar: () => void;
    onOpenSettings: () => void;
    onOpenWorkspace: () => void;
    onOpenSecurity: () => void;
    onOpenSkills: () => void;
    onOpenMCP: () => void;
    onOpenTerminal: () => void;
    onOpenChannels: () => void;
    onOpenPersonas: () => void;
  }

  let {
    sessionTitle,
    model,
    provider,
    wasmStatus,
    onToggleSidebar,
    onOpenSettings,
    onOpenWorkspace,
    onOpenSecurity,
    onOpenSkills,
    onOpenMCP,
    onOpenTerminal,
    onOpenChannels,
    onOpenPersonas,
  }: Props = $props();
</script>

<header class="header glass-elevated">
  <div class="header-left">
    <button
      class="btn btn-ghost btn-icon"
      onclick={onToggleSidebar}
      aria-label="Toggle sidebar"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </svg>
    </button>
    <div class="header-title">
      <h2>{sessionTitle}</h2>
    </div>
  </div>

  <div class="header-right">
    <div class="model-badge badge badge-primary">
      {provider}/{model.split("/").pop()}
    </div>
    <div
      class="status-dot"
      class:active={wasmStatus}
      title={wasmStatus ? "WASM Ready" : "WASM Loading"}
    ></div>
    <button
      class="btn btn-ghost btn-icon"
      onclick={onOpenWorkspace}
      aria-label="Workspace"
      title="Workspace"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
        />
      </svg>
    </button>
    <button
      class="btn btn-ghost btn-icon"
      onclick={onOpenSecurity}
      aria-label="Security"
      title="IronClaw Security"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    </button>
    <button
      class="btn btn-ghost btn-icon"
      onclick={onOpenChannels}
      aria-label="Channels"
      title="Channels"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      </svg>
    </button>
    <button
      class="btn btn-ghost btn-icon"
      onclick={onOpenPersonas}
      aria-label="Personas"
      title="Personas"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    </button>
    <button
      class="btn btn-ghost btn-icon"
      onclick={onOpenMCP}
      aria-label="MCP"
      title="MCP Servers"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          d="M12 2v6M12 22v-6M6 12H2M22 12h-4M19.07 4.93l-3.54 3.54M8.46 15.54l-3.54 3.54M4.93 4.93l3.54 3.54M15.54 15.54l3.54 3.54"
        />
        <circle cx="12" cy="12" r="4" />
      </svg>
    </button>
    <button
      class="btn btn-ghost btn-icon"
      onclick={onOpenSettings}
      aria-label="Settings"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="3" />
        <path
          d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
        />
      </svg>
    </button>
  </div>
</header>

<style>
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: var(--header-height);
    padding: 0 var(--space-md);
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;
    z-index: 10;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 0;
  }

  .header-title {
    min-width: 0;
  }

  .header-title h2 {
    font-size: var(--text-base);
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 300px;
  }

  .header-right {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }

  .model-badge {
    display: none;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--error);
    transition: background var(--transition);
  }

  .status-dot.active {
    background: var(--success);
    box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
  }

  @media (min-width: 768px) {
    .model-badge {
      display: inline-flex;
    }

    .header-title h2 {
      max-width: 500px;
    }
  }
</style>
