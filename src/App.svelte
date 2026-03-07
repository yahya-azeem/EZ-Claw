<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import Header from "./components/Header.svelte";
  import Sidebar from "./components/Sidebar.svelte";
  import Chat from "./components/Chat.svelte";
  import Settings from "./components/Settings.svelte";
  import OnboardingModal from "./components/OnboardingModal.svelte";
  import WorkspacePanel from "./components/WorkspacePanel.svelte";
  import SecurityDashboard from "./components/SecurityDashboard.svelte";
  import SkillsPanel from "./components/SkillsPanel.svelte";
  import MCPPanel from "./components/MCPPanel.svelte";
  import Terminal from "./components/Terminal.svelte";
  import ChannelsPanel from "./components/ChannelsPanel.svelte";
  import PersonaManager from "./components/PersonaManager.svelte";
  import { initWasm, isWasmReady } from "./bridge/wasm-loader";
  import "./bridge/agent-api"; // Expose window.EZClaw headless API
  import { isValidProvider, getValidModels, getDefaultModel } from "./bridge/providers";
  import {
    initStorage,
    getAllSessions,
    getConfig,
    saveConfig,
    type SessionData,
  } from "./bridge/storage-bridge";
  import {
    initMemory,
    exportMemoryData,
    loadMemoryFromData,
  } from "./bridge/memory-bridge";

  let wasmReady = $state(false);
  let loading = $state(true);
  let initError = $state("");
  let showSidebar = $state(false);
  let showSettings = $state(false);
  let showOnboarding = $state(false);
  let showWorkspace = $state(false);
  let showSecurity = $state(false);
  let showSkills = $state(false);
  let showMCP = $state(false);
  let showTerminal = $state(false);
  let showChannels = $state(false);
  let showPersonas = $state(false);

  // Session state
  let sessions: SessionData[] = $state([]);
  let activeSessionId: string | null = $state(null);

  // Config state
  let provider = $state("deepseek");
  let model = $state("deepseek-chat");
  let apiKey = $state("");
  let temperature = $state(0.7);
  let apiUrl = $state("");

  // ── Memory persistence helpers (using IndexedDB to avoid localStorage 5MB limit) ──
  const MEMORY_DB_NAME = "ezclaw_memory_db";
  const MEMORY_DB_STORE = "memory";
  const MEMORY_DB_KEY = "ezclaw_memory";
  let memoryAutoSaveId: number | undefined;

  function openMemoryDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(MEMORY_DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(MEMORY_DB_STORE)) {
          db.createObjectStore(MEMORY_DB_STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function loadSavedMemory(): Promise<Uint8Array | null> {
    try {
      const db = await openMemoryDB();
      const tx = db.transaction(MEMORY_DB_STORE, "readonly");
      const store = tx.objectStore(MEMORY_DB_STORE);
      const request = store.get(MEMORY_DB_KEY);
      const result = await new Promise<any>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      db.close();
      return result || null;
    } catch {
      return null;
    }
  }

  async function persistMemory(): Promise<void> {
    try {
      const data = exportMemoryData();
      if (data) {
        const db = await openMemoryDB();
        const tx = db.transaction(MEMORY_DB_STORE, "readwrite");
        tx.objectStore(MEMORY_DB_STORE).put(data, MEMORY_DB_KEY);
        await new Promise<void>((resolve, reject) => {
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
        db.close();
      }
    } catch {
      /* silent */
    }
  }

  // Persist memory on page unload
  if (typeof window !== "undefined") {
    window.addEventListener("beforeunload", () => {
      // Synchronous fallback — IndexedDB can't be guaranteed to complete on unload,
      // but the 30s auto-save ensures minimal data loss.
      persistMemory();
    });
  }

  onDestroy(() => {
    if (memoryAutoSaveId) clearInterval(memoryAutoSaveId);
  });

  onMount(async () => {
    try {
      // Initialize storage first (always available)
      await initStorage();

      // Try to initialize WASM
      try {
        await initWasm();
        wasmReady = true;

        // Initialize memory system (sql.js)
        try {
          // Try to load saved memory from IndexedDB
          const savedMemory = await loadSavedMemory();
          if (savedMemory) {
            await loadMemoryFromData(savedMemory);
            console.log("[EZ-Claw] Memory restored from IndexedDB");
          } else {
            await initMemory();
          }
          // Auto-save memory every 30 seconds
          memoryAutoSaveId = setInterval(persistMemory, 30000) as unknown as number;
        } catch (memErr) {
          console.warn("[EZ-Claw] Memory init failed:", memErr);
          // Try fresh init
          try {
            await initMemory();
          } catch {
            /* silent */
          }
        }
      } catch (wasmErr) {
        console.warn(
          "[EZ-Claw] WASM load failed, running in degraded mode:",
          wasmErr,
        );
        initError = `WASM load failed: ${wasmErr instanceof Error ? wasmErr.message : String(wasmErr)}`;
      }

      // Load saved config
      const savedProvider = await getConfig("provider");
      const savedModel = await getConfig("model");
      const savedApiKey = await getConfig("apiKey");
      const savedTemp = await getConfig("temperature");
      const savedApiUrl = await getConfig("apiUrl");

      // Force reset to OpenRouter if provider is unknown or novita (which has issues)
      if (savedProvider && (!isValidProvider(savedProvider) || savedProvider === "novita")) {
        console.warn(`[EZ-Claw] Invalid/unavailable provider "${savedProvider}", resetting to openrouter`);
        provider = "openrouter";
        await saveConfig("provider", provider);
      } else if (savedProvider) {
        provider = savedProvider;
      }

      if (savedModel) model = savedModel;
      if (savedApiKey) apiKey = savedApiKey;
      if (savedTemp) temperature = parseFloat(savedTemp);
      if (savedApiUrl) apiUrl = savedApiUrl;

      // Validate model for provider - reset to default if invalid
      const providerValidModels = getValidModels(provider);
      const isValid = providerValidModels.length === 0 || providerValidModels.some(m => model?.includes(m.split("/").pop() || m));
      if (!isValid && model) {
        console.warn(`[EZ-Claw] Invalid model "${model}" for provider "${provider}", resetting to default`);
        model = getDefaultModel(provider);
        await saveConfig("model", model);
      }

      // Load sessions
      sessions = await getAllSessions();
      if (sessions.length > 0) {
        activeSessionId = sessions[0].id;
      }

      // Show onboarding if no API key configured
      if (!apiKey) {
        showOnboarding = true;
      }

      loading = false;
    } catch (err) {
      console.error("[EZ-Claw] Init failed:", err);
      initError = `Init failed: ${err instanceof Error ? err.message : String(err)}`;
      loading = false;
    }
  });

  function handleNewSession() {
    const id = crypto.randomUUID();
    const session: SessionData = {
      id,
      title: "New Chat",
      messages: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      model,
      provider,
    };
    sessions = [session, ...sessions];
    activeSessionId = id;
    showSidebar = false;
  }

  function handleSelectSession(id: string) {
    activeSessionId = id;
    showSidebar = false;
  }

  function handleDeleteSession(id: string) {
    sessions = sessions.filter((s) => s.id !== id);
    if (activeSessionId === id) {
      activeSessionId = sessions.length > 0 ? sessions[0].id : null;
    }
  }

  function handleSessionUpdate(updated: SessionData) {
    sessions = sessions.map((s) => (s.id === updated.id ? updated : s));
  }

  async function handleOnboardingComplete(config: {
    provider: string;
    model: string;
    apiKey: string;
  }) {
    provider = config.provider;
    model = config.model;
    apiKey = config.apiKey;

    await saveConfig("provider", config.provider);
    await saveConfig("model", config.model);
    await saveConfig("apiKey", config.apiKey);

    showOnboarding = false;

    if (sessions.length === 0) {
      handleNewSession();
    }
  }
</script>

{#if loading}
  <div class="loading-screen">
    <div class="loading-logo">
      <div class="loading-claw">🦀</div>
      <h1>EZ-Claw</h1>
      <p>Loading ZeroClaw engine...</p>
      <div class="loading-bar">
        <div class="loading-progress"></div>
      </div>
    </div>
  </div>
{:else if initError && !wasmReady}
  <div class="loading-screen">
    <div class="loading-logo">
      <div class="loading-claw">🦀</div>
      <h1>EZ-Claw</h1>
      <p style="color: var(--error);">Failed to load WASM engine</p>
      <p
        style="font-size: var(--text-xs); color: var(--text-tertiary); max-width: 400px; word-break: break-all;"
      >
        {initError}
      </p>
      <button
        class="btn btn-primary"
        style="margin-top: 16px;"
        onclick={() => location.reload()}>Retry</button
      >
    </div>
  </div>
{:else}
  <div class="app-layout" class:sidebar-open={showSidebar}>
    <Sidebar
      {sessions}
      {activeSessionId}
      isOpen={showSidebar}
      onNewSession={handleNewSession}
      onSelectSession={handleSelectSession}
      onDeleteSession={handleDeleteSession}
      onClose={() => (showSidebar = false)}
    />

    <div class="main-area">
      <Header
        sessionTitle={sessions.find((s) => s.id === activeSessionId)?.title ||
          "EZ-Claw"}
        {model}
        {provider}
        wasmStatus={wasmReady}
        onToggleSidebar={() => (showSidebar = !showSidebar)}
        onOpenSettings={() => (showSettings = true)}
        onOpenWorkspace={() => (showWorkspace = true)}
        onOpenSecurity={() => (showSecurity = true)}
        onOpenSkills={() => (showSkills = true)}
        onOpenMCP={() => (showMCP = true)}
        onOpenTerminal={() => (showTerminal = true)}
        onOpenChannels={() => (showChannels = true)}
        onOpenPersonas={() => (showPersonas = true)}
      />

      <Chat
        sessionId={activeSessionId}
        {provider}
        {model}
        {apiKey}
        {temperature}
        {apiUrl}
        onSessionUpdate={handleSessionUpdate}
      />
    </div>
  </div>

  {#if showSettings}
    <Settings
      {provider}
      {model}
      {apiKey}
      {temperature}
      {apiUrl}
      onClose={() => (showSettings = false)}
      onSave={async (config) => {
        provider = config.provider;
        model = config.model;
        apiKey = config.apiKey;
        temperature = config.temperature;
        apiUrl = config.apiUrl;
        await saveConfig("provider", config.provider);
        await saveConfig("model", config.model);
        await saveConfig("apiKey", config.apiKey);
        await saveConfig("temperature", String(config.temperature));
        await saveConfig("apiUrl", config.apiUrl);
        showSettings = false;
      }}
    />
  {/if}

  {#if showOnboarding}
    <OnboardingModal onComplete={handleOnboardingComplete} />
  {/if}

  <WorkspacePanel
    isOpen={showWorkspace}
    onClose={() => (showWorkspace = false)}
  />
  <SecurityDashboard
    isOpen={showSecurity}
    onClose={() => (showSecurity = false)}
  />
  <SkillsPanel isOpen={showSkills} onClose={() => (showSkills = false)} />
  <MCPPanel isOpen={showMCP} onClose={() => (showMCP = false)} />
  <Terminal isOpen={showTerminal} onClose={() => (showTerminal = false)} />
  <ChannelsPanel isOpen={showChannels} onClose={() => (showChannels = false)} />
  {#if showPersonas}
    <PersonaManager onClose={() => (showPersonas = false)} />
  {/if}
{/if}

<style>
  .loading-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100dvh;
    background: var(--bg-primary);
  }

  .loading-logo {
    text-align: center;
    animation: fadeIn 0.5s ease-out;
  }

  .loading-claw {
    font-size: 64px;
    margin-bottom: var(--space-md);
    animation: pulse 2s ease-in-out infinite;
  }

  .loading-logo h1 {
    font-size: var(--text-2xl);
    background: var(--accent-gradient);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    margin-bottom: var(--space-sm);
  }

  .loading-logo p {
    color: var(--text-secondary);
    font-size: var(--text-sm);
    margin-bottom: var(--space-lg);
  }

  .loading-bar {
    width: 200px;
    height: 3px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-full);
    margin: 0 auto;
    overflow: hidden;
  }

  .loading-progress {
    width: 40%;
    height: 100%;
    background: var(--accent-gradient);
    border-radius: var(--radius-full);
    animation: loadingSlide 1.5s ease-in-out infinite;
  }

  @keyframes loadingSlide {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(350%);
    }
  }

  .app-layout {
    display: flex;
    height: 100dvh;
    overflow: hidden;
    position: relative;
  }

  .main-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
    height: 100dvh;
  }

  @media (max-width: 768px) {
    .app-layout.sidebar-open .main-area {
      pointer-events: none;
      opacity: 0.5;
    }
  }
</style>
