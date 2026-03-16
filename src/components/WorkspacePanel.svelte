<script lang="ts">
    import { onMount, tick } from "svelte";
    import TerminalView from "./TerminalView.svelte";
    import {
        SandboxManager,
        type SandboxTier,
        type ShellResult,
    } from "../bridge/sandbox-manager";
    /**
     * WorkspacePanel — unified workspace, container, and layer management.
     *
     * Four tabs:
     *   📁 Files — browse/edit workspace files (OPFS or user-picked directory)
     *   🐧 Container — manage container2wasm images, hot-swap, status
     *   🔀 Layers — hot-swap persona, skills, view layer state
     *   >_ Terminal — manual shell for technical users
     */
    import {
        initWorkspace,
        listFiles,
        readFile,
        writeFile,
        deleteEntry,
        mkdir,
        pickDirectory,
        isWorkspaceMounted,
        getWorkspaceHandle,
        type WorkspaceFile,
    } from "../layers/workspace-layer";
    import {
        getContainerImages,
        getContainerStatusForSession,
        swapContainer,
        loadContainer,
        isContainerReady,
        registerImage,
        removeImage,
        detectArch,
        onC2WEvent,
        type ContainerImage,
        type ContainerArch,
        C2WRuntime,
    } from "../bridge/container2wasm-runtime";
    import {
        getSkills,
        swapSkillSet,
        listSkillSets,
        saveSkillSet,
        deleteSkillSet,
        getActiveSkillSetId,
        type SkillSet,
    } from "../layers/skills-layer";
    import {
        listPersonas,
        getActivePersonaId,
        swapPersona,
        getPersona,
        type PersonaEntry,
    } from "../layers/persona-layer";

    interface Props {
        isOpen: boolean;
        onClose: () => void;
        sessionId: string | null;
    }

    let { isOpen, onClose, sessionId }: Props = $props();

    // ── Tab State ────────────────────────────────────────────────
    type Tab = "files" | "container" | "layers" | "terminal";
    let activeTab: Tab = $state("files");

    // ── Files Tab ────────────────────────────────────────────────
    let files: WorkspaceFile[] = $state([]);
    let currentPath = $state("/");
    let selectedFile: string | null = $state(null);
    let fileContent = $state("");
    let isEditing = $state(false);
    let editContent = $state("");

    // ── Container Tab ────────────────────────────────────────────
    let containerImages: ContainerImage[] = $state([]);
    let containerStatus: { ready: boolean, image: string | null, os: string, arch: ContainerArch } = $state({ ready: false, image: null, os: 'none', arch: detectArch() as ContainerArch });
    let loadProgress = $state(0);
    let isLoadingContainer = $state(false);
    let showAddImage = $state(false);
    let newImageUrl = $state("");
    let newImageName = $state("");
    let newImageOS = $state("alpine");

    // Helper to refresh status
    function refreshStatus() {
        containerStatus = getContainerStatusForSession(sessionId);
    }

    // ── Layers Tab ───────────────────────────────────────────────
    let personas: PersonaEntry[] = $state([]);
    let activePersonaId: string | null = $state(null);
    let skillSets: SkillSet[] = $state([]);
    let activeSkillSetId: string | null = $state(null);
    let showSaveSkillSet = $state(false);
    let newSkillSetLabel = $state("");

    // ── Effects ──────────────────────────────────────────────────

    $effect(() => {
        if (isOpen) {
            loadCurrentTab();
        }
    });

    function loadCurrentTab() {
        if (activeTab === "files") {
            loadFiles();
        } else if (activeTab === "container") {
            containerImages = getContainerImages();
            refreshStatus();
        } else if (activeTab === "layers") {
            personas = listPersonas();
            activePersonaId = getActivePersonaId();
            skillSets = listSkillSets();
            activeSkillSetId = getActiveSkillSetId();
        }
    }

    async function loadFiles() {
        try {
            if (!isWorkspaceMounted()) {
                await initWorkspace();
            }
            files = await listFiles(currentPath);
        } catch {
            files = [];
        }
    }

    // ── File Operations ──────────────────────────────────────────

    async function navigateTo(path: string) {
        currentPath = path;
        selectedFile = null;
        isEditing = false;
        await loadFiles();
    }

    async function openEntry(entry: WorkspaceFile) {
        if (entry.isDirectory) {
            await navigateTo(entry.path);
        } else {
            selectedFile = entry.path;
            try {
                fileContent = await readFile(entry.path);
            } catch {
                fileContent = "(unable to read file)";
            }
        }
    }

    async function startEdit() {
        editContent = fileContent;
        isEditing = true;
    }

    async function saveEdit() {
        if (selectedFile) {
            await writeFile(selectedFile, editContent);
            fileContent = editContent;
        }
        isEditing = false;
    }

    async function handlePickDirectory() {
        const handle = await pickDirectory();
        if (handle) {
            currentPath = "/";
            await loadFiles();
        }
    }

    async function handleCreateFile() {
        const name = prompt("File name:");
        if (name) {
            const path =
                currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;
            await writeFile(path, "");
            await loadFiles();
        }
    }

    async function handleCreateDir() {
        const name = prompt("Directory name:");
        if (name) {
            const path =
                currentPath === "/" ? `/${name}` : `${currentPath}/${name}`;
            await mkdir(path);
            await loadFiles();
        }
    }

    async function handleDelete(entry: WorkspaceFile) {
        if (confirm(`Delete ${entry.name}?`)) {
            await deleteEntry(entry.path);
            await loadFiles();
            if (selectedFile === entry.path) selectedFile = null;
        }
    }

    // ── Container Operations ─────────────────────────────────────

    async function handleLoadContainer(imageId: string) {
        isLoadingContainer = true;
        loadProgress = 0;

        const rt = C2WRuntime.getInstance(sessionId || "default");
        const unsub = rt.onEvent("c2w:progress", (data: any) => {
            loadProgress = data.percent;
        });

        try {
            await rt.loadContainer(imageId);
            refreshStatus();
        } catch (e: any) {
            alert(`Failed to load container: ${e.message}`);
        } finally {
            isLoadingContainer = false;
            unsub();
        }
    }

    async function handleSwapContainer(imageId: string) {
        isLoadingContainer = true;
        loadProgress = 0;

        const rt = C2WRuntime.getInstance(sessionId || "default");
        const unsub = rt.onEvent("c2w:progress", (data: any) => {
            loadProgress = data.percent;
        });

        try {
            await rt.swapContainer(imageId);
            refreshStatus();
        } catch (e: any) {
            alert(`Failed to swap container: ${e.message}`);
        } finally {
            isLoadingContainer = false;
            unsub();
        }
    }

    function handleAddImage() {
        if (newImageUrl && newImageName) {
            registerImage({
                name: newImageName,
                os: newImageOS,
                arch: detectArch(),
                wasmUrl: newImageUrl,
                description: `Custom ${newImageOS} container`,
            });
            containerImages = getContainerImages();
            showAddImage = false;
            newImageUrl = "";
            newImageName = "";
        }
    }

    function handleRemoveImage(imageId: string) {
        if (confirm("Remove this container image?")) {
            removeImage(imageId);
            containerImages = getContainerImages();
        }
    }

    // ── Layer Operations ─────────────────────────────────────────

    function handleSwapPersona(personaId: string) {
        swapPersona(personaId);
        activePersonaId = getActivePersonaId();
    }

    function handleSwapSkillSet(setId: string) {
        swapSkillSet(setId);
        activeSkillSetId = getActiveSkillSetId();
    }

    function handleSaveSkillSet() {
        if (newSkillSetLabel.trim()) {
            saveSkillSet(newSkillSetLabel.trim());
            skillSets = listSkillSets();
            showSaveSkillSet = false;
            newSkillSetLabel = "";
        }
    }

    function handleDeleteSkillSet(setId: string) {
        if (confirm("Delete this skill set?")) {
            deleteSkillSet(setId);
            skillSets = listSkillSets();
        }
    }

    function formatSize(bytes?: number): string {
        if (!bytes) return "";
        if (bytes < 1024) return `${bytes}B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
    }
</script>

{#if isOpen}
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div class="ws-overlay" onclick={onClose}>
        <div
            class="ws-panel glass-elevated"
            onclick={(e) => e.stopPropagation()}
        >
            <!-- Header -->
            <div class="ws-header">
                <div class="ws-tabs">
                    <button
                        class="ws-tab"
                        class:active={activeTab === "files"}
                        onclick={() => {
                            activeTab = "files";
                            loadCurrentTab();
                        }}>📁 Files</button
                    >
                    <button
                        class="ws-tab"
                        class:active={activeTab === "container"}
                        onclick={() => {
                            activeTab = "container";
                            loadCurrentTab();
                        }}>🐧 Container</button
                    >
                    <button
                        class="ws-tab"
                        class:active={activeTab === "layers"}
                        onclick={() => {
                            activeTab = "layers";
                            loadCurrentTab();
                        }}>🔀 Layers</button
                    >
                    <button
                        class="ws-tab"
                        class:active={activeTab === "terminal"}
                        onclick={() => {
                            activeTab = "terminal";
                        }}>>_ Terminal</button
                    >
                </div>
                <button class="close-btn" onclick={onClose} aria-label="Close"
                    >✕</button
                >
            </div>

            <div class="ws-body">
                <!-- ═══ FILES TAB ═══ -->
                {#if activeTab === "files"}
                    <div class="files-toolbar">
                        <div class="breadcrumb">
                            <button
                                class="crumb"
                                onclick={() => navigateTo("/")}>~</button
                            >
                            {#each currentPath
                                .split("/")
                                .filter(Boolean) as part, i}
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
                        <div class="toolbar-actions">
                            <button
                                class="btn btn-sm btn-ghost"
                                onclick={handleCreateFile}
                                title="New file">📄+</button
                            >
                            <button
                                class="btn btn-sm btn-ghost"
                                onclick={handleCreateDir}
                                title="New folder">📁+</button
                            >
                            <button
                                class="btn btn-sm btn-primary"
                                onclick={handlePickDirectory}
                                >📂 Open Folder</button
                            >
                        </div>
                    </div>

                    <div class="files-content">
                        <div class="file-list">
                            {#if currentPath !== "/"}
                                <button
                                    class="file-entry"
                                    onclick={() =>
                                        navigateTo(
                                            "/" +
                                                currentPath
                                                    .split("/")
                                                    .filter(Boolean)
                                                    .slice(0, -1)
                                                    .join("/") || "/",
                                        )}
                                >
                                    <span class="file-icon">⬆️</span>
                                    <span class="file-name">..</span>
                                </button>
                            {/if}
                            {#each files as entry}
                                <div
                                    class="file-entry"
                                    onclick={() => openEntry(entry)}
                                >
                                    <span class="file-icon"
                                        >{entry.isDirectory ? "📁" : "📄"}</span
                                    >
                                    <span class="file-name">{entry.name}</span>
                                    {#if entry.size}
                                        <span class="file-size"
                                            >{formatSize(entry.size)}</span
                                        >
                                    {/if}
                                    <button
                                        class="file-delete"
                                        onclick={(e) => {
                                            e.stopPropagation();
                                            handleDelete(entry);
                                        }}
                                        title="Delete">🗑️</button
                                >
                                </div>
                            {/each}
                            {#if files.length === 0}
                                <div class="empty-state">
                                    <p>No files yet</p>
                                    <button
                                        class="btn btn-sm btn-primary"
                                        onclick={handlePickDirectory}
                                        >Open a folder</button
                                    >
                                </div>
                            {/if}
                        </div>

                        {#if selectedFile}
                            <div class="file-preview">
                                <div class="preview-header">
                                    <span class="preview-title"
                                        >{selectedFile.split("/").pop()}</span
                                    >
                                    {#if isEditing}
                                        <div class="preview-actions">
                                            <button
                                                class="btn btn-sm btn-primary"
                                                onclick={saveEdit}>Save</button
                                            >
                                            <button
                                                class="btn btn-sm btn-ghost"
                                                onclick={() =>
                                                    (isEditing = false)}
                                                >Cancel</button
                                            >
                                        </div>
                                    {:else}
                                        <button
                                            class="btn btn-sm btn-ghost"
                                            onclick={startEdit}>✏️ Edit</button
                                        >
                                    {/if}
                                </div>
                                {#if isEditing}
                                    <textarea
                                        class="file-editor"
                                        bind:value={editContent}
                                    ></textarea>
                                {:else}
                                    <pre
                                        class="file-content">{fileContent}</pre>
                                {/if}
                            </div>
                        {/if}
                    </div>

                    <!-- ═══ CONTAINER TAB ═══ -->
                {:else if activeTab === "container"}
                    <div class="container-tab">
                        <!-- Status -->
                        <div
                            class="container-status"
                            class:ready={containerStatus.ready}
                        >
                            <div class="status-dot"></div>
                            <div class="status-info">
                                <span class="status-label"
                                    >{containerStatus.ready
                                        ? "Running"
                                        : "Stopped"}</span
                                >
                                {#if containerStatus.image}
                                    <span class="status-detail"
                                        >{containerStatus.image} ({containerStatus.arch})</span
                                    >
                                {:else}
                                    <span class="status-detail"
                                        >No container loaded</span
                                    >
                                {/if}
                            </div>
                            <span class="arch-badge"
                                >{containerStatus.arch}</span
                            >
                        </div>

                        {#if isLoadingContainer}
                            <div class="load-progress">
                                <div class="progress-bar">
                                    <div
                                        class="progress-fill"
                                        style="width: {loadProgress}%"
                                    ></div>
                                </div>
                                <span class="progress-text"
                                    >{loadProgress}% — Downloading container...</span
                                >
                            </div>
                        {/if}

                        <!-- Image List -->
                        <div class="section-title">
                            <h4>Container Images</h4>
                            <button
                                class="btn btn-sm btn-primary"
                                onclick={() => (showAddImage = !showAddImage)}
                                >+ Add Image</button
                            >
                        </div>

                        {#if showAddImage}
                            <div class="add-image-form">
                                <input
                                    type="text"
                                    bind:value={newImageName}
                                    placeholder="Image name (e.g. Kali Linux)"
                                    class="input-field"
                                />
                                <input
                                    type="text"
                                    bind:value={newImageUrl}
                                    placeholder="Container image URL"
                                    class="input-field"
                                />
                                <select
                                    bind:value={newImageOS}
                                    class="input-field"
                                >
                                    <option value="alpine">Alpine Linux</option>
                                    <option value="kali">Kali Linux</option>
                                    <option value="ubuntu">Ubuntu</option>
                                    <option value="debian">Debian</option>
                                    <option value="custom">Custom</option>
                                </select>
                                <button
                                    class="btn btn-sm btn-primary"
                                    onclick={handleAddImage}>Register</button
                                >
                            </div>
                        {/if}

                        <div class="image-list">
                            {#each containerImages as image}
                                <div
                                    class="image-card"
                                    class:active={containerStatus.image ===
                                        image.name}
                                >
                                    <div class="image-info">
                                        <span class="image-name"
                                            >{image.name}</span
                                        >
                                        <span class="image-desc"
                                            >{image.description}</span
                                        >
                                        {#if image.size}
                                            <span class="image-size"
                                                >{image.size}</span
                                            >
                                        {/if}
                                    </div>
                                    <div class="image-actions">
                                        {#if containerStatus.image === image.name}
                                            <span class="active-badge"
                                                >Active</span
                                            >
                                        {:else}
                                            <button
                                                class="btn btn-sm btn-primary"
                                                onclick={() =>
                                                    containerStatus.ready
                                                        ? handleSwapContainer(
                                                               image.id,
                                                           )
                                                        : handleLoadContainer(
                                                               image.id,
                                                           )}
                                                disabled={isLoadingContainer}
                                            >
                                                {containerStatus.ready
                                                    ? "Swap"
                                                    : "Load"}
                                            </button>
                                        {/if}
                                        {#if !image.id.startsWith("alpine-")}
                                            <button
                                                class="btn btn-sm btn-ghost"
                                                onclick={() =>
                                                    handleRemoveImage(image.id)}
                                                >🗑️</button
                                            >
                                        {/if}
                                    </div>
                                </div>
                            {/each}
                        </div>
                    </div>

                    <!-- ═══ LAYERS TAB ═══ -->
                {:else if activeTab === "layers"}
                    <div class="layers-tab">
                        <!-- Persona Layer -->
                        <div class="layer-section">
                            <div class="layer-header">
                                <span class="layer-icon">👤</span>
                                <h4>Persona Layer</h4>
                                <span class="layer-badge">hot-swappable</span>
                            </div>
                            <p class="layer-desc">
                                Active personality, identity, and system prompt.
                            </p>
                            <div class="layer-items">
                                {#each personas as persona}
                                    <button
                                        class="layer-item"
                                        class:active={activePersonaId ===
                                            persona.id}
                                        onclick={() =>
                                            handleSwapPersona(persona.id)}
                                    >
                                        <span class="item-name"
                                            >{persona.label}</span
                                        >
                                        {#if activePersonaId === persona.id}
                                            <span class="active-dot"></span>
                                        {/if}
                                    </button>
                                {/each}
                                {#if personas.length === 0}
                                    <p class="empty-hint">
                                        No saved personas. Use the Persona
                                        Manager to create one.
                                    </p>
                                {/if}
                            </div>
                        </div>

                        <!-- Skills Layer -->
                        <div class="layer-section">
                            <div class="layer-header">
                                <span class="layer-icon">⚡</span>
                                <h4>Skills Layer</h4>
                                <span class="layer-badge">hot-swappable</span>
                            </div>
                            <p class="layer-desc">
                                Active tools, instructions, and learned
                                behaviors.
                            </p>

                            <div class="layer-actions">
                                <button
                                    class="btn btn-sm btn-ghost"
                                    onclick={() =>
                                        (showSaveSkillSet = !showSaveSkillSet)}
                                >
                                    💾 Save Current
                                </button>
                            </div>

                            {#if showSaveSkillSet}
                                <div class="save-form">
                                    <input
                                        type="text"
                                        bind:value={newSkillSetLabel}
                                        placeholder="Skill set name"
                                        class="input-field"
                                    />
                                    <button
                                        class="btn btn-sm btn-primary"
                                        onclick={handleSaveSkillSet}
                                        >Save</button
                                    >
                                </div>
                            {/if}

                            <div class="layer-items">
                                {#each skillSets as skillSet}
                                    <div
                                        class="layer-item"
                                        class:active={activeSkillSetId ===
                                            skillSet.id}
                                    >
                                        <button
                                            class="item-swap"
                                            onclick={() =>
                                                handleSwapSkillSet(skillSet.id)}
                                        >
                                            <span class="item-name"
                                                >{skillSet.label}</span
                                            >
                                            <span class="item-detail"
                                                >{skillSet.skills.length} skills</span
                                            >
                                        </button>
                                        {#if activeSkillSetId === skillSet.id}
                                            <span class="active-dot"></span>
                                        {/if}
                                        <button
                                            class="btn btn-sm btn-ghost"
                                            onclick={() =>
                                                handleDeleteSkillSet(
                                                    skillSet.id,
                                                )}>🗑️</button
                                        >
                                    </div>
                                {/each}
                                {#if skillSets.length === 0}
                                    <p class="empty-hint">
                                        No saved skill sets. Save your current
                                        skills to swap later.
                                    </p>
                                {/if}
                            </div>
                        </div>

                        <!-- Workspace Layer -->
                        <div class="layer-section">
                            <div class="layer-header">
                                <span class="layer-icon">📂</span>
                                <h4>Workspace Layer</h4>
                                <span class="layer-badge persistent"
                                    >persistent</span
                                >
                            </div>
                            <p class="layer-desc">
                                Your working directory. Never swapped — persists
                                across persona and skill changes.
                            </p>
                            <div class="workspace-info">
                                <span class="info-label">Status:</span>
                                <span class="info-value"
                                    >{isWorkspaceMounted()
                                        ? "Mounted"
                                        : "Not mounted"}</span
                                >
                            </div>
                        </div>

                        <!-- Container Layer -->
                        <div class="layer-section">
                            <div class="layer-header">
                                <span class="layer-icon">🐧</span>
                                <h4>Container Layer</h4>
                                <span class="layer-badge">hot-swappable</span>
                            </div>
                            <p class="layer-desc">
                                The underlying OS. Swap between Alpine, Kali,
                                etc.
                            </p>
                            <div class="workspace-info">
                                <span class="info-label">Active:</span>
                                <span class="info-value"
                                    >{containerStatus.image || "None"}</span
                                >
                            </div>
                        </div>
                    </div>
                {:else if activeTab === "terminal"}
                    <div class="terminal-tab">
                        <div class="term-toolbar">
                            <span class="term-label">EZ-Claw Sandbox</span>
                            <span class="version-tag">EZ-TERM 2.2</span>
                        </div>
                        <div class="term-view-container">
                            <TerminalView {sessionId} />
                        </div>
                    </div>
                {/if}
            </div>
        </div>
    </div>
{/if}

<style>
    .ws-overlay {
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

    .ws-panel {
        width: 100%;
        max-width: 920px;
        height: 80vh;
        display: flex;
        flex-direction: column;
        border-radius: var(--radius-lg);
        overflow: hidden;
    }

    .ws-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-sm) var(--space-md);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(22, 27, 34, 0.9);
    }

    .ws-tabs {
        display: flex;
        gap: 2px;
    }

    .ws-tab {
        padding: 8px 16px;
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        font-size: var(--text-sm);
        font-weight: 500;
        border-radius: var(--radius-sm);
        transition: all 0.15s ease;
    }

    .ws-tab:hover {
        background: rgba(99, 102, 241, 0.1);
        color: var(--text-primary);
    }
    .ws-tab.active {
        background: rgba(99, 102, 241, 0.2);
        color: var(--accent-primary);
    }

    .close-btn {
        background: none;
        border: none;
        color: var(--text-tertiary);
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
    }

    .ws-body {
        flex: 1;
        overflow-y: auto;
        padding: var(--space-md);
    }

    /* ═══ FILES TAB ═══ */
    .files-toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-md);
        flex-wrap: wrap;
        gap: var(--space-sm);
    }

    .breadcrumb {
        display: flex;
        align-items: center;
        gap: 2px;
        flex-wrap: wrap;
    }
    .crumb {
        background: rgba(99, 102, 241, 0.1);
        border: none;
        color: var(--accent-primary);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: var(--text-xs);
    }
    .crumb:hover {
        background: rgba(99, 102, 241, 0.25);
    }
    .crumb-sep {
        color: var(--text-tertiary);
        font-size: var(--text-xs);
    }
    .toolbar-actions {
        display: flex;
        gap: var(--space-xs);
    }

    .files-content {
        display: flex;
        gap: var(--space-md);
        height: calc(100% - 48px);
    }
    .file-list {
        flex: 1;
        min-width: 200px;
        overflow-y: auto;
    }
    .file-entry {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: 6px var(--space-sm);
        border-radius: var(--radius-sm);
        cursor: pointer;
        font-size: var(--text-sm);
        color: var(--text-primary);
        border: none;
        background: none;
        width: 100%;
        text-align: left;
    }
    .file-entry:hover {
        background: rgba(99, 102, 241, 0.1);
    }
    .file-icon {
        font-size: 14px;
        flex-shrink: 0;
    }
    .file-name {
        flex: 1;
    }
    .file-size {
        color: var(--text-tertiary);
        font-size: var(--text-xs);
    }
    .file-delete {
        background: none;
        border: none;
        cursor: pointer;
        opacity: 0;
        transition: opacity 0.15s;
        font-size: 12px;
    }
    .file-entry:hover .file-delete {
        opacity: 1;
    }

    .file-preview {
        flex: 1;
        display: flex;
        flex-direction: column;
        min-width: 300px;
    }
    .preview-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-sm);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .preview-title {
        font-weight: 600;
        font-size: var(--text-sm);
        color: var(--text-primary);
    }
    .preview-actions {
        display: flex;
        gap: var(--space-xs);
    }
    .file-editor {
        flex: 1;
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(99, 102, 241, 0.3);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        font-family: "JetBrains Mono", monospace;
        font-size: 13px;
        padding: var(--space-sm);
        resize: none;
    }
    .file-content {
        flex: 1;
        overflow: auto;
        padding: var(--space-sm);
        font-family: "JetBrains Mono", monospace;
        font-size: 13px;
        color: var(--text-secondary);
        white-space: pre-wrap;
        word-break: break-word;
    }

    .empty-state {
        text-align: center;
        padding: var(--space-xl);
        color: var(--text-tertiary);
    }

    /* ═══ CONTAINER TAB ═══ */
    .container-status {
        display: flex;
        align-items: center;
        gap: var(--space-md);
        padding: var(--space-md);
        background: rgba(0, 0, 0, 0.2);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-md);
        border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .status-dot {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #f85149;
        flex-shrink: 0;
    }
    .container-status.ready .status-dot {
        background: #3fb950;
        box-shadow: 0 0 8px rgba(63, 185, 80, 0.4);
    }

    .status-info {
        flex: 1;
    }
    .status-label {
        font-weight: 600;
        font-size: var(--text-sm);
        color: var(--text-primary);
        display: block;
    }
    .status-detail {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
    }
    .arch-badge {
        background: rgba(99, 102, 241, 0.15);
        color: var(--accent-primary);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
        font-weight: 600;
    }

    .load-progress {
        margin-bottom: var(--space-md);
    }
    .progress-bar {
        height: 4px;
        background: rgba(255, 255, 255, 0.08);
        border-radius: var(--radius-full);
        overflow: hidden;
    }
    .progress-fill {
        height: 100%;
        background: var(--accent-gradient);
        border-radius: var(--radius-full);
        transition: width 0.3s ease;
    }
    .progress-text {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        margin-top: 4px;
        display: block;
    }

    .section-title {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--space-sm);
    }
    .section-title h4 {
        font-size: var(--text-sm);
        color: var(--text-primary);
        margin: 0;
    }

    .add-image-form {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
        padding: var(--space-sm);
        background: rgba(0, 0, 0, 0.15);
        border-radius: var(--radius-sm);
        margin-bottom: var(--space-md);
    }

    .input-field {
        background: rgba(0, 0, 0, 0.3);
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: var(--radius-sm);
        color: var(--text-primary);
        padding: 6px 10px;
        font-size: var(--text-sm);
    }

    .image-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-xs);
    }
    .image-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-sm) var(--space-md);
        background: rgba(0, 0, 0, 0.15);
        border-radius: var(--radius-sm);
        border: 1px solid rgba(255, 255, 255, 0.06);
        transition: border-color 0.15s;
    }
    .image-card.active {
        border-color: rgba(63, 185, 80, 0.4);
    }
    .image-info {
        display: flex;
        flex-direction: column;
        gap: 2px;
    }
    .image-name {
        font-weight: 600;
        font-size: var(--text-sm);
        color: var(--text-primary);
    }
    .image-desc {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
    }
    .image-size {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
    }
    .image-actions {
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

    /* ═══ LAYERS TAB ═══ */
    .layer-section {
        padding: var(--space-md);
        background: rgba(0, 0, 0, 0.12);
        border-radius: var(--radius-md);
        margin-bottom: var(--space-md);
        border: 1px solid rgba(255, 255, 255, 0.06);
    }

    .layer-header {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        margin-bottom: var(--space-xs);
    }
    .layer-icon {
        font-size: 18px;
    }
    .layer-header h4 {
        margin: 0;
        font-size: var(--text-sm);
        color: var(--text-primary);
        flex: 1;
    }
    .layer-badge {
        background: rgba(99, 102, 241, 0.15);
        color: var(--accent-primary);
        padding: 2px 8px;
        border-radius: var(--radius-sm);
        font-size: 10px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .layer-badge.persistent {
        background: rgba(63, 185, 80, 0.15);
        color: #3fb950;
    }

    .layer-desc {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        margin: 0 0 var(--space-sm);
    }
    .layer-actions {
        margin-bottom: var(--space-sm);
    }
    .save-form {
        display: flex;
        gap: var(--space-xs);
        margin-bottom: var(--space-sm);
    }

    .layer-items {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }
    .layer-item {
        display: flex;
        align-items: center;
        gap: var(--space-sm);
        padding: 6px var(--space-sm);
        background: rgba(0, 0, 0, 0.15);
        border-radius: var(--radius-sm);
        cursor: pointer;
        border: 1px solid transparent;
        transition: all 0.15s;
        color: var(--text-primary);
    }
    .layer-item:hover {
        border-color: rgba(99, 102, 241, 0.3);
    }
    .layer-item.active {
        border-color: rgba(99, 102, 241, 0.5);
        background: rgba(99, 102, 241, 0.08);
    }
    .item-swap {
        flex: 1;
        background: none;
        border: none;
        color: var(--text-primary);
        cursor: pointer;
        text-align: left;
        display: flex;
        flex-direction: column;
    }
    .item-name {
        font-size: var(--text-sm);
        font-weight: 500;
    }
    .item-detail {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
    }
    .active-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: var(--accent-primary);
        flex-shrink: 0;
    }

    .workspace-info {
        display: flex;
        gap: var(--space-sm);
        font-size: var(--text-sm);
    }
    .info-label {
        color: var(--text-tertiary);
    }
    .info-value {
        color: var(--text-primary);
        font-weight: 500;
    }

    .empty-hint {
        font-size: var(--text-xs);
        color: var(--text-tertiary);
        font-style: italic;
        margin: 0;
    }

    /* Shared */
    .btn {
        cursor: pointer;
        border: none;
        border-radius: var(--radius-sm);
        font-size: var(--text-xs);
        padding: 4px 10px;
        transition: all 0.15s;
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

    /* ═══ TERMINAL TAB ═══ */
    .terminal-tab {
        display: flex;
        flex-direction: column;
        height: 100%;
        background: #0d1117;
        isolation: isolate;
    }
    .term-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: var(--space-sm) var(--space-md);
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        background: #161b22;
    }
    .term-tier-select {
        display: flex;
        gap: var(--space-xs);
        align-items: center;
    }
    .term-label {
        font-size: 11px;
        color: var(--text-tertiary);
        margin-right: 4px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
    }
    .term-tier-btn {
        background: #21262d;
        border: 1px solid rgba(255, 255, 255, 0.1);
        color: var(--text-secondary);
        padding: 4px 10px;
        border-radius: var(--radius-sm);
        font-size: 11px;
        cursor: pointer;
    }
    .term-tier-btn.active {
        background: rgba(99, 102, 241, 0.2);
        border-color: var(--accent-primary);
        color: var(--accent-primary);
    }
    .version-tag {
        font-size: 10px;
        color: var(--text-tertiary);
        font-family: monospace;
    }
    .term-view-container {
        flex: 1;
        min-height: 0;
        position: relative;
    }
</style>
