<script lang="ts">
    /**
     * SkillsPanel — manage skills, tools, and skill sets.
     * Now backed by the modular skills-layer for hot-swapping.
     */
    import {
        initSkills,
        getSkills,
        addSkill,
        removeSkill,
        updateSkill,
        getSkillInstructions,
        getSkillTools,
        saveSkillSet,
        listSkillSets,
        swapSkillSet,
        deleteSkillSet,
        exportSkills,
        importSkills,
        getActiveSkillSetId,
        onSkillEvent,
        type SkillDef,
        type SkillSet,
    } from "../layers/skills-layer";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen, onClose }: Props = $props();

    let skills: SkillDef[] = $state([]);
    let skillSets: SkillSet[] = $state([]);
    let activeSkillSetId: string | null = $state(null);
    let showCreateForm = $state(false);
    let showSkillSets = $state(false);
    let showExportImport = $state(false);
    let newSkillName = $state("");
    let newSkillDesc = $state("");
    let newSkillInstructions = $state("");
    let newSkillSetLabel = $state("");
    let importJson = $state("");
    let editingSkillId: string | null = $state(null);

    $effect(() => {
        if (isOpen) {
            skills = initSkills();
            skillSets = listSkillSets();
            activeSkillSetId = getActiveSkillSetId();
        }
    });

    function handleAddSkill() {
        if (newSkillName.trim() && newSkillDesc.trim()) {
            addSkill({
                name: newSkillName.trim(),
                description: newSkillDesc.trim(),
                instructions: newSkillInstructions.trim(),
                tools: [],
                notes: [],
            });
            skills = getSkills();
            showCreateForm = false;
            newSkillName = "";
            newSkillDesc = "";
            newSkillInstructions = "";
        }
    }

    function handleRemoveSkill(skillId: string) {
        if (confirm("Remove this skill?")) {
            removeSkill(skillId);
            skills = getSkills();
        }
    }

    function handleAddNote(skillId: string) {
        const note = prompt("Add a note:");
        if (note) {
            const skill = skills.find((s) => s.id === skillId);
            if (skill) {
                updateSkill(skillId, { notes: [...skill.notes, note] });
                skills = getSkills();
            }
        }
    }

    function handleSaveSkillSet() {
        if (newSkillSetLabel.trim()) {
            saveSkillSet(newSkillSetLabel.trim());
            skillSets = listSkillSets();
            newSkillSetLabel = "";
        }
    }

    function handleSwapSkillSet(setId: string) {
        swapSkillSet(setId);
        skills = getSkills();
        activeSkillSetId = getActiveSkillSetId();
    }

    function handleDeleteSkillSet(setId: string) {
        if (confirm("Delete this skill set?")) {
            deleteSkillSet(setId);
            skillSets = listSkillSets();
        }
    }

    function handleExport() {
        const json = exportSkills();
        navigator.clipboard.writeText(json);
        alert("Skills exported to clipboard!");
    }

    function handleImport() {
        if (importJson.trim()) {
            const count = importSkills(importJson.trim());
            if (count > 0) {
                skills = getSkills();
                skillSets = listSkillSets();
                importJson = "";
                showExportImport = false;
                alert(`Imported ${count} items!`);
            } else {
                alert("Import failed — invalid JSON.");
            }
        }
    }
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
                    <span class="skill-count">{skills.length} skills</span>
                </div>
                <div class="header-actions">
                    <button
                        class="btn btn-sm"
                        class:active={showSkillSets}
                        onclick={() => {
                            showSkillSets = !showSkillSets;
                            showCreateForm = false;
                            showExportImport = false;
                        }}
                    >
                        🔀 Skill Sets
                    </button>
                    <button
                        class="btn btn-sm"
                        onclick={() => {
                            showCreateForm = !showCreateForm;
                            showSkillSets = false;
                            showExportImport = false;
                        }}
                    >
                        ➕ New Skill
                    </button>
                    <button
                        class="btn btn-sm"
                        onclick={() => {
                            showExportImport = !showExportImport;
                            showSkillSets = false;
                            showCreateForm = false;
                        }}
                    >
                        📦 Import/Export
                    </button>
                    <button
                        class="close-btn"
                        onclick={onClose}
                        aria-label="Close">✕</button
                    >
                </div>
            </div>

            <!-- Skill Sets Panel -->
            {#if showSkillSets}
                <div class="sub-panel">
                    <div class="sub-header">
                        <h4>🔀 Skill Sets — Hot Swap</h4>
                        <div class="save-form">
                            <input
                                type="text"
                                bind:value={newSkillSetLabel}
                                placeholder="Save current as..."
                                class="input-sm"
                            />
                            <button
                                class="btn btn-sm btn-primary"
                                onclick={handleSaveSkillSet}>💾 Save</button
                            >
                        </div>
                    </div>
                    <div class="set-list">
                        {#each skillSets as set}
                            <div
                                class="set-card"
                                class:active={activeSkillSetId === set.id}
                            >
                                <div class="set-info">
                                    <span class="set-name">{set.label}</span>
                                    <span class="set-detail"
                                        >{set.skills.length} skills · {new Date(
                                            set.createdAt,
                                        ).toLocaleDateString()}</span
                                    >
                                </div>
                                <div class="set-actions">
                                    {#if activeSkillSetId === set.id}
                                        <span class="active-badge">Active</span>
                                    {:else}
                                        <button
                                            class="btn btn-sm btn-primary"
                                            onclick={() =>
                                                handleSwapSkillSet(set.id)}
                                            >⚡ Swap</button
                                        >
                                    {/if}
                                    <button
                                        class="btn btn-sm btn-ghost"
                                        onclick={() =>
                                            handleDeleteSkillSet(set.id)}
                                        >🗑️</button
                                    >
                                </div>
                            </div>
                        {/each}
                        {#if skillSets.length === 0}
                            <p class="empty-hint">
                                No saved skill sets. Save your current skills to
                                swap later.
                            </p>
                        {/if}
                    </div>
                </div>
            {/if}

            <!-- Create Skill Form -->
            {#if showCreateForm}
                <div class="sub-panel">
                    <h4>➕ New Skill</h4>
                    <div class="create-form">
                        <input
                            type="text"
                            bind:value={newSkillName}
                            placeholder="Skill name"
                            class="input-sm"
                        />
                        <input
                            type="text"
                            bind:value={newSkillDesc}
                            placeholder="Description"
                            class="input-sm"
                        />
                        <textarea
                            bind:value={newSkillInstructions}
                            placeholder="Instructions (injected into system prompt)"
                            rows="4"
                            class="input-sm textarea"
                        ></textarea>
                        <button class="btn btn-primary" onclick={handleAddSkill}
                            >Create Skill</button
                        >
                    </div>
                </div>
            {/if}

            <!-- Import/Export -->
            {#if showExportImport}
                <div class="sub-panel">
                    <h4>📦 Import / Export</h4>
                    <div class="ie-actions">
                        <button class="btn btn-primary" onclick={handleExport}
                            >📋 Export to Clipboard</button
                        >
                        <textarea
                            bind:value={importJson}
                            placeholder="Paste exported JSON here..."
                            rows="4"
                            class="input-sm textarea"
                        ></textarea>
                        <button class="btn btn-primary" onclick={handleImport}
                            >📥 Import</button
                        >
                    </div>
                </div>
            {/if}

            <!-- Skills List -->
            <div class="skills-list">
                {#each skills as skill}
                    <div class="skill-card">
                        <div class="skill-header">
                            <div class="skill-meta">
                                <span class="skill-name">{skill.name}</span>
                            </div>
                            <div class="skill-actions">
                                <button
                                    class="btn btn-sm btn-ghost"
                                    onclick={() => handleAddNote(skill.id)}
                                    title="Add note">📝</button
                                >
                                <button
                                    class="btn btn-sm btn-ghost"
                                    onclick={() => handleRemoveSkill(skill.id)}
                                    title="Remove">🗑️</button
                                >
                            </div>
                        </div>
                        <p class="skill-desc">{skill.description}</p>
                        {#if skill.instructions}
                            <div class="skill-instructions">
                                <span class="label">Instructions:</span>
                                <p>{skill.instructions}</p>
                            </div>
                        {/if}
                        {#if skill.notes.length > 0}
                            <div class="skill-notes">
                                <span class="label">Notes:</span>
                                {#each skill.notes as note}
                                    <span class="note-chip">{note}</span>
                                {/each}
                            </div>
                        {/if}
                        {#if skill.tools.length > 0}
                            <div class="skill-tools">
                                <span class="label">Tools:</span>
                                {#each skill.tools as tool}
                                    <span class="tool-chip"
                                        >{tool.function.name}</span
                                    >
                                {/each}
                            </div>
                        {/if}
                    </div>
                {/each}
                {#if skills.length === 0}
                    <div class="empty-state">
                        <p>No skills configured.</p>
                        <button
                            class="btn btn-primary"
                            onclick={() => (showCreateForm = true)}
                            >Create your first skill</button
                        >
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .skills-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(4px);
        z-index: 1000;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: var(--space-lg);
    }

    .skills-panel {
        width: 100%;
        max-width: 750px;
        max-height: 80vh;
        display: flex;
        flex-direction: column;
        border-radius: var(--radius-lg);
        overflow: hidden;
    }

    .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-sm) var(--space-md);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(22, 27, 34, 0.9);
        flex-wrap: wrap;
        gap: var(--space-sm);
    }

    .header-title {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
    }
    .header-title h3 {
        margin: 0;
        font-size: var(--text-md);
    }
    .skill-count {
        background: rgba(99, 102, 241, 0.15);
        color: var(--accent-primary);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
    }

    .header-actions {
        display: flex;
        gap: var(--space-xs);
        align-items: center;
    }

    .close-btn {
        background: none;
        border: none;
        color: var(--text-tertiary);
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
    }
    .close-btn:hover {
        color: var(--text-primary);
    }

    .sub-panel {
        padding: var(--space-md);
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        background: rgba(0, 0, 0, 0.15);
    }
    .sub-panel h4 {
        margin: 0 0 var(--space-sm);
        font-size: var(--text-sm);
        color: var(--text-primary);
    }
    .sub-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: var(--space-sm);
        margin-bottom: var(--space-sm);
    }
    .save-form {
        display: flex;
        gap: var(--space-xs);
    }

    .create-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
    }
    .ie-actions {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
    }

    .input-sm {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        padding: 6px 10px;
        font-size: var(--text-sm);
    }
    .textarea {
        font-family: "JetBrains Mono", monospace;
        resize: vertical;
        min-height: 60px;
    }

    .set-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
    }
    .set-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-sm) var(--space-md);
        background: rgba(0, 0, 0, 0.12);
        border-radius: var(--radius-sm);
        border: 1px solid transparent;
    }
    .set-card.active {
        border-color: rgba(99, 102, 241, 0.4);
    }
    .set-info {
        display: flex;
        flex-direction: column;
    }
    .set-name {
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--text-primary);
    }
    .set-detail {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
    }
    .set-actions {
        display: flex;
        gap: var(--space-xs);
        align-items: center;
    }
    .active-badge {
        background: rgba(63, 185, 80, 0.15);
        color: #3fb950;
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
        font-weight: 600;
    }

    .skills-list {
        flex: 1;
        overflow-y: auto;
        padding: var(--space-md);
    }

    .skill-card {
        padding: var(--space-md);
        background: rgba(0, 0, 0, 0.12);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-sm);
        border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .skill-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-xs);
    }
    .skill-name {
        font-weight: 600;
        font-size: var(--text-sm);
        color: var(--text-primary);
    }
    .skill-actions {
        display: flex;
        gap: 4px;
    }
    .skill-desc {
        font-size: var(--text-xs);
        color: var(--text-secondary);
        margin: 0 0 var(--space-xs);
    }

    .skill-instructions,
    .skill-notes,
    .skill-tools {
        margin-top: var(--space-xs);
        font-size: var(--text-xs);
    }
    .label {
        color: var(--text-tertiary);
        font-weight: 600;
        margin-right: var(--space-xs);
    }
    .skill-instructions p {
        margin: 2px 0 0;
        color: var(--text-secondary);
        font-style: italic;
    }
    .note-chip,
    .tool-chip {
        display: inline-block;
        background: rgba(99, 102, 241, 0.1);
        color: var(--accent-primary);
        padding: 1px 6px;
        border-radius: var(--radius-sm);
        font-size: 10px;
        margin: 2px;
    }

    .empty-state {
        text-align: center;
        padding: var(--space-xl);
        color: var(--text-tertiary);
    }
    .empty-hint {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        font-style: italic;
    }

    .btn {
        cursor: pointer;
        border: none;
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
        padding: 4px 10px;
        transition: all 0.15s;
        background: rgba(255, 255, 255, 0.06);
        color: var(--text-secondary);
    }
    .btn:hover {
        background: rgba(255, 255, 255, 0.1);
    }
    .btn.active {
        background: rgba(99, 102, 241, 0.2);
        color: var(--accent-primary);
    }
    .btn-sm {
        font-size: var(--text-xs);
        padding: 4px 10px;
    }
    .btn-primary {
        background: rgba(99, 102, 241, 0.25);
        color: var(--accent-primary);
    }
    .btn-primary:hover {
        background: rgba(99, 102, 241, 0.4);
    }
    .btn-ghost {
        background: none;
        color: var(--text-secondary);
    }
    .btn-ghost:hover {
        background: rgba(255, 255, 255, 0.05);
    }
</style>
