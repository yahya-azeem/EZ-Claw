<script lang="ts">
  import { tick } from 'svelte';
  import MessageBubble from './MessageBubble.svelte';
  import { getWasm } from '../bridge/wasm-loader';
  import { streamChat, chatCompletion, type ProviderConfig } from '../bridge/provider-bridge';
  import { saveSession, getSession, type SessionData } from '../bridge/storage-bridge';
  import { recallMemories, storeMemory } from '../bridge/memory-bridge';
  import {
    buildIdentityPrompt,
    buildBootstrapPrompt,
    loadIdentity,
    saveIdentity,
    setFact,
    isFirstRun,
    markBootstrapped,
    loadUser,
    saveUser,
  } from '../bridge/identity-bridge';
  import { executeToolCall, type ToolCallRequest, type ToolCallResult } from '../bridge/tool-runtime';
  import { SandboxManager } from '../bridge/sandbox-manager';

  // Singleton sandbox manager for shell_exec
  let sandboxManager: SandboxManager | null = null;
  function getSandbox(): SandboxManager {
    if (!sandboxManager) sandboxManager = new SandboxManager({ tier: 'wasi', enabled: true });
    return sandboxManager;
  }

  interface Props {
    sessionId: string | null;
    provider: string;
    model: string;
    apiKey: string;
    temperature: number;
    apiUrl: string;
    onSessionUpdate: (session: SessionData) => void;
  }

  let { sessionId, provider, model, apiKey, temperature, apiUrl, onSessionUpdate }: Props = $props();

  let messages: Array<{ role: string; content: string; tool_calls?: any[]; tool_call_id?: string; name?: string }> = $state([]);
  let inputText = $state('');
  let isStreaming = $state(false);
  let streamingContent = $state('');
  let toolActivity = $state('');
  let chatContainer: HTMLDivElement | undefined = $state();
  let inputEl: HTMLTextAreaElement | undefined = $state();

  // Load session messages when session changes
  $effect(() => {
    if (sessionId) {
      streamingContent = '';
      isStreaming = false;
      toolActivity = '';
      loadSessionMessages(sessionId);
    } else {
      messages = [];
    }
  });

  async function loadSessionMessages(id: string) {
    try {
      const session = await getSession(id);
      if (session && session.messages) {
        messages = session.messages;
        await scrollToBottom();
      } else {
        messages = [];
      }
    } catch {
      messages = [];
    }
  }

  async function scrollToBottom() {
    await tick();
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  async function sendMessage() {
    const text = inputText.trim();
    if (!text || isStreaming) return;

if (!apiKey) {
      const noKeyProviders = ['zerogravity', 'ollama'];
      if (!noKeyProviders.includes(provider)) {
        messages = [...messages, {
          role: 'assistant',
          content: '⚠️ **No API key configured.** Please open Settings and enter your API key to start chatting.'
        }];
        return;
      }
    }

    messages = [...messages, { role: 'user', content: text }];
    inputText = '';
    isStreaming = true;
    streamingContent = '';
    toolActivity = '';

    await scrollToBottom();

    try {
      const wasm = getWasm();

      // Load agent identity
      let identityPrompt = buildIdentityPrompt();

      // First-run bootstrap: inject OpenClaw-style "Who am I?" prompt
      const firstRun = isFirstRun();
      if (firstRun) {
        identityPrompt += '\n\n' + buildBootstrapPrompt();
      }

      // Recall relevant memories
      let memoriesArr: string[] = [];
      try {
        const recalled = recallMemories(text, 5);
        memoriesArr = recalled.map(m => `[${m.category}] ${m.key}: ${m.content}`);
      } catch { /* Memory not initialized yet */ }

      // Build messages with WASM agent (includes system prompt + identity + memories)
      const agent = new (wasm as any).WasmAgent(JSON.stringify({
        default_provider: provider,
        default_model: model,
        default_temperature: temperature,
      }));

      const builtMessagesJson = agent.build_messages(
        JSON.stringify(messages),
        JSON.stringify(memoriesArr),
        identityPrompt,
        new Date().toLocaleString(),
      );

      agent.free();

      // Get tool definitions
      const toolRegistry = new (wasm as any).WasmToolRegistry();
      const toolsJson = toolRegistry.to_llm_json();
      console.log('[EZ-Claw] Tools JSON:', toolsJson.slice(0, 500));
      toolRegistry.free();

      const providerConfig: ProviderConfig = {
        provider,
        apiKey,
        model,
        temperature,
        apiUrl: apiUrl || undefined,
      };

      // ── Agentic Loop ──
      // Step 1: Make a non-streaming call with tools to check for tool_calls
      // Step 2: If tool_calls → execute them, add results, loop back
      // Step 3: When no tool_calls → stream the final text response

      let loopMessages = JSON.parse(builtMessagesJson);
      let maxIterations = 10;

      for (let i = 0; i < maxIterations; i++) {
        toolActivity = i > 0 ? 'Thinking...' : '';

        // Non-streaming request WITH tools
        const requestBody = wasm.build_provider_request_with_tools(
          JSON.stringify(loopMessages),
          model,
          temperature,
          false, // non-streaming for tool calls
          toolsJson,
        );

        let baseUrl = apiUrl || wasm.provider_base_url(provider);
        const endpoint = `${baseUrl}/chat/completions`;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };

        if (provider === 'anthropic') {
          headers['x-api-key'] = apiKey;
          headers['anthropic-version'] = '2023-06-01';
        } else {
          headers['Authorization'] = `Bearer ${apiKey}`;
        }
        if (provider === 'openrouter') {
          headers['HTTP-Referer'] = window.location.origin;
          headers['X-Title'] = 'EZ-Claw';
        }

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: requestBody,
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`API error ${response.status}: ${errText}`);
        }

        const data = await response.json();
        const choice = data.choices?.[0];

        if (!choice) throw new Error('No response from model');

        const assistantMsg = choice.message;
        
        // Debug: log what we got
        console.log('[EZ-Claw] Response:', JSON.stringify(assistantMsg));

        // Check for tool calls
        if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
          console.log('[EZ-Claw] Tool calls detected:', assistantMsg.tool_calls);
          // Add the assistant message with tool_calls to the loop
          loopMessages.push(assistantMsg);

          // Execute each tool call
          for (const tc of assistantMsg.tool_calls) {
            const toolName = tc.function?.name || tc.name || 'unknown';
            const toolArgs = tc.function?.arguments || tc.arguments || '{}';
            const toolId = tc.id || crypto.randomUUID();

            toolActivity = `🔧 Running: ${toolName}...`;
            await scrollToBottom();

            // Execute through the simplified dispatch (no WASM agent needed for dispatch)
            let result: string;
            try {
              const args = JSON.parse(toolArgs);
              console.log('[EZ-Claw] Executing tool:', toolName, args);
              result = await dispatchToolDirect(toolName, args);
              console.log('[EZ-Claw] Tool result:', result.slice(0, 200));
            } catch (e: any) {
              result = `Error: ${e.message}`;
            }

            // Add tool result to loop messages (OpenAI format)
            loopMessages.push({
              role: 'tool',
              tool_call_id: toolId,
              content: result,
            });
          }

          // Continue the loop — model will see tool results and decide what to do next
          continue;
        }

        // No tool calls → we have the final text response
        const finalText = assistantMsg.content || '';
        messages = [...messages, { role: 'assistant', content: finalText }];
        toolActivity = '';
        isStreaming = false;
        streamingContent = '';

        // Auto-save session
        if (sessionId) {
          const session: SessionData = {
            id: sessionId,
            title: generateTitle(messages),
            messages: messages.map(m => ({ role: m.role, content: m.content })),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            model,
            provider,
          };
          await saveSession(session);
          onSessionUpdate(session);
        }

        // Auto-store conversation to memory
        try {
          storeMemory(
            `chat-${Date.now()}`,
            `User: ${text}\nAssistant: ${finalText.slice(0, 200)}`,
            'conversation',
            sessionId || ''
          );
        } catch { /* Memory not ready */ }

        await scrollToBottom();
        return; // Done
      }

      // If we exhausted max iterations, show what we have
      toolActivity = '';
      isStreaming = false;
      messages = [...messages, {
        role: 'assistant',
        content: '⚠️ Reached maximum tool execution depth. Please try again.'
      }];

    } catch (err) {
      messages = [...messages, {
        role: 'assistant',
        content: `❌ **Error:** ${err instanceof Error ? err.message : String(err)}`
      }];
      isStreaming = false;
      streamingContent = '';
      toolActivity = '';
    }
  }

  /**
   * Direct tool dispatch without WASM security pipeline (simplified for now).
   * TODO: wire through full executeToolCall with WASM agent security checks.
   */
  async function dispatchToolDirect(name: string, args: Record<string, any>): Promise<string> {
    switch (name) {
      case 'web_search': {
        const query = args.query || '';
        const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
        const res = await fetch(url);
        const data = await res.json();
        const results: string[] = [];
        if (data.Abstract) results.push(`**Summary**: ${data.Abstract}\nSource: ${data.AbstractURL}`);
        if (data.RelatedTopics) {
          for (const topic of data.RelatedTopics.slice(0, 5)) {
            if (topic.Text) results.push(`- ${topic.Text}${topic.FirstURL ? ` (${topic.FirstURL})` : ''}`);
          }
        }
        return results.length > 0 ? results.join('\n\n') : `No results for: "${query}"`;
      }

      case 'web_fetch': {
        const res = await fetch(args.url);
        const text = await res.text();
        const cleaned = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        return cleaned.slice(0, 10000);
      }

      case 'memory_store': {
        const key = args.key || `mem-${Date.now()}`;
        const content = args.content || args.value || '';
        const category = args.category || 'core';
        try {
          storeMemory(key, content, category);
          return `Memory stored: key="${key}", category="${category}"`;
        } catch (e: any) {
          return `Memory store failed: ${e.message}`;
        }
      }

      case 'memory_recall': {
        try {
          const results = recallMemories(args.query || '', args.limit || 5);
          if (results.length === 0) return `No memories found for: "${args.query}"`;
          return results.map(m =>
            `[${m.category}] ${m.key}: ${m.content}`
          ).join('\n');
        } catch (e: any) {
          return `Memory recall failed: ${e.message}`;
        }
      }

      case 'update_identity': {
        const identity = loadIdentity();
        if (args.name) {
          identity.name = args.name;
          identity.facts['name'] = args.name;
        }
        if (args.personality) identity.personality = args.personality;
        if (args.instructions) identity.instructions = args.instructions;
        if (args.creature) identity.creature = args.creature;
        if (args.vibe) identity.vibe = args.vibe;
        if (args.emoji) identity.emoji = args.emoji;
        if (args.fact_key && args.fact_value) {
          identity.facts[args.fact_key] = args.fact_value;
        }
        // Save directly (already imported at top level)
        saveIdentity(identity);
        // Mark bootstrapped if the agent set a name (first-run complete)
        if (args.name && !identity.bootstrapped) {
          markBootstrapped();
        }
        // Also persist to memory
        try {
          if (args.name) storeMemory('identity_name', `My name is ${args.name}`, 'identity');
          if (args.personality) storeMemory('identity_personality', args.personality, 'identity');
          if (args.creature) storeMemory('identity_creature', args.creature, 'identity');
          if (args.fact_key) storeMemory(`identity_${args.fact_key}`, args.fact_value, 'identity');
        } catch { /* silent */ }
        return `Identity updated successfully: ${JSON.stringify(identity, null, 2)}`;
      }

      case 'read_file': {
        try {
          const ws = new (getWasm() as any).WasmWorkspace();
          const content = ws.read_file(args.path || '');
          ws.free();
          return content;
        } catch (e: any) {
          return `read_file error: ${e.message}`;
        }
      }

      case 'write_file': {
        try {
          const ws = new (getWasm() as any).WasmWorkspace();
          ws.write_file(args.path || '', args.content || '');
          ws.free();
          return `File written: ${args.path} (${(args.content || '').length} bytes)`;
        } catch (e: any) {
          return `write_file error: ${e.message}`;
        }
      }

      case 'list_dir': {
        try {
          const ws = new (getWasm() as any).WasmWorkspace();
          const json = ws.list_dir(args.path || '/');
          ws.free();
          const entries = JSON.parse(json);
          if (entries.length === 0) return '(empty directory)';
          return entries.map((e: any) =>
            `${e.is_dir ? '📁' : '📄'} ${e.name}${e.is_dir ? '/' : ` (${e.size}b)`}`
          ).join('\n');
        } catch (e: any) {
          return `list_dir error: ${e.message}`;
        }
      }

      case 'shell_exec': {
        const sandbox = getSandbox();
        const result = await sandbox.execute(args.command || '');
        let output = '';
        if (result.stdout) output += result.stdout;
        if (result.stderr) output += (output ? '\n' : '') + `STDERR: ${result.stderr}`;
        if (result.timedOut) output += '\n(command timed out)';
        return output || '(no output)';
      }

      default:
        return `Unknown tool: ${name}`;
    }
  }

  function generateTitle(msgs: Array<{ role: string; content: string }>): string {
    const firstUser = msgs.find(m => m.role === 'user');
    if (!firstUser) return 'New Chat';
    const text = firstUser.content.slice(0, 50);
    return text.length < firstUser.content.length ? text + '...' : text;
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
  }
</script>

<div class="chat-area">
  <div class="messages-container" bind:this={chatContainer}>
    {#if messages.length === 0 && !isStreaming}
      <div class="empty-state">
        <div class="empty-icon">🦀</div>
        <h2>Welcome to EZ-Claw</h2>
        <p>ZeroClaw running in your browser via WebAssembly</p>
        <div class="quick-prompts">
          <button class="quick-prompt" onclick={() => { inputText = 'Help me write a Python function'; }}>
            💡 Write a Python function
          </button>
          <button class="quick-prompt" onclick={() => { inputText = 'Explain WASM to me'; }}>
            📚 Explain WASM
          </button>
          <button class="quick-prompt" onclick={() => { inputText = 'Debug this code for me'; }}>
            🔍 Debug code
          </button>
        </div>
      </div>
    {/if}

    {#each messages as msg, i (i)}
      <MessageBubble role={msg.role} content={msg.content} />
    {/each}

    {#if isStreaming && streamingContent}
      <MessageBubble role="assistant" content={streamingContent} isStreaming={true} />
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
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
    to { transform: rotate(360deg); }
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

    .empty-icon { font-size: 56px; }

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
