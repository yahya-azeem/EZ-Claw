<script lang="ts">
  interface Props {
    onComplete: (config: {
      provider: string;
      model: string;
      apiKey: string;
    }) => void;
  }

  let { onComplete }: Props = $props();

  let step = $state(1);
  let selectedProvider = $state("openrouter");
  let apiKey = $state("");
  let selectedModel = $state("google/gemini-2.0-flash-exp:free");

  const providers = [
    {
      id: "openrouter",
      name: "OpenRouter (Recommended)",
      icon: "🌐",
      description: "100+ models, one API",
      defaultModel: "deepseek/deepseek-chat",
      free: true,
      signupUrl: "https://openrouter.ai/",
    },
    {
      id: "ollama",
      name: "Ollama",
      icon: "🦙",
      description: "Local & private",
      defaultModel: "llama3",
      free: true,
      signupUrl: "https://ollama.ai/",
    },
    {
      id: "openai",
      name: "OpenAI",
      icon: "💚",
      description: "GPT-4o & more",
      defaultModel: "gpt-4o-mini",
      free: false,
      signupUrl: "https://platform.openai.com/",
    },
    {
      id: "anthropic",
      name: "Anthropic",
      icon: "🔮",
      description: "Claude 3.5 Sonnet",
      defaultModel: "claude-3-5-sonnet-20241022",
      free: false,
      signupUrl: "https://console.anthropic.com/",
    },
    {
      id: "google",
      name: "Google AI",
      icon: "✨",
      description: "Gemini 2.0 Flash",
      defaultModel: "gemini-2.0-flash",
      free: true,
      signupUrl: "https://aistudio.google.com/",
    },
    {
      id: "github-copilot",
      name: "GitHub Copilot",
      icon: "🐙",
      description: "Claude, Gemini & GPT-4o",
      defaultModel: "gpt-4o",
      free: false,
      signupUrl: "https://github.com/marketplace/models",
    },
  ];

  function selectProvider(id: string) {
    selectedProvider = id;
    const p = providers.find((p) => p.id === id);
    if (p) selectedModel = p.defaultModel;
  }

  function handleComplete() {
    onComplete({
      provider: selectedProvider,
      model: selectedModel,
      apiKey,
    });
  }
</script>

