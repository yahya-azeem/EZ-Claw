<script lang="ts">
    import {
        listPersonas,
        loadIdentity,
        saveCurrentAsPersona,
        createPersona,
        switchPersona,
        deletePersona,
        renamePersona,
        exportPersonas,
        importPersonas,
        getActivePersonaId,
        type PersonaEntry,
    } from "../bridge/identity-bridge";

    interface Props {
        onClose: () => void;
        onPersonaSwitch?: () => void; // callback to refresh the chat identity
    }

    let { onClose, onPersonaSwitch }: Props = $props();

    let personas = $state<PersonaEntry[]>(listPersonas());
    let activeId = $state<string | null>(getActivePersonaId());
    let currentIdentity = $state(loadIdentity());

    // Create persona
    let newPersonaName = $state("");
    let showCreate = $state(false);
    let createFromCurrent = $state(true);

    // Delete confirmation
    let deleteTarget = $state<PersonaEntry | null>(null);
    let deletePhrase = $state("");
    let deleteConfirmCount = $state(0);
    const DELETE_PHRASE = "DELETE THIS PERSONA";
    const REQUIRED_CONFIRMS = 3;

    // Rename
    let renameTarget = $state<string | null>(null);
    let renameValue = $state("");

    // Import/Export
    let importExportStatus = $state("");

    function refresh() {
        personas = listPersonas();
        activeId = getActivePersonaId();
        currentIdentity = loadIdentity();
    }

    function handleCreate() {
        if (!newPersonaName.trim()) return;
        if (createFromCurrent) {
            saveCurrentAsPersona(newPersonaName.trim());
        } else {
            createPersona(newPersonaName.trim(), false);
        }
        newPersonaName = "";
        showCreate = false;
        refresh();
    }

    function handleSwitch(id: string) {
        switchPersona(id);
        refresh();
        onPersonaSwitch?.();
    }

    function handleStartDelete(p: PersonaEntry) {
        deleteTarget = p;
        deletePhrase = "";
        deleteConfirmCount = 0;
    }

    function handleDeleteConfirm() {
        if (deletePhrase.trim().toUpperCase() !== DELETE_PHRASE) return;
        deleteConfirmCount++;
        deletePhrase = "";
        if (deleteConfirmCount >= REQUIRED_CONFIRMS && deleteTarget) {
            deletePersona(deleteTarget.id);
            deleteTarget = null;
            deleteConfirmCount = 0;
            refresh();
        }
    }

    function handleStartRename(p: PersonaEntry) {
        renameTarget = p.id;
        renameValue = p.label;
    }

    function handleRename() {
        if (renameTarget && renameValue.trim()) {
            renamePersona(renameTarget, renameValue.trim());
            renameTarget = null;
            renameValue = "";
            refresh();
        }
    }

    function handleExport() {
        try {
            const json = exportPersonas();
            const blob = new Blob([json], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `ezclaw-personas-${new Date().toISOString().slice(0, 10)}.json`;
            a.click();
            URL.revokeObjectURL(url);
            importExportStatus = "✅ Exported!";
            setTimeout(() => (importExportStatus = ""), 3000);
        } catch {
            importExportStatus = "❌ Export failed";
        }
    }

    function handleImport() {
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".json";
        input.onchange = async () => {
            const file = input.files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const count = importPersonas(text);
                importExportStatus = `✅ Imported ${count} persona(s)`;
                refresh();
                setTimeout(() => (importExportStatus = ""), 3000);
            } catch {
                importExportStatus = "❌ Import failed — invalid file";
            }
        };
        input.click();
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="modal-overlay" onclick={onClose}>
    <div class="panel" onclick={(e) => e.stopPropagation()}>
        <div class="panel-header">
            <h2>🎭 Personas</h2>
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

        <!-- Current Active Identity -->
        <div class="section">
            <h3>Active Identity</h3>
            <div class="active-identity">
                <span class="identity-emoji"
                    >{currentIdentity.emoji || "🦀"}</span
                >
                <div class="identity-info">
                    <strong>{currentIdentity.name || "(unnamed)"}</strong>
                    <span class="identity-vibe"
                        >{currentIdentity.vibe || "not set"}</span
                    >
                </div>
                {#if currentIdentity.creature && currentIdentity.creature !== "AI agent"}
                    <span class="identity-badge"
                        >{currentIdentity.creature}</span
                    >
                {/if}
            </div>
        </div>

        <div class="divider"></div>

        <!-- Persona List -->
        <div class="section">
            <div class="section-header">
                <h3>Saved Personas ({personas.length})</h3>
                <button
                    class="btn btn-sm btn-secondary"
                    onclick={() => (showCreate = !showCreate)}
                >
                    {showCreate ? "✕ Cancel" : "+ New"}
                </button>
            </div>

            {#if showCreate}
                <div class="create-form">
                    <input
                        class="input"
                        type="text"
                        bind:value={newPersonaName}
                        placeholder="Persona name..."
                        onkeydown={(e) => e.key === "Enter" && handleCreate()}
                    />
                    <label class="checkbox-label">
                        <input
                            type="checkbox"
                            bind:checked={createFromCurrent}
                        />
                        Clone current identity
                    </label>
                    <button
                        class="btn btn-primary btn-sm"
                        onclick={handleCreate}
                        disabled={!newPersonaName.trim()}
                    >
                        Create
                    </button>
                </div>
            {/if}

            {#if personas.length === 0}
                <p class="empty-msg">
                    No personas saved yet. Create one to get started!
                </p>
            {:else}
                <div class="persona-list">
                    {#each personas as p (p.id)}
                        <div
                            class="persona-card"
                            class:active={p.id === activeId}
                        >
                            <div class="persona-main">
                                <span class="persona-emoji"
                                    >{p.identity.emoji || "🦀"}</span
                                >
                                <div class="persona-info">
                                    {#if renameTarget === p.id}
                                        <input
                                            class="input input-sm"
                                            bind:value={renameValue}
                                            onkeydown={(e) =>
                                                e.key === "Enter" &&
                                                handleRename()}
                                        />
                                    {:else}
                                        <strong>{p.label}</strong>
                                    {/if}
                                    <span class="persona-sub">
                                        {p.identity.name || "(unnamed)"} · {p
                                            .identity.vibe || "no vibe"}
                                    </span>
                                </div>
                                {#if p.id === activeId}
                                    <span class="active-badge">Active</span>
                                {/if}
                            </div>
                            <div class="persona-actions">
                                {#if p.id !== activeId}
                                    <button
                                        class="btn btn-sm btn-primary"
                                        onclick={() => handleSwitch(p.id)}
                                    >
                                        ▶ Use
                                    </button>
                                {/if}
                                {#if renameTarget === p.id}
                                    <button
                                        class="btn btn-sm btn-secondary"
                                        onclick={handleRename}>✓</button
                                    >
                                {:else}
                                    <button
                                        class="btn btn-sm btn-ghost"
                                        onclick={() => handleStartRename(p)}
                                        >✏️</button
                                    >
                                {/if}
                                <button
                                    class="btn btn-sm btn-danger"
                                    onclick={() => handleStartDelete(p)}
                                    >🗑️</button
                                >
                            </div>
                        </div>
                    {/each}
                </div>
            {/if}
        </div>

        <!-- Delete Confirmation Modal (inline) -->
        {#if deleteTarget}
            <div class="delete-confirm">
                <h3>⚠️ Delete "{deleteTarget.label}"?</h3>
                <p>
                    Type <code>{DELETE_PHRASE}</code> to confirm.
                    <strong>{deleteConfirmCount}/{REQUIRED_CONFIRMS}</strong> confirmations.
                </p>
                <div class="delete-input-row">
                    <input
                        class="input"
                        type="text"
                        bind:value={deletePhrase}
                        placeholder={DELETE_PHRASE}
                        onkeydown={(e) =>
                            e.key === "Enter" && handleDeleteConfirm()}
                    />
                    <button
                        class="btn btn-danger btn-sm"
                        onclick={handleDeleteConfirm}
                    >
                        Confirm ({deleteConfirmCount}/{REQUIRED_CONFIRMS})
                    </button>
                </div>
                <button
                    class="btn btn-ghost btn-sm"
                    onclick={() => {
                        deleteTarget = null;
                        deleteConfirmCount = 0;
                    }}
                >
                    Cancel
                </button>
            </div>
        {/if}

        <div class="divider"></div>

        <!-- Import / Export -->
        <div class="section">
            <h3>Import / Export</h3>
            <div class="io-row">
                <button class="btn btn-secondary" onclick={handleExport}
                    >📤 Export All</button
                >
                <button class="btn btn-secondary" onclick={handleImport}
                    >📥 Import</button
                >
            </div>
            {#if importExportStatus}
                <p class="status-msg">{importExportStatus}</p>
            {/if}
        </div>
    </div>
</div>

<style>
    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: var(--space-lg);
    }
    .panel-header h2 {
        font-size: var(--text-xl);
    }

    .section {
        margin-bottom: var(--space-md);
    }
    .section h3 {
        font-size: var(--text-base);
        color: var(--text-secondary);
        margin-bottom: var(--space-sm);
    }
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-sm);
    }

    .active-identity {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-md);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        border: 1px solid var(--accent-primary);
    }
    .identity-emoji {
        font-size: 2rem;
    }
    .identity-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .identity-info strong {
        color: var(--text-primary);
        font-size: var(--text-base);
    }
    .identity-vibe {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
    }
    .identity-badge {
        font-size: var(--text-xs);
        padding: 2px 8px;
        background: var(--accent-primary);
        color: var(--bg-primary);
        border-radius: var(--radius-full);
        margin-left: auto;
        font-weight: 600;
    }

    .create-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-sm);
        padding: var(--space-sm);
        background: var(--bg-tertiary);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-sm);
    }
    .checkbox-label {
        display: flex;
        align-items: center;
        gap: var(--space-xs);
        font-size: var(--text-sm);
        color: var(--text-secondary);
        cursor: pointer;
    }

    .persona-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
        max-height: 300px;
        overflow-y: auto;
    }
    .persona-card {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
        padding: var(--space-sm);
        background: var(--bg-secondary);
        border-radius: var(--radius-md);
        border: 1px solid transparent;
        transition: border-color 0.2s;
    }
    .persona-card.active {
        border-color: var(--accent-primary);
    }
    .persona-card:hover {
        border-color: var(--text-tertiary);
    }
    .persona-main {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
    }
    .persona-emoji {
        font-size: 1.5rem;
    }
    .persona-info {
        display: flex;
        flex-direction: column;
        gap: 1px;
        flex: 1;
        min-width: 0;
    }
    .persona-info strong {
        color: var(--text-primary);
        font-size: var(--text-sm);
    }
    .persona-sub {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }
    .active-badge {
        font-size: var(--text-xs);
        padding: 2px 6px;
        background: var(--accent-primary);
        color: var(--bg-primary);
        border-radius: var(--radius-full);
        font-weight: 600;
    }
    .persona-actions {
        display: flex;
        gap: var(--space-xs);
        justify-content: flex-end;
    }

    .delete-confirm {
        background: var(--bg-tertiary);
        border: 1px solid #e53e3e;
        border-radius: var(--radius-md);
        padding: var(--space-md);
        margin: var(--space-sm) 0;
    }
    .delete-confirm h3 {
        color: #e53e3e;
        font-size: var(--text-base);
        margin-bottom: var(--space-xs);
    }
    .delete-confirm code {
        background: var(--bg-primary);
        padding: 2px 6px;
        border-radius: var(--radius-sm);
        font-size: var(--text-sm);
        color: #e53e3e;
    }
    .delete-input-row {
        display: flex;
        gap: var(--space-xs);
        margin: var(--space-sm) 0;
    }
    .delete-input-row .input {
        flex: 1;
    }

    .io-row {
        display: flex;
        gap: var(--space-sm);
        flex-wrap: wrap;
    }
    .status-msg {
        margin-top: var(--space-sm);
        font-size: var(--text-sm);
        color: var(--text-secondary);
    }
    .empty-msg {
        font-size: var(--text-sm);
        color: var(--text-tertiary);
        text-align: center;
        padding: var(--space-lg) 0;
    }

    .btn-danger {
        background: transparent;
        color: #e53e3e;
        border: 1px solid #e53e3e;
    }
    .btn-danger:hover {
        background: #e53e3e;
        color: white;
    }
    .input-sm {
        padding: 4px 8px;
        font-size: var(--text-sm);
    }
</style>
