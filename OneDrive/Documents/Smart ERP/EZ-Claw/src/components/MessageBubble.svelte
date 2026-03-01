<script lang="ts">
  interface Props {
    role: string;
    content: string;
    isStreaming?: boolean;
  }

  let { role, content, isStreaming = false }: Props = $props();

  // Simple markdown rendering (code blocks, bold, italic, links)
  function renderMarkdown(text: string): string {
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

<div class="message" class:user={role === 'user'} class:assistant={role === 'assistant'}>
  <div class="message-avatar">
    {#if role === 'user'}
      <div class="avatar avatar-user">U</div>
    {:else}
      <div class="avatar avatar-assistant">🦀</div>
    {/if}
  </div>

  <div class="message-body">
    <div class="message-role">
      {role === 'user' ? 'You' : 'EZ-Claw'}
    </div>
    <div class="message-content">
      {#if isStreaming && !content}
        <div class="typing-indicator">
          <span></span><span></span><span></span>
        </div>
      {:else}
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

  .message.user {
    /* User messages slightly different bg */
  }

  .message.assistant {
    background: rgba(30, 41, 59, 0.3);
    border-radius: var(--radius-lg);
    margin-top: var(--space-xs);
    margin-bottom: var(--space-xs);
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

  .message-content :global(pre) {
    margin: var(--space-sm) 0;
  }

  .message-content :global(code) {
    font-size: 0.85em;
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
