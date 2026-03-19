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
  import PanicButton from "./components/PanicButton.svelte";
  import CloudSyncPanel from "./components/CloudSyncPanel.svelte";
  import { initWasm, isWasmReady } from "./bridge/wasm-loader";
  import "./bridge/agent-api"; // Expose window.EZClaw headless API
  import { initCloudSync } from "./bridge/cloud-sync";
  import {
    initOrchestrator,
    createClaw,
    cloneClaw,
    activateClawLayers,
    killClaw,
    updateClaw, // ADDED
    deleteClaw, // ADDED
    onClawsChange,
    getAllClaws,
  } from "./bridge/claw-orchestrator";
  import {
    isValidProvider,
    getValidModels,
    getDefaultModel,
  } from "./bridge/providers";
  import {
    initStorage,
    getAllSessions,
    saveSession,
    deleteSession,
    getConfig,
    saveConfig,
    type SessionData,
  } from "./bridge/storage-bridge";
  import {
    initMemory,
  } from "./bridge/memory-bridge";
  import { dbGet, dbPut } from "./bridge/db-bridge";
  import { CLAW_DEFAULTS, EVENTS, WORKER } from "./bridge/constants";

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
  let showCloudSync = $state(false);

  // Session state
  let sessions: SessionData[] = $state([]);
  let activeSessionId: string | null = $state(null);

  // Config state
  let provider = $state(CLAW_DEFAULTS.PROVIDER);
  let model = $state(CLAW_DEFAULTS.MODEL);
  let apiKey = $state("");
  let ghToken = $state("");
  let temperature = $state(CLAW_DEFAULTS.TEMPERATURE);
  let apiUrl = $state("");

  onMount(async () => {
    try {
      await initStorage();
      await initOrchestrator();
      initCloudSync();

      onClawsChange(() => {
        sessions = getAllClaws();
      });

      try {
        await initWasm();
        wasmReady = true;
        await initMemory();
      } catch (err) {
        console.warn("[EZ-Claw] WASM Init Error:", err);
        initError = `Initialization error: ${err instanceof Error ? err.message : String(err)}`;
      }

      await loadProjectConfig();

      sessions = await getAllSessions();
      if (sessions.length > 0) {
        activeSessionId = sessions[0].id;
      }

      if (!apiKey) showOnboarding = true;
      loading = false;
    } catch (err) {
      console.error("[EZ-Claw] Bootstrap Failed:", err);
      initError = `Init failed: ${err instanceof Error ? err.message : String(err)}`;
      loading = false;
    }
  });

  async function loadProjectConfig() {
    const savedProvider = await getConfig("provider");
    const savedModel = await getConfig("model");
    const savedApiKey = await getConfig("apiKey");
    const savedTemp = await getConfig("temperature");
    const savedApiUrl = await getConfig("apiUrl");
    
    const ghSec = await dbGet("secrets", "GITHUB_TOKEN");
    if (ghSec) ghToken = ghSec.value;

    if (savedProvider && (!isValidProvider(savedProvider) || savedProvider === "novita")) {
      provider = CLAW_DEFAULTS.FALLBACK_PROVIDER;
      await saveConfig("provider", provider);
    } else if (savedProvider) {
      provider = savedProvider;
    }

    if (savedModel) model = savedModel;
    if (savedApiKey) apiKey = savedApiKey;
    if (savedTemp) temperature = parseFloat(savedTemp);
    if (savedApiUrl) apiUrl = savedApiUrl;

    // Model Validation
    const validModels = getValidModels(provider);
    const isValid = validModels.length === 0 || 
                    validModels.some(m => model?.includes(m.split("/").pop() || m));
                    
    if (!isValid && model) {
      model = getDefaultModel(provider);
      await saveConfig("model", model);
    }
  }

  function handleNewClaw(name: string, cloneFromId?: string) {
    let claw;
    if (cloneFromId) {
      claw = cloneClaw(cloneFromId, name, model, provider);
    }
    if (!claw) {
      claw = createClaw(name, model, provider);
    }
    const session: SessionData = {
      id: claw.id,
      title: name,
      clawName: claw.clawName,
      emoji: claw.emoji,
      personaId: claw.personaId,
      skillSetId: claw.skillSetId,
      status: claw.status,
      messages: [],
      createdAt: claw.createdAt,
      updatedAt: claw.updatedAt,
      model: claw.model,
      provider: claw.provider,
    };
    sessions = [session, ...sessions];
    activeSessionId = claw.id;
    activateClawLayers(claw.id);
    showSidebar = false;
  }

  function handleSelectSession(id: string) {
    activeSessionId = id;
    activateClawLayers(id);
    showSidebar = false;
  }

  function handleDeleteSession(id: string) {
    if (activeSessionId === id) {
      const next = sessions.find((s) => s.id !== id);
      activeSessionId = next ? next.id : null;
    }
    deleteClaw(id); // Proxy to worker
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
      handleNewClaw(CLAW_DEFAULTS.NAME);
    }
  }
