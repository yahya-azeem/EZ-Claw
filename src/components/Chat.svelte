<script lang="ts">
  import { tick } from "svelte";
  import MessageBubble from "./MessageBubble.svelte";
  import {
    onClawsChange,
    getClaw,
    runClawTask,
    stopClawTask
  } from "../bridge/claw-orchestrator";
  import {
    buildIdentityPrompt,
    buildBootstrapPrompt,
    isFirstRun
  } from "../bridge/identity-bridge";
  import { recallMemories } from "../bridge/memory-bridge";
  import { NO_KEY_PROVIDERS } from "../bridge/providers";
  import type { SessionData } from "../bridge/storage-bridge";

  interface Props {
    sessionId: string | null;
    provider: string;
    model: string;
    apiKey: string;
    temperature: number;
    apiUrl: string;
    onSessionUpdate: (session: SessionData) => void;
  }

  let {
    sessionId,
    provider,
    model,
    apiKey,
    temperature,
    apiUrl,
    onSessionUpdate,
  }: Props = $props();

  let messages: Array<{
    role: string;
    content: string;
    tool_calls?: any[];
    tool_call_id?: string;
    name?: string;
  }> = $state([]);
  let inputText = $state("");
  let isStreaming = $state(false);
  let streamingContent = $state("");
  let toolActivity = $state("");
  let chatContainer: HTMLDivElement | undefined = $state();
  let inputEl: HTMLTextAreaElement | undefined = $state();

  // Reactive subscription to the Background Orchestrator
  $effect(() => {
    if (sessionId) {
      // initial load
      const session = getClaw(sessionId);
      if (session) messages = session.messages;

      const unsub = onClawsChange(() => {
        const claw = getClaw(sessionId!);
        if (claw) {
          messages = claw.messages;
          // We could also bridge status/streaming flags from the worker here
        }
      });
      return unsub;
    } else {
      messages = [];
    }
  });

  async function scrollToBottom() {
    await tick();
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  async function sendMessage() {
    const text = inputText.trim();
    if (!text || isStreaming) return;

    if (!apiKey && !NO_KEY_PROVIDERS.includes(provider)) {
      messages = [...messages, {
        role: "assistant",
        content: "⚠️ **No API key configured.** Please open Settings and enter your API key to start chatting.",
      }];
      return;
    }

    // Local echo for immediate feedback
    messages = [...messages, { role: "user", content: text }];
    inputText = "";
    isStreaming = true; // Temporary UI flag, worker will eventually own this
    toolActivity = "Starting...";

    await scrollToBottom();

    try {
      // 1. Pre-process local state
      let identityPrompt = buildIdentityPrompt();
      if (isFirstRun()) identityPrompt += "\n\n" + buildBootstrapPrompt();

      let memoriesArr: string[] = [];
      try {
        const recalled = recallMemories(text, 5);
        memoriesArr = recalled.map(m => `[${m.category}] ${m.key}: ${m.content}`);
      } catch {}

      const providerConfig = {
        provider,
        apiKey,
        model,
        temperature,
        apiUrl: apiUrl || undefined,
      };

      // 2. Dispatch to Background Worker
      runClawTask(sessionId || "default", {
        messages: messages.filter(m => m.role && m.content),
        providerConfig,
        identityPrompt,
        memories: memoriesArr,
      });

    } catch (err) {
      messages = [...messages, {
        role: "assistant",
        content: `❌ **Error:** ${err instanceof Error ? err.message : String(err)}`,
      }];
    } finally {
      // Note: isStreaming and toolActivity will eventually be driven by worker events
      isStreaming = false;
      toolActivity = "";
    }
  }

  function generateTitle(
    msgs: Array<{ role: string; content: string }>,
  ): string {
    const firstUser = msgs.find((m) => m.role === "user");
    if (!firstUser) return "New Claw";
    const text = firstUser.content.slice(0, 50);
    return text.length < firstUser.content.length ? text + "..." : text;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 150) + "px";
  }
</script>

