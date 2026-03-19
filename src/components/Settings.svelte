<script lang="ts">
  import { exportAllData, importData } from "../bridge/storage-bridge";
  import {
    PROVIDERS,
    getDefaultApiUrl,
    NO_KEY_PROVIDERS,
    type ProviderDef,
  } from "../bridge/providers";
  import { CLAW_DEFAULTS, TIMEOUTS } from "../bridge/constants";

  interface Props {
    provider: string;
    model: string;
    apiKey: string;
    temperature: number;
    apiUrl: string;
    sessionId?: string | null;
    ghToken: string;
    onClose: () => void;
    onSave: (config: {
      provider: string;
      model: string;
      apiKey: string;
      ghToken: string;
      temperature: number;
      apiUrl: string;
      sessionId?: string | null;
    }) => void;
  }

  let { 
    provider, 
    model, 
    apiKey, 
    ghToken,
    temperature, 
    apiUrl, 
    sessionId, // ADDED
    onClose, 
    onSave 
  }: Props = $props();

  let localProvider = $state(provider);
  let localModel = $state(model);
  let localApiKey = $state(apiKey);
  let localGhToken = $state(ghToken);
  let localTemp = $state(temperature);
  let localApiUrl = $state(apiUrl);
  let showApiKey = $state(false);
  let showGhToken = $state(false);
  let exportStatus = $state("");

  const providers = PROVIDERS;

  function handleProviderChange() {
    const selected = providers.find((p) => p.id === localProvider);
    if (selected) {
      localModel = selected.defaultModel;
      localApiKey = "";
      localApiUrl = getDefaultApiUrl(localProvider);
    }
  }

  function handleSave() {
    onSave({
      provider: localProvider,
      model: localModel,
      apiKey: localApiKey,
      ghToken: localGhToken,
      temperature: localTemp,
      apiUrl: localApiUrl,
      sessionId, // Pass it back
    });
  }

  async function handleExport() {
    try {
      const data = await exportAllData();
      const blob = new Blob([data], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ezclaw-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      exportStatus = "✅ Exported!";
      setTimeout(() => (exportStatus = ""), TIMEOUTS.UI_STATUS_MSG_MS);
    } catch {
      exportStatus = "❌ Export failed";
    }
  }

  async function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const text = await file.text();
      try {
        const count = await importData(text);
        exportStatus = `✅ Imported ${count} sessions`;
        setTimeout(() => (exportStatus = ""), TIMEOUTS.UI_STATUS_MSG_MS);
      } catch {
        exportStatus = "❌ Import failed";
      }
    };
    input.click();
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={onClose}>
  <div class="modal-content" onclick={(e) => e.stopPropagation()}>
    <div class="modal-header">
      <h2>⚙️ {sessionId ? "Claw" : "Global"} Settings</h2>
      <button
        class="btn btn-ghost btn-icon"
        onclick={onClose}
        aria-label="Close"
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

    <div class="settings-section">
      <h3>AI Provider</h3>

      <label class="field">
        <span class="field-label">Provider</span>
        <select
          id="setting-provider"
          name="provider"
          class="input"
          bind:value={localProvider}
          onchange={handleProviderChange}
        >
          {#each providers as p (p.id)}
            <option value={p.id}>
              {p.name}
              {p.free ? "(Free)" : ""}
            </option>
          {/each}
        </select>
      </label>

      <label class="field">
        <span class="field-label">Model</span>
        <input
          id="setting-model"
          name="model"
          class="input"
          type="text"
          bind:value={localModel}
          placeholder="Model name"
          list="model-suggestions"
        />
        <datalist id="model-suggestions">
          {#each providers as p}
            {#if p.id === localProvider}
              {#each p.models as m, idx}
                <option value={m}>{p.modelLabels?.[idx] || m}</option>
              {/each}
            {/if}
          {/each}
        </datalist>
        <span class="field-hint"
          >Type or select a model. Provider: {localProvider}</span
        >
      </label>

      <label class="field">
        <span class="field-label"
          >API Key {NO_KEY_PROVIDERS.includes(localProvider)
            ? "(optional)"
            : ""}</span
        >
        <div class="api-key-wrapper">
          <input
            id="setting-api-key"
            name="api-key"
            class="input"
            type={showApiKey ? "text" : "password"}
            bind:value={localApiKey}
            placeholder={NO_KEY_PROVIDERS.includes(localProvider)
              ? "Not required"
              : "Enter your API key"}
          />
          <button
            class="btn btn-ghost btn-sm"
            onclick={() => (showApiKey = !showApiKey)}
          >
            {showApiKey ? "🙈" : "👁️"}
          </button>
        </div>
        {#if NO_KEY_PROVIDERS.includes(localProvider)}
          <span class="field-hint">Authentication handled locally</span>
        {/if}
      </label>

      {#if localProvider.startsWith("github-copilot")}
        <label class="field github-token">
          <span class="field-label">GitHub CLI Token (gho_...)</span>
          <div class="api-key-wrapper">
            <input
              id="setting-gh-token"
              name="gh-token"
              class="input"
              type={showGhToken ? "text" : "password"}
              bind:value={localGhToken}
              placeholder="Paste value from 'gh auth token'"
            />
            <button
              class="btn btn-ghost btn-sm"
              onclick={() => (showGhToken = !showGhToken)}
            >
              {showGhToken ? "🙈" : "👁️"}
            </button>
          </div>
          <span class="field-hint">Required for GitHub Copilot providers.</span>
        </label>
      {/if}

      {#if localProvider === "custom" || getDefaultApiUrl(localProvider) || localProvider === "deepseek" || localProvider === "openrouter" || localProvider === "openai" || localProvider === "anthropic" || localProvider === "github-copilot"}
        <label class="field">
          <span class="field-label"
            >API URL {localProvider !== "custom" ? "(optional)" : ""}</span
          >
          <input
            id="setting-api-url"
            name="api-url"
            class="input"
            type="text"
            bind:value={localApiUrl}
            placeholder={getDefaultApiUrl(localProvider) ||
              "Leave empty to use default"}
          />
          {#if !localApiUrl && localProvider !== "custom"}
            {@const defaultUrl = getDefaultApiUrl(localProvider)}
            {#if defaultUrl}
              <span class="field-hint">Using default: {defaultUrl}</span>
            {/if}
          {/if}
        </label>
      {/if}

      <label class="field">
        <span class="field-label">Temperature: {localTemp.toFixed(1)}</span>
        <input
          id="setting-temperature"
          name="temperature"
          type="range"
          min="0"
          max="2"
          step="0.1"
          bind:value={localTemp}
          class="slider"
        />
        <div class="slider-labels">
          <span>Precise</span><span>Creative</span>
        </div>
      </label>
    </div>

    <div class="divider"></div>

    <div class="settings-section">
      <h3>Data</h3>
      <div class="data-actions">
        <button class="btn btn-secondary" onclick={handleExport}
          >📤 Export Data</button
        >
        <button class="btn btn-secondary" onclick={handleImport}
          >📥 Import Data</button
        >
      </div>
      {#if exportStatus}
        <p class="export-status">{exportStatus}</p>
      {/if}
    </div>

    <div class="divider"></div>

    <div class="modal-footer">
      <button class="btn btn-secondary" onclick={onClose}>Cancel</button>
      <button class="btn btn-primary" onclick={handleSave}>Save Changes</button>
    </div>
  </div>
</div>

<style>
  .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: var(--space-lg);
  }

  .modal-content {
    background: var(--color-bg);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-deep), 0 0 50px var(--color-primary-glow);
  }

  .modal-header h2 {
    font-size: var(--text-xl);
    font-weight: 800;
    letter-spacing: -0.02em;
    background: var(--accent-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .settings-section h3 {
    font-size: var(--text-sm);
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--color-primary);
    margin-bottom: var(--space-md);
  }

  .field-label {
    display: block;
    font-size: var(--text-sm);
    color: var(--text-primary);
    margin-bottom: var(--space-xs);
    font-weight: 600;
  }

  .field-hint {
    display: block;
    font-size: var(--text-xs);
    color: var(--text-dim);
    margin-top: var(--space-xs);
  }

  .slider {
    width: 100%;
    height: 6px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--color-surface-elevated);
    border-radius: var(--radius-full);
    outline: none;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    box-shadow: 0 0 10px var(--color-primary);
    transition: transform var(--transition-fast);
  }

  .slider::-webkit-slider-thumb:hover {
    transform: scale(1.2);
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-xs);
    color: var(--text-dim);
    font-weight: 500;
    margin-top: var(--space-xs);
  }

  .export-status {
    margin-top: var(--space-sm);
    font-size: var(--text-sm);
    color: var(--color-success);
    font-weight: 600;
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    padding-top: var(--space-md);
  }
</style>