</script>

{#if loading}
  <div class="loading-screen">
    <div class="loading-logo">
      <div class="loading-claw">🦀</div>
      <h1>EZ-Claw</h1>
      <p>Loading engine...</p>
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
      <p style="color: var(--error);">Failed to load engine</p>
      <p
        style="font-size: var(--text-xs); color: var(--text-dim); max-width: 400px; word-break: break-all;"
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
      onNewClaw={handleNewClaw}
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
        engineStatus={wasmReady}
        onToggleSidebar={() => (showSidebar = !showSidebar)}
        onOpenSettings={() => (showSettings = true)}
        onOpenWorkspace={() => (showWorkspace = true)}
        onOpenSecurity={() => (showSecurity = true)}
        onOpenSkills={() => (showSkills = true)}
        onOpenMCP={() => (showMCP = true)}
        onOpenTerminal={() => (showTerminal = true)}
        onOpenChannels={() => (showChannels = true)}
        onOpenPersonas={() => (showPersonas = true)}
        onOpenCloudSync={() => (showCloudSync = true)}
      />
      <PanicButton
        activeClawId={activeSessionId}
        onPanic={() => {
          sessions = sessions.map((s) => ({ ...s, status: "frozen" as const }));
        }}
        onResume={() => {
          sessions = sessions.map((s) =>
            s.status === "frozen" ? { ...s, status: "running" as const } : s,
          );
        }}
        onKill={(id) => {
          sessions = sessions.map((s) =>
            s.id === id ? { ...s, status: "killed" as const } : s,
          );
          if (activeSessionId === id) {
            const next = sessions.find((s) => s.status === "running");
            activeSessionId = next ? next.id : null;
          }
        }}
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
      {ghToken}
      sessionId={activeSessionId}
      onClose={() => (showSettings = false)}
      onSave={async (config) => {
        // ALWAYS update local global states so Chat.svelte props see them
        provider = config.provider;
        model = config.model;
        apiKey = config.apiKey;
        ghToken = config.ghToken;
        temperature = config.temperature;
        apiUrl = config.apiUrl;

        if (config.sessionId) {
          // Update specific claw in worker
          await updateClaw(config.sessionId, {
            provider: config.provider,
            model: config.model,
            temperature: config.temperature,
            apiUrl: config.apiUrl,
          });
        } else {
          // Persist as global defaults
          await saveConfig("provider", config.provider);
          await saveConfig("model", config.model);
          await saveConfig("apiKey", config.apiKey);
          await dbPut("secrets", { key: "GITHUB_TOKEN", value: config.ghToken });
          await saveConfig("temperature", String(config.temperature));
          await saveConfig("apiUrl", config.apiUrl);
        }
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
    sessionId={activeSessionId}
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
  {#if showCloudSync}
    <CloudSyncPanel onClose={() => (showCloudSync = false)} />
  {/if}
{/if}

<style>
  .loading-screen {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100dvh;
    background: var(--color-bg);
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
    font-weight: 800;
    letter-spacing: -0.02em;
    margin-bottom: var(--space-sm);
  }

  .loading-logo p {
    color: var(--text-secondary);
    font-size: var(--text-sm);
    margin-bottom: var(--space-lg);
  }

  .loading-bar {
    width: 200px;
    height: 4px;
    background: var(--color-surface-elevated);
    border-radius: var(--radius-full);
    margin: 0 auto;
    overflow: hidden;
  }

  .loading-progress {
    width: 40%;
    height: 100%;
    background: var(--accent-gradient);
    border-radius: var(--radius-full);
    box-shadow: 0 0 12px var(--color-primary-glow);
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
