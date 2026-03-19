<script lang="ts">
  interface Props {
    role: string;
    content: string;
    name?: string;
    tool_calls?: any[];
    isStreaming?: boolean;
  }

  let { role, content, name, tool_calls, isStreaming = false }: Props = $props();

  // Simple markdown rendering (code blocks, bold, italic, links)
  function renderMarkdown(text: string): string {
    if (!text) return "";
    let html = text
      // Code blocks
      .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre><code class="lang-$1">$2</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br>');

    return html;
  }
</script>

<div 
  class="message" 
  class:user={role === 'user'} 
  class:assistant={role === 'assistant'} 
  class:tool={role === 'tool'}
>
  <div class="message-avatar">
    {#if role === 'user'}
      <div class="avatar avatar-user">U</div>
    {:else if role === 'assistant'}
      <div class="avatar avatar-assistant">🦀</div>
    {:else}
      <div class="avatar avatar-tool">⚙️</div>
    {/if}
  </div>

  <div class="message-body">
    <div class="message-role">
      {#if role === 'user'}
        You
      {:else if role === 'assistant'}
        EZ-Claw
      {:else}
        Work Log: {name || 'Action'}
      {/if}
    </div>

    {#if tool_calls && tool_calls.length > 0}
      <div class="tool-calls">
        {#each tool_calls as tc}
          <div class="tool-call-item">
            <div class="tool-call-header">
              <span class="tool-icon">🔧</span>
              <span class="tool-name">Action: {tc.function?.name || tc.name}</span>
            </div>
            {#if tc.function?.arguments || tc.arguments}
              <pre class="tool-args">{tc.function?.arguments || tc.arguments}</pre>
            {/if}
          </div>
        {/each}
      </div>
    {/if}

    <div class="message-content" class:terminal={role === 'tool' && (name === 'shell_exec' || name === 'run_shell_command')}>
      {#if isStreaming && !content && (!tool_calls || tool_calls.length === 0)}
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      {:else if content}
        {@html renderMarkdown(content)}
        {#if isStreaming}
          <span class="cursor-blink">▊</span>
        {/if}
      {/if}
    </div>
  </div>
</div>

<style>
  .message {
    display: flex;
    gap: var(--space-md);
    padding: var(--space-lg) var(--space-xl);
    animation: fadeIn 0.3s ease-out;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
  }

  .message.assistant {
    background: var(--color-surface-base);
    border: 1px solid var(--border-subtle);
    border-radius: var(--radius-lg);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    margin-top: var(--space-xs);
    margin-bottom: var(--space-xs);
  }

  .message.tool {
    background: var(--color-surface-elevated);
    border-left: 4px solid var(--color-primary);
    padding: var(--space-md) var(--space-xl);
    font-size: 0.95em;
    opacity: 0.9;
    border-radius: 0 var(--radius-md) var(--radius-md) 0;
  }

  .message-avatar {
    flex-shrink: 0;
  }

  .avatar {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--text-sm);
    font-weight: 600;
  }

  .avatar-user {
    background: var(--accent-gradient);
    color: white;
    box-shadow: 0 0 10px var(--color-primary-glow);
  }

  .avatar-assistant {
    background: var(--color-surface-elevated);
    border: 1px solid var(--border-strong);
    font-size: 18px;
  }

  .avatar-tool {
    background: var(--color-surface-base);
    border: 1px solid var(--border-subtle);
    font-size: 14px;
  }

  .message-body {
    flex: 1;
    min-width: 0;
  }

  .message-role {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--space-xs);
  }

  .message-content {
    color: var(--text-primary);
    line-height: 1.7;
    word-wrap: break-word;
    overflow-wrap: break-word;
  }

  .message-content.terminal {
    background: #000000;
    color: var(--color-secondary);
    padding: var(--space-md);
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    font-size: 0.9em;
    white-space: pre-wrap;
    border: 1px solid var(--border-strong);
    box-shadow: inset 0 2px 10px rgba(0,0,0,0.8), 0 0 15px var(--color-secondary-glow);
    margin-top: var(--space-sm);
  }

  .tool-calls {
    margin-bottom: var(--space-sm);
  }

  .tool-call-item {
    background: var(--color-surface-elevated);
    border: 1px solid var(--border-strong);
    border-radius: var(--radius-md);
    padding: var(--space-sm);
    margin-bottom: var(--space-xs);
    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  }

  .tool-call-header {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    font-size: 0.85em;
    font-weight: 600;
    color: var(--text-accent);
  }

  .tool-args {
    margin: var(--space-xs) 0 0 0;
    font-size: 0.8em;
    color: var(--text-secondary);
    background: rgba(0,0,0,0.2);
    padding: 4px 8px;
    border-radius: var(--radius-sm);
    overflow-x: auto;
  }

  .message-content :global(pre) {
    margin: var(--space-sm) 0;
  }

  .message-content :global(code) {
    font-family: var(--font-mono);
    background: rgba(255, 255, 255, 0.1);
    padding: 2px 4px;
    border-radius: 4px;
  }

  .message-content :global(strong) {
    font-weight: 600;
    color: var(--text-primary);
  }

  .message-content :global(a) {
    color: var(--text-accent);
  }

  .cursor-blink {
    animation: blink 0.8s step-start infinite;
    color: var(--accent-primary);
    font-size: 0.9em;
  }

  @keyframes blink {
    50% { opacity: 0; }
  }

  @media (max-width: 768px) {
    .message {
      padding: var(--space-md);
    }
  }

  .typing-indicator {
    display: flex;
    gap: 4px;
    padding: 12px 0;
  }

  .typing-indicator span {
    width: 6px;
    height: 6px;
    background: var(--color-primary);
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
    opacity: 0.6;
  }

  .typing-indicator span:nth-child(1) { animation-delay: 0s; }
  .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
  .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }

  @keyframes typing {
    0%, 60%, 100% { transform: translateY(0); opacity: 0.6; }
    30% { transform: translateY(-4px); opacity: 1; }
  }
</style>
