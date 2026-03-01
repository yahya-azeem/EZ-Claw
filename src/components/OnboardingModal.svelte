<script lang="ts">
  interface Props {
    onComplete: (config: { provider: string; model: string; apiKey: string }) => void;
  }

  let { onComplete }: Props = $props();

  let step = $state(1);
  let selectedProvider = $state('deepseek');
  let apiKey = $state('');
  let selectedModel = $state('deepseek-chat');

  const providers = [
    {
      id: 'deepseek',
      name: 'DeepSeek',
      icon: '🧠',
      description: 'Free, powerful AI model. Great default choice.',
      defaultModel: 'deepseek-chat',
      free: true,
      signupUrl: 'https://platform.deepseek.com/',
    },
    {
      id: 'openrouter',
      name: 'OpenRouter',
      icon: '🌐',
      description: 'Access 100+ models through one API. Free tier available.',
      defaultModel: 'deepseek/deepseek-chat',
      free: true,
      signupUrl: 'https://openrouter.ai/',
    },
    {
      id: 'ollama',
      name: 'Ollama',
      icon: '🦙',
      description: 'Run models locally on your machine. Completely free & private.',
      defaultModel: 'llama3',
      free: true,
      signupUrl: 'https://ollama.ai/',
    },
    {
      id: 'openai',
      name: 'OpenAI',
      icon: '💚',
      description: 'GPT-4o and more. Paid API.',
      defaultModel: 'gpt-4o-mini',
      free: false,
      signupUrl: 'https://platform.openai.com/',
    },
  ];

  function selectProvider(id: string) {
    selectedProvider = id;
    const p = providers.find(p => p.id === id);
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
          <p>ZeroClaw's AI engine, running locally in your browser via WebAssembly.</p>
        </div>

        <div class="features">
          <div class="feature">
            <span class="feature-icon">⚡</span>
            <div>
              <strong>WASM Powered</strong>
              <p>Core engine compiled from Rust — fast & efficient</p>
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

        <button class="btn btn-primary btn-lg" onclick={() => step = 2}>
          Get Started →
        </button>
      </div>
    {:else if step === 2}
      <div class="onboarding-step fade-in">
        <h2>Choose Your AI Provider</h2>
        <p class="step-subtitle">You can change this anytime in Settings</p>

        <div class="provider-grid">
          {#each providers as p (p.id)}
            <button
              class="provider-card"
              class:selected={selectedProvider === p.id}
              onclick={() => selectProvider(p.id)}
            >
              <span class="provider-icon">{p.icon}</span>
              <strong>{p.name}</strong>
              <p>{p.description}</p>
              {#if p.free}
                <span class="badge badge-success">Free</span>
              {/if}
            </button>
          {/each}
        </div>

        <div class="step-actions">
          <button class="btn btn-secondary" onclick={() => step = 1}>← Back</button>
          <button class="btn btn-primary" onclick={() => step = 3}>Continue →</button>
        </div>
      </div>
    {:else if step === 3}
      <div class="onboarding-step fade-in">
        <h2>Enter Your API Key</h2>
        <p class="step-subtitle">
          {#if selectedProvider === 'ollama'}
            Ollama runs locally — no API key needed! Just make sure Ollama is running.
          {:else}
            Get your key from the provider's dashboard. Your key is stored locally and never sent to our servers.
          {/if}
        </p>

        {#if selectedProvider !== 'ollama'}
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
            href={providers.find(p => p.id === selectedProvider)?.signupUrl}
            target="_blank"
            rel="noopener"
          >
            Don't have a key? Sign up at {providers.find(p => p.id === selectedProvider)?.name} →
          </a>
        {/if}

        <label class="field">
          <span class="field-label">Model</span>
          <input class="input" type="text" bind:value={selectedModel} />
        </label>

        <div class="step-actions">
          <button class="btn btn-secondary" onclick={() => step = 2}>← Back</button>
          <button
            class="btn btn-primary"
            onclick={handleComplete}
            disabled={selectedProvider !== 'ollama' && !apiKey.trim()}
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
    max-width: 560px;
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

  .provider-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-sm);
    margin-bottom: var(--space-lg);
    text-align: left;
  }

  .provider-card {
    padding: var(--space-md);
    background: var(--bg-tertiary);
    border: 2px solid var(--border);
    border-radius: var(--radius-md);
    cursor: pointer;
    transition: all var(--transition);
    font-family: var(--font-sans);
    color: var(--text-primary);
    text-align: left;
  }

  .provider-card:hover {
    border-color: var(--border-active);
  }

  .provider-card.selected {
    border-color: var(--accent-primary);
    background: rgba(59, 130, 246, 0.08);
    box-shadow: 0 0 0 1px var(--accent-primary);
  }

  .provider-icon {
    font-size: 28px;
    display: block;
    margin-bottom: var(--space-sm);
  }

  .provider-card strong {
    display: block;
    margin-bottom: var(--space-xs);
  }

  .provider-card p {
    font-size: var(--text-xs);
    color: var(--text-secondary);
    line-height: 1.4;
    margin-bottom: var(--space-sm);
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

  @media (max-width: 500px) {
    .provider-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
