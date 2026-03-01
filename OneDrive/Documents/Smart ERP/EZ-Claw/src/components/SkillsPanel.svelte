<script lang="ts">
    /**
     * SkillsPanel — browse, enable/disable, and create skills.
     * Connects to WasmSkillRegistry for trust-gated skill management.
     */

    interface SkillInfo {
        name: string;
        description: string;
        version: string;
        trust: string;
        source: string;
        enabled: boolean;
        tags: string[];
        required_tools: string[];
    }

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen, onClose }: Props = $props();

    let skills: SkillInfo[] = $state([
        {
            name: "web-research",
            description: "Search the web and summarize findings",
            version: "1.0.0",
            trust: "trusted",
            source: "bundled",
            enabled: true,
            tags: ["search", "web"],
            required_tools: ["web_search", "web_fetch"],
        },
        {
            name: "code-assistant",
            description: "Write, review, and debug code",
            version: "1.0.0",
            trust: "trusted",
            source: "bundled",
            enabled: true,
            tags: ["coding", "programming"],
            required_tools: ["read_file", "write_file", "list_dir"],
        },
        {
            name: "note-taker",
            description: "Take and organize notes in the workspace",
            version: "1.0.0",
            trust: "trusted",
            source: "bundled",
            enabled: true,
            tags: ["notes", "memory"],
            required_tools: ["write_file", "read_file", "memory_store"],
        },
    ]);

    let showCreateForm = $state(false);
    let newSkillMd = $state(`---
name: my-skill
description: What this skill does
version: 1.0.0
trust: untrusted
tags: [tag1, tag2]
activation_keywords: [keyword1, keyword2]
required_tools: []
---
Your skill instructions here.`);

    function toggleSkill(name: string) {
        skills = skills.map((s) =>
            s.name === name ? { ...s, enabled: !s.enabled } : s,
        );
        // TODO: call WasmSkillRegistry.set_enabled(name, !enabled)
    }

    function removeSkill(name: string) {
        if (skills.find((s) => s.name === name)?.source === "bundled") return;
        skills = skills.filter((s) => s.name !== name);
        // TODO: call WasmSkillRegistry.unregister_skill(name)
    }

    function createSkill() {
        // TODO: call WasmSkillRegistry.register_skill(newSkillMd, 'workspace')
        showCreateForm = false;
    }

    const TRUST_COLORS: Record<string, string> = {
        trusted: "var(--success)",
        verified: "var(--accent-primary)",
        untrusted: "var(--warning)",
    };

    const TRUST_ICONS: Record<string, string> = {
        trusted: "🔒",
        verified: "✓",
        untrusted: "⚠️",
    };

    const SOURCE_LABELS: Record<string, string> = {
        bundled: "Built-in",
        managed: "Installed",
        workspace: "Custom",
    };
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="skills-overlay" onclick={onClose}>
        <div
            class="skills-panel glass-elevated"
            onclick={(e) => e.stopPropagation()}
        >
            <div class="panel-header">
                <div class="header-title">
                    <span>⚡</span>
                    <h3>Skills Engine</h3>
                    <span class="skill-count"
                        >{skills.filter((s) => s.enabled)
                            .length}/{skills.length}</span
                    >
                </div>
                <div class="header-actions">
                    <button
                        class="btn btn-sm btn-primary"
                        onclick={() => (showCreateForm = !showCreateForm)}
                    >
                        {showCreateForm ? "✕ Cancel" : "+ New Skill"}
                    </button>
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
            </div>

            {#if showCreateForm}
                <div class="create-form">
                    <textarea
                        class="skill-editor"
                        bind:value={newSkillMd}
                        rows="12"
                    ></textarea>
                    <button class="btn btn-primary" onclick={createSkill}
                        >Register Skill</button
                    >
                </div>
            {/if}

            <div class="skills-list">
                {#each skills as skill}
                    <div class="skill-card" class:disabled={!skill.enabled}>
                        <div class="skill-header">
                            <div class="skill-meta">
                                <span class="skill-name">{skill.name}</span>
                                <span
                                    class="trust-badge"
                                    style:color={TRUST_COLORS[skill.trust]}
                                >
                                    {TRUST_ICONS[skill.trust]}
                                    {skill.trust}
                                </span>
                                <span class="source-badge"
                                    >{SOURCE_LABELS[skill.source] ||
                                        skill.source}</span
                                >
                            </div>
                            <div class="skill-actions">
                                <label class="toggle">
                                    <input
                                        type="checkbox"
                                        checked={skill.enabled}
                                        onchange={() => toggleSkill(skill.name)}
                                    />
                                    <span class="slider"></span>
                                </label>
                                {#if skill.source !== "bundled"}
                                    <button
                                        class="btn btn-ghost btn-icon btn-sm"
                                        onclick={() => removeSkill(skill.name)}
                                        >🗑️</button
                                    >
                                {/if}
                            </div>
                        </div>
                        <p class="skill-desc">{skill.description}</p>
                        <div class="skill-footer">
                            <div class="skill-tags">
                                {#each skill.tags as tag}
                                    <span class="tag">{tag}</span>
                                {/each}
                            </div>
                            <div class="skill-tools">
                                {#each skill.required_tools as tool}
                                    <span class="tool-chip">{tool}</span>
                                {/each}
                            </div>
                        </div>
                    </div>
                {/each}
            </div>
        </div>
    </div>
{/if}

<style>
    .skills-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 100;
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.2s ease-out;
        padding: var(--space-lg);
    }

    .skills-panel {
        width: min(650px, 95vw);
        max-height: 85vh;
        display: flex;
        flex-direction: column;
        border-radius: var(--radius-lg);
        overflow: hidden;
        animation: fadeIn 0.3s ease-out;
    }

    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-md) var(--space-lg);
        border-bottom: 1px solid var(--border);
    }

    .header-title {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
    }

    .header-title h3 {
        margin: 0;
        font-size: var(--text-lg);
    }

    .skill-count {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        background: var(--bg-tertiary);
        padding: 2px 8px;
        border-radius: var(--radius-full);
    }

    .header-actions {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
    }

    .create-form {
        padding: var(--space-md) var(--space-lg);
        border-bottom: 1px solid var(--border);
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
    }

    .skill-editor {
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        color: var(--text-primary);
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        padding: var(--space-md);
        resize: vertical;
        outline: none;
        line-height: 1.5;
    }

    .skill-editor:focus {
        border-color: var(--accent-primary);
    }

    .skills-list {
        flex: 1;
        overflow-y: auto;
        padding: var(--space-md) var(--space-lg);
        display: flex;
        flex-direction: column;
        gap: var(--space-md);
    }

    .skill-card {
        background: var(--bg-tertiary);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        padding: var(--space-md);
        transition: all var(--transition);
    }

    .skill-card:hover {
        border-color: rgba(148, 163, 184, 0.2);
    }
    .skill-card.disabled {
        opacity: 0.5;
    }

    .skill-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-xs);
    }

    .skill-meta {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        flex-wrap: wrap;
    }

    .skill-name {
        font-weight: 600;
        font-family: var(--font-mono);
        font-size: var(--text-sm);
    }

    .trust-badge {
        font-size: var(--text-xs);
        font-weight: 500;
    }

    .source-badge {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        background: var(--bg-secondary);
        padding: 1px 6px;
        border-radius: var(--radius-sm);
    }

    .skill-actions {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
    }

    .skill-desc {
        font-size: var(--text-sm);
        color: var(--text-secondary);
        margin-bottom: var(--space-sm);
    }

    .skill-footer {
        display: flex;
        gap: var(--space-sm);
        flex-wrap: wrap;
        align-items: center;
    }

    .skill-tags,
    .skill-tools {
        display: flex;
        gap: 4px;
        flex-wrap: wrap;
    }

    .tag {
        font-size: var(--text-xs);
        padding: 1px 6px;
        border-radius: var(--radius-full);
        background: rgba(59, 130, 246, 0.1);
        color: var(--text-accent);
    }

    .tool-chip {
        font-size: var(--text-xs);
        padding: 1px 6px;
        border-radius: var(--radius-sm);
        background: var(--bg-secondary);
        color: var(--text-tertiary);
        font-family: var(--font-mono);
    }

    /* Toggle switch */
    .toggle {
        position: relative;
        display: inline-block;
        width: 36px;
        height: 20px;
    }

    .toggle input {
        opacity: 0;
        width: 0;
        height: 0;
    }

    .slider {
        position: absolute;
        cursor: pointer;
        inset: 0;
        background: var(--bg-secondary);
        border-radius: 20px;
        transition: 0.3s;
    }

    .slider::before {
        content: "";
        position: absolute;
        height: 14px;
        width: 14px;
        left: 3px;
        bottom: 3px;
        background: white;
        border-radius: 50%;
        transition: 0.3s;
    }

    .toggle input:checked + .slider {
        background: var(--accent-primary);
    }
    .toggle input:checked + .slider::before {
        transform: translateX(16px);
    }

    @media (max-width: 768px) {
        .skills-panel {
            width: 100vw;
            max-height: 100vh;
            border-radius: 0;
        }
        .skills-overlay {
            padding: 0;
        }
    }
</style>
