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
    background: rgba(30, 41, 59, 0.3);
    border-radius: var(--radius-lg);
    margin-top: var(--space-xs);
    margin-bottom: var(--space-xs);
  }

  .message.tool {
    background: rgba(15, 23, 42, 0.2);
    border-left: 3px solid var(--accent-primary);
    padding: var(--space-md) var(--space-xl);
    font-size: 0.95em;
    opacity: 0.85;
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
  }

  .avatar-assistant {
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    font-size: 18px;
  }

  .avatar-tool {
    background: var(--bg-secondary);
    border: 1px solid var(--border);
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
    background: #0f172a;
    color: #38bdf8;
    padding: var(--space-md);
    border-radius: var(--radius-md);
    font-family: var(--font-mono);
    font-size: 0.9em;
    white-space: pre-wrap;
    border: 1px solid #1e293b;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
    margin-top: var(--space-sm);
  }

  .tool-calls {
    margin-bottom: var(--space-sm);
  }

  .tool-call-item {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: var(--radius-md);
    padding: var(--space-sm);
    margin-bottom: var(--space-xs);
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
</style>