<div class="modal-overlay">
  <div class="modal-content onboarding">
    {#if step === 1}
      <div class="onboarding-step fade-in">
        <div class="onboarding-header">
          <span class="big-icon">🦀</span>
          <h1>Welcome to EZ-Claw</h1>
          <p>
            Your AI agent, running locally in your browser. Private, fast, and
            powerful.
          </p>
        </div>

        <div class="features">
          <div class="feature">
            <span class="feature-icon">⚡</span>
            <div>
              <strong>Lightning Fast</strong>
              <p>Core engine compiled from Rust — blazing performance</p>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">🔒</span>
            <div>
              <strong>Your Data Stays Local</strong>
              <p>Everything stored in your browser — nothing on servers</p>
            </div>
          </div>
          <div class="feature">
            <span class="feature-icon">🧠</span>
            <div>
              <strong>Smart Memory</strong>
              <p>Remembers context across sessions via local database</p>
            </div>
          </div>
        </div>

        <button class="btn btn-primary btn-lg" onclick={() => (step = 2)}>
          Get Started →
        </button>
      </div>
    {:else if step === 2}
      <div class="onboarding-step fade-in">
        <h2>Choose Your AI Provider</h2>
        <p class="step-subtitle">You can change this anytime in Settings</p>

        <div class="provider-list">
          {#each providers as p (p.id)}
            <button
              class="provider-row"
              class:selected={selectedProvider === p.id}
              onclick={() => selectProvider(p.id)}
            >
              <span class="provider-icon">{p.icon}</span>
              <div class="provider-info">
                <strong>{p.name}</strong>
                <span class="provider-desc">{p.description}</span>
              </div>
              <div class="provider-badges">
                {#if p.free}
                  <span class="badge badge-success">Free</span>
                {/if}
                {#if selectedProvider === p.id}
                  <span class="check-mark">✓</span>
                {/if}
              </div>
            </button>
          {/each}
        </div>

        <div class="step-actions">
          <button class="btn btn-secondary" onclick={() => (step = 1)}
            >← Back</button
          >
          <button class="btn btn-primary" onclick={() => (step = 3)}
            >Continue →</button
          >
        </div>
      </div>
    {:else if step === 3}
      <div class="onboarding-step fade-in">
        <h2>Enter Your API Key</h2>
        <p class="step-subtitle">
          {#if selectedProvider === "ollama"}
            Ollama runs locally — no API key needed! Just make sure Ollama is
            running.
          {:else}
            Get your key from the provider's dashboard. Your key is stored
            locally and never sent to our servers.
          {/if}
        </p>

        {#if selectedProvider !== "ollama"}
          <label class="field">
            <span class="field-label">API Key</span>
            <input
              class="input"
              type="password"
              bind:value={apiKey}
              placeholder="sk-..."
            />
          </label>

          <a
            class="signup-link"
            href={providers.find((p) => p.id === selectedProvider)?.signupUrl}
            target="_blank"
            rel="noopener"
          >
            Don't have a key? Sign up at {providers.find(
              (p) => p.id === selectedProvider,
            )?.name} →
          </a>
        {/if}

        <label class="field">
          <span class="field-label">Model</span>
          <input class="input" type="text" bind:value={selectedModel} />
        </label>

        <div class="step-actions">
          <button class="btn btn-secondary" onclick={() => (step = 2)}
            >← Back</button
          >
          <button
            class="btn btn-primary"
            onclick={handleComplete}
            disabled={selectedProvider !== "ollama" && !apiKey.trim()}
          >
            Start Chatting 🚀
          </button>
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  .onboarding {
    max-width: 520px;
  }

  .onboarding-step {
    text-align: center;
  }

  .onboarding-header {
    margin-bottom: var(--space-xl);
  }

  .big-icon {
    font-size: 72px;
    display: block;
    margin-bottom: var(--space-md);
    filter: drop-shadow(0 0 30px rgba(59, 130, 246, 0.3));
  }

  .onboarding-header h1 {
    font-size: var(--text-2xl);
    background: var(--accent-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: var(--space-sm);
  }

  .onboarding-header p {
    color: var(--text-secondary);
  }

  .features {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    margin-bottom: var(--space-xl);
    text-align: left;
  }

  .feature {
    display: flex;
    gap: var(--space-md);
    align-items: flex-start;
    padding: var(--space-md);
    background: var(--bg-tertiary);
    border-radius: var(--radius-md);
  }

  .feature-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .feature p {
    color: var(--text-secondary);
    font-size: var(--text-sm);
    margin-top: 2px;
  }

  .btn-lg {
    padding: var(--space-md) var(--space-xl);
    font-size: var(--text-base);
    width: 100%;
  }

  h2 {
    margin-bottom: var(--space-xs);
  }

  .step-subtitle {
    color: var(--text-secondary);
    font-size: var(--text-sm);
    margin-bottom: var(--space-lg);
  }

  /* ── Provider Button List ──────────────────────────────── */
  .provider-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-bottom: var(--space-lg);
    text-align: left;
  }

  .provider-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--bg-tertiary);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: var(--font-sans);
    color: var(--text-primary);
    width: 100%;
    text-align: left;
  }

  .provider-row:hover {
    border-color: var(--border-active);
    background: var(--bg-hover);
  }

  .provider-row.selected {
    border-color: var(--accent-primary);
    background: rgba(59, 130, 246, 0.08);
    box-shadow: 0 0 0 1px var(--accent-primary);
  }

  .provider-icon {
    font-size: 24px;
    flex-shrink: 0;
    width: 32px;
    text-align: center;
  }

  .provider-info {
    flex: 1;
    min-width: 0;
  }

  .provider-info strong {
    display: block;
    font-size: 14px;
  }

  .provider-desc {
    font-size: 12px;
    color: var(--text-secondary);
  }

  .provider-badges {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .check-mark {
    color: var(--accent-primary);
    font-weight: 700;
    font-size: 16px;
  }

  .step-actions {
    display: flex;
    justify-content: space-between;
    gap: var(--space-sm);
  }

  .field {
    display: block;
    margin-bottom: var(--space-md);
    text-align: left;
  }

  .field-label {
    display: block;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin-bottom: var(--space-xs);
    font-weight: 500;
  }

  .signup-link {
    display: block;
    font-size: var(--text-sm);
    color: var(--text-accent);
    margin-bottom: var(--space-lg);
    text-align: left;
  }
</style>
