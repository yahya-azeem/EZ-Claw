<script lang="ts">
  import { exportAllData, importData } from "../bridge/storage-bridge";
  import {
    PROVIDERS,
    getDefaultApiUrl,
    NO_KEY_PROVIDERS,
    type ProviderDef,
  } from "../bridge/providers";

  interface Props {
    provider: string;
    model: string;
    apiKey: string;
    temperature: number;
    apiUrl: string;
    onClose: () => void;
    onSave: (config: {
      provider: string;
      model: string;
      apiKey: string;
      temperature: number;
      apiUrl: string;
    }) => void;
  }

  let { provider, model, apiKey, temperature, apiUrl, onClose, onSave }: Props =
    $props();

  let localProvider = $state(provider);
  let localModel = $state(model);
  let localApiKey = $state(apiKey);
  let localTemp = $state(temperature);
  let localApiUrl = $state(apiUrl);
  let showApiKey = $state(false);
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
      temperature: localTemp,
      apiUrl: localApiUrl,
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
      setTimeout(() => (exportStatus = ""), 3000);
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
        setTimeout(() => (exportStatus = ""), 3000);
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
      <h2>⚙️ Settings</h2>
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

      {#if localProvider === "custom" || getDefaultApiUrl(localProvider) || localProvider === "deepseek" || localProvider === "openrouter" || localProvider === "openai" || localProvider === "anthropic"}
        <label class="field">
          <span class="field-label"
            >API URL {localProvider !== "custom" ? "(optional)" : ""}</span
          >
          <input
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

  .modal-header h2 {
    font-size: var(--text-xl);
  }

  .settings-section {
    margin-bottom: var(--space-md);
  }

  .settings-section h3 {
    font-size: var(--text-base);
    color: var(--text-secondary);
    margin-bottom: var(--space-md);
  }

  .field {
    display: block;
    margin-bottom: var(--space-md);
  }

  .field-label {
    display: block;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin-bottom: var(--space-xs);
    font-weight: 500;
  }

  .field-hint {
    display: block;
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    margin-top: var(--space-xs);
  }

  .api-key-wrapper {
    display: flex;
    gap: var(--space-xs);
  }

  .api-key-wrapper .input {
    flex: 1;
  }

  .slider {
    width: 100%;
    height: 4px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--bg-tertiary);
    border-radius: var(--radius-full);
    outline: none;
  }

  .slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--accent-primary);
    cursor: pointer;
    box-shadow: 0 0 6px var(--accent-glow);
  }

  .slider-labels {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    margin-top: var(--space-xs);
  }

  .data-actions {
    display: flex;
    gap: var(--space-sm);
    flex-wrap: wrap;
  }

  .export-status {
    margin-top: var(--space-sm);
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: var(--space-sm);
    padding-top: var(--space-md);
  }
</style>
