<script lang="ts">
    /**
     * WorkspacePanel — file browser + identity editor.
     * Lets users view/edit workspace files (SOUL.md, AGENTS.md, skills/, notes/).
     */

    interface DirEntry {
        name: string;
        is_dir: boolean;
        size: number;
    }

    interface Props {
        isOpen: boolean;
        onClose: () => void;
    }

    let { isOpen, onClose }: Props = $props();

    let currentPath = $state("/");
    let entries: DirEntry[] = $state([]);
    let selectedFile = $state("");
    let fileContent = $state("");
    let isEditing = $state(false);
    let editContent = $state("");
    let pathHistory: string[] = $state(["/"]);

    // Simulated workspace data (will be connected to WasmWorkspace)
    $effect(() => {
        if (isOpen) {
            loadDirectory(currentPath);
        }
    });

    function loadDirectory(path: string) {
        // TODO: Connect to WasmWorkspace
        // For now, show default structure
        if (path === "/") {
            entries = [
                { name: "skills", is_dir: true, size: 0 },
                { name: "notes", is_dir: true, size: 0 },
                { name: "SOUL.md", is_dir: false, size: 156 },
                { name: "AGENTS.md", is_dir: false, size: 98 },
            ];
        } else if (path === "/skills") {
            entries = [];
        } else if (path === "/notes") {
            entries = [];
        }
        selectedFile = "";
        fileContent = "";
        isEditing = false;
    }

    function navigateTo(path: string) {
        currentPath = path;
        pathHistory = [...pathHistory, path];
        loadDirectory(path);
    }

    function navigateUp() {
        const parts = currentPath.split("/").filter(Boolean);
        parts.pop();
        const parent = "/" + parts.join("/");
        navigateTo(parent || "/");
    }

    function openEntry(entry: DirEntry) {
        if (entry.is_dir) {
            const newPath =
                currentPath === "/"
                    ? `/${entry.name}`
                    : `${currentPath}/${entry.name}`;
            navigateTo(newPath);
        } else {
            selectedFile = entry.name;
            // TODO: Read from WasmWorkspace
            if (entry.name === "SOUL.md") {
                fileContent =
                    "# Agent Identity\n\nYou are EZ-Claw, a helpful and capable AI assistant.\nYou are thorough, honest, and security-conscious.\nYou run entirely in the user's browser — no data leaves without permission.\n";
            } else if (entry.name === "AGENTS.md") {
                fileContent =
                    "# Workspace Instructions\n\nThis is your workspace. You can create files, notes, and skills here.\nAll data is stored locally on the user's device.\n";
            } else {
                fileContent = "(file content)";
            }
        }
    }

    function startEdit() {
        editContent = fileContent;
        isEditing = true;
    }

    function saveEdit() {
        fileContent = editContent;
        isEditing = false;
        // TODO: Write to WasmWorkspace
    }

    function cancelEdit() {
        editContent = "";
        isEditing = false;
    }

    function formatSize(bytes: number): string {
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="workspace-overlay" onclick={onClose}>
        <div
            class="workspace-panel glass-elevated"
            onclick={(e) => e.stopPropagation()}
        >
            <div class="panel-header">
                <h3>📂 Workspace</h3>
                <button
                    class="btn btn-ghost btn-icon"
                    onclick={onClose}
                    aria-label="Close workspace"
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

            <div class="panel-body">
                <!-- Breadcrumb -->
                <div class="breadcrumb">
                    <button class="crumb" onclick={() => navigateTo("/")}
                        >~</button
                    >
                    {#each currentPath.split("/").filter(Boolean) as part, i}
                        <span class="crumb-sep">/</span>
                        <button
                            class="crumb"
                            onclick={() =>
                                navigateTo(
                                    "/" +
                                        currentPath
                                            .split("/")
                                            .filter(Boolean)
                                            .slice(0, i + 1)
                                            .join("/"),
                                )}>{part}</button
                        >
                    {/each}
                </div>

                <div class="panel-content">
                    <!-- File list -->
                    <div class="file-list">
                        {#if currentPath !== "/"}
                            <div class="file-entry" onclick={navigateUp}>
                                <span class="file-icon">⬆️</span>
                                <span class="file-name">..</span>
                            </div>
                        {/if}
                        {#each entries as entry}
                            <div
                                class="file-entry"
                                class:active={selectedFile === entry.name}
                                onclick={() => openEntry(entry)}
                            >
                                <span class="file-icon"
                                    >{entry.is_dir ? "📁" : "📄"}</span
                                >
                                <span class="file-name">{entry.name}</span>
                                {#if !entry.is_dir}
                                    <span class="file-size"
                                        >{formatSize(entry.size)}</span
                                    >
                                {/if}
                            </div>
                        {/each}
                        {#if entries.length === 0}
                            <div class="empty-dir">
                                <p>Empty directory</p>
                            </div>
                        {/if}
                    </div>

                    <!-- File preview/editor -->
                    {#if selectedFile}
                        <div class="file-preview">
                            <div class="preview-header">
                                <span class="preview-title">{selectedFile}</span
                                >
                                {#if !isEditing}
                                    <button
                                        class="btn btn-sm btn-secondary"
                                        onclick={startEdit}>Edit</button
                                    >
                                {:else}
                                    <div class="edit-actions">
                                        <button
                                            class="btn btn-sm btn-primary"
                                            onclick={saveEdit}>Save</button
                                        >
                                        <button
                                            class="btn btn-sm btn-ghost"
                                            onclick={cancelEdit}>Cancel</button
                                        >
                                    </div>
                                {/if}
                            </div>
                            {#if isEditing}
                                <textarea
                                    class="file-editor"
                                    bind:value={editContent}
                                ></textarea>
                            {:else}
                                <pre class="file-content">{fileContent}</pre>
                            {/if}
                        </div>
                    {/if}
                </div>
            </div>

            <div class="panel-footer">
                <button
                    class="btn btn-sm btn-secondary"
                    onclick={() => {
                        /* TODO: export */
                    }}
                >
                    📥 Export
                </button>
                <button
                    class="btn btn-sm btn-secondary"
                    onclick={() => {
                        /* TODO: import */
                    }}
                >
                    📤 Import
                </button>
            </div>
        </div>
    </div>
{/if}

<style>
    .workspace-overlay {
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(4px);
        -webkit-backdrop-filter: blur(4px);
        z-index: 100;
        display: flex;
        justify-content: flex-end;
        animation: fadeIn 0.2s ease-out;
    }

    .workspace-panel {
        width: min(600px, 90vw);
        height: 100%;
        display: flex;
        flex-direction: column;
        animation: slideInRight 0.3s ease-out;
        border-left: 1px solid var(--border);
    }

    .panel-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-md) var(--space-lg);
        border-bottom: 1px solid var(--border);
    }

    .panel-header h3 {
        font-size: var(--text-lg);
        margin: 0;
    }

    .panel-body {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
    }

    .breadcrumb {
        display: flex;
        align-items: center;
        gap: 2px;
        padding: var(--space-sm) var(--space-lg);
        border-bottom: 1px solid var(--border);
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        overflow-x: auto;
        flex-shrink: 0;
    }

    .crumb {
        background: none;
        border: none;
        color: var(--text-accent);
        cursor: pointer;
        font-family: inherit;
        font-size: inherit;
        padding: 2px 4px;
        border-radius: var(--radius-sm);
        transition: background var(--transition);
    }

    .crumb:hover {
        background: var(--bg-hover);
    }

    .crumb-sep {
        color: var(--text-tertiary);
    }

    .panel-content {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
    }

    .file-list {
        flex-shrink: 0;
        max-height: 40%;
        overflow-y: auto;
        border-bottom: 1px solid var(--border);
    }

    .file-entry {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: var(--space-sm) var(--space-lg);
        cursor: pointer;
        transition: background var(--transition);
        font-size: var(--text-sm);
    }

    .file-entry:hover {
        background: var(--bg-hover);
    }

    .file-entry.active {
        background: rgba(59, 130, 246, 0.1);
        border-left: 2px solid var(--accent-primary);
    }

    .file-icon {
        flex-shrink: 0;
    }

    .file-name {
        flex: 1;
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--text-primary);
    }

    .file-size {
        font-family: var(--font-mono);
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        flex-shrink: 0;
    }

    .empty-dir {
        text-align: center;
        padding: var(--space-xl);
        color: var(--text-tertiary);
        font-size: var(--text-sm);
    }

    .file-preview {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-height: 0;
        overflow: hidden;
    }

    .preview-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-sm) var(--space-lg);
        border-bottom: 1px solid var(--border);
        flex-shrink: 0;
    }

    .preview-title {
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        font-weight: 500;
        color: var(--text-accent);
    }

    .edit-actions {
        display: flex;
        gap: var(--space-xs);
    }

    .file-content {
        flex: 1;
        padding: var(--space-md) var(--space-lg);
        overflow: auto;
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        line-height: 1.6;
        white-space: pre-wrap;
        word-break: break-word;
        margin: 0;
        background: transparent;
        border: none;
        color: var(--text-primary);
    }

    .file-editor {
        flex: 1;
        padding: var(--space-md) var(--space-lg);
        background: var(--bg-tertiary);
        border: none;
        color: var(--text-primary);
        font-family: var(--font-mono);
        font-size: var(--text-sm);
        line-height: 1.6;
        resize: none;
        outline: none;
    }

    .panel-footer {
        display: flex;
        gap: var(--space-sm);
        padding: var(--space-md) var(--space-lg);
        border-top: 1px solid var(--border);
        flex-shrink: 0;
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
        }
        to {
            transform: translateX(0);
        }
    }

    @media (max-width: 768px) {
        .workspace-panel {
            width: 100vw;
        }
    }
</style>
