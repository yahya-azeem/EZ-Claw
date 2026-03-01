# EZ-Claw: Current State & Next Steps

This document tracks where we left off, so we can resume work seamlessly in the next session.

## What is Working Right Now

1. **WASM-Rust Core**:
   * The core engine compiles successfully to WebAssembly.
   * `Chat.svelte` successfully calls the WASM agent to construct the conversation prompt via `agent.build_messages()`.

2. **Identity System (OpenClaw-style)**:
   * **First-Run Bootstrap**: If no profile exists, the agent wakes up with the OpenClaw "Who am I? Who are you?" prompt.
   * **Persistence**: The agent's name, vibe, creature type, emoji, and core facts are saved to `localStorage` and injected into the system prompt.
   * **Tool**: The `update_identity` tool works correctly and now accepts `name`, `personality`, `instructions`, `creature`, `vibe`, `emoji`, `fact_key`, and `fact_value`.

3. **Multi-Persona Manager**:
   * `identity-bridge.ts` supports storing multiple personas.
   * `PersonaManager.svelte` UI is built: allows creating, switching, renaming, deleting (with 3x phrase confirmation), importing, and exporting personas.
   * Wired into `App.svelte` and accessible via the `Personas` button in `Header.svelte`.

4. **Sandbox & Channel Skeletons**:
   * `SandboxManager` is connected to the `shell_exec` tool (WASI/CheerpX/Native tiers prepared).
   * Workspace tools (`read_file`, `write_file`, `list_dir`) are connected to `WasmWorkspace`.
   * `ChannelManager` handles routing for Telegram/Discord/Slack, with the UI built in `ChannelsPanel.svelte`.

5. **Settings & Fixes**:
   * Model input now has a dropdown (`<datalist>`) suggesting valid models based on the selected provider (prevents the 404 error from invalid inputs like `deepseek-v3-250324`).

## What Needs to be Done Next (START HERE)

1. **Headless Agent API (`window.EZClaw`)**:
   * Build a global JavaScript API so the agent can be interacted with outside of the Svelte UI (e.g., via browser console, WebSocket, or TUI).
   * Methods needed: `chat()`, `getIdentity()`, `listPersonas()`, `switchPersona()`, etc.

2. **Test End-to-End via API**:
   * Use the headless API to execute complex tool-calling flows (e.g., asking the agent to list directory contents, perform a web search, or update its identity) to ensure the runtime bridge between Svelte/TypeScript and WASM/Rust is flawless.

3. **Memory System Hardening**:
   * Ensure `sql.js` (sqlite in browser) is robustly saving and loading the memory DB across reloads.
   * Verify the automatic vector similarity search is triggering correctly during chat.

4. **Sandbox Tier 3 (Native Linux CLI)**:
   * Finalize the WebSocket connection to the local secure container (if running) so `shell_exec` can run real host commands safely.