<div class="chat-area">
  <div class="messages-container" bind:this={chatContainer}>
    {#if messages.length === 0 && !isStreaming}
      <div class="empty-state">
        <div class="empty-icon">🦀</div>
        <h2>Welcome to EZ-Claw</h2>
        <p>Your AI agent — running locally in your browser</p>
        <div class="quick-prompts">
          <button
            class="quick-prompt"
            onclick={() => {
              inputText = "Create a project README.md file for a new web app";
            }}
          >
            📝 Create a README file
          </button>
          <button
            class="quick-prompt"
            onclick={() => {
              inputText =
                "Search the web for the latest news about AI agents and summarize what you find";
            }}
          >
            🔍 Research & summarize
          </button>
          <button
            class="quick-prompt"
            onclick={() => {
              inputText =
                "List the files in my workspace and organize them into folders by type";
            }}
          >
            📂 Organize my workspace
          </button>
        </div>
      </div>
    {/if}

    {#each messages as msg, i (i)}
      <MessageBubble {...msg} />
    {/each}

    {#if isStreaming && streamingContent}
      <MessageBubble
        role="assistant"
        content={streamingContent}
        isStreaming={true}
      />
    {/if}

    {#if toolActivity}
      <div class="tool-activity">
        <span class="tool-spinner"></span>
        <span>{toolActivity}</span>
      </div>
    {/if}
  </div>

  <div class="input-area glass-elevated">
    <div class="input-wrapper">
      <textarea
        class="chat-input"
        bind:this={inputEl}
        bind:value={inputText}
        placeholder="Message EZ-Claw..."
        onkeydown={handleKeydown}
        oninput={(e) => autoResize(e.currentTarget as HTMLTextAreaElement)}
        rows="1"
        disabled={isStreaming}
      ></textarea>
      <button
        class="send-btn"
        onclick={sendMessage}
        disabled={!inputText.trim() || isStreaming}
        aria-label="Send message"
      >
        {#if isStreaming}
          <div class="spinner"></div>
        {:else}
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        {/if}
      </button>
    </div>
    <div class="input-footer">
      <span>Shift+Enter for new line • {provider}/{model}</span>
    </div>
  </div>
</div>

<style>
  .chat-area {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow: hidden;
  }

  .messages-container {
    flex: 1;
    overflow-y: auto;
    padding: var(--space-md) 0;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    padding: var(--space-xl);
    text-align: center;
    animation: fadeIn 0.5s ease-out;
  }

  .empty-icon {
    font-size: 72px;
    margin-bottom: var(--space-lg);
    filter: drop-shadow(0 0 20px rgba(59, 130, 246, 0.3));
  }

  .empty-state h2 {
    font-size: var(--text-2xl);
    background: var(--accent-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: var(--space-sm);
  }

  .empty-state p {
    color: var(--text-secondary);
    margin-bottom: var(--space-xl);
  }

  .quick-prompts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-sm);
    justify-content: center;
    max-width: 500px;
  }

  .quick-prompt {
    padding: var(--space-sm) var(--space-md);
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    color: var(--text-secondary);
    cursor: pointer;
    transition: all var(--transition);
    font-family: var(--font-sans);
    font-size: var(--text-sm);
  }

  .quick-prompt:hover {
    background: var(--bg-hover);
    border-color: var(--border-active);
    color: var(--text-primary);
    transform: translateY(-1px);
  }

  .input-area {
    padding: var(--space-md) var(--space-lg);
    border-top: 1px solid var(--border);
    flex-shrink: 0;
  }

  .input-wrapper {
    display: flex;
    align-items: flex-end;
    gap: var(--space-sm);
    max-width: 900px;
    margin: 0 auto;
  }

  .chat-input {
    flex: 1;
    padding: var(--space-sm) var(--space-md);
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    color: var(--text-primary);
    font-family: var(--font-sans);
    font-size: var(--text-base);
    line-height: 1.5;
    resize: none;
    outline: none;
    max-height: 150px;
    transition: border-color var(--transition);
  }

  .chat-input:focus {
    border-color: var(--accent-primary);
    box-shadow: 0 0 0 3px var(--accent-glow);
  }

  .chat-input::placeholder {
    color: var(--text-tertiary);
  }

  .chat-input:disabled {
    opacity: 0.5;
  }

  .send-btn {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    border: none;
    background: var(--accent-gradient);
    color: white;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition);
    flex-shrink: 0;
  }

  .send-btn:hover:not(:disabled) {
    transform: translateY(-1px);
    box-shadow: var(--shadow-glow);
  }

  .send-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .spinner {
    width: 18px;
    height: 18px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-radius: 50%;
    border-top-color: white;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .input-footer {
    text-align: center;
    margin-top: var(--space-xs);
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    max-width: 900px;
    margin-left: auto;
    margin-right: auto;
  }

  @media (max-width: 768px) {
    .input-area {
      padding: var(--space-sm) var(--space-md);
    }

    .empty-icon {
      font-size: 56px;
    }

    .quick-prompts {
      flex-direction: column;
      align-items: stretch;
    }
  }

  .tool-activity {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-sm) var(--space-lg);
    max-width: 900px;
    margin: 0 auto;
    color: var(--text-accent);
    font-size: var(--text-sm);
    animation: fadeIn 0.3s ease-out;
  }

  .tool-spinner {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(99, 102, 241, 0.3);
    border-radius: 50%;
    border-top-color: var(--accent-primary);
    animation: spin 0.8s linear infinite;
  }
</style>
