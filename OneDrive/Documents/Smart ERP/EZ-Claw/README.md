# 🦀 EZ-Claw

An entirely client-sided, WebAssembly-powered AI agent running right in your browser.

## 🌟 The Vision & Principles

EZ-Claw is designed to be as **featured and functional as OpenClaw**, as **secure as IronClaw**, and as **efficient as ZeroClaw**, all while maintaining an accessible, beautiful interface for everyday users ("normies"). 

### Core Principles
1. **100% Client-Sided**: No centralized backend servers logging your chats. Your data, your keys, your memory, your privacy.
2. **Rust + WASM**: High performance and safety. The core agent logic, memory management, and prompt building are written in Rust and compiled to WebAssembly (WASM).
3. **Sandboxed & Secure**: Tool execution (like shell commands) operates within strict boundaries. We use a 3-tier sandbox model (WASI / CheerpX / Native Jail) inspired by IronClaw's security pipeline.
4. **Persistent Identity**: The agent isn't just a basic LLM wrapper. It has an evolving "Soul", a persistent identity, long-term memory (via sqlite in browser), and a multi-persona system.

---

## 🚀 Features

* **OpenClaw-style Identity**: The agent bootstraps itself on first run ("Who am I?"). It dynamically updates its own identity, name, vibe, and facts using the `update_identity` tool.
* **Persona Manager**: Create, switch, export, and import different agent personas.
* **In-Browser Vector Memory**: Automatically saves facts and recalls relevant context using local SQLite + vector embeddings (via sql.js).
* **Multi-Provider Support**: Connects directly to OpenRouter, Anthropic, OpenAI, DeepSeek, or local Ollama instances.
* **Workspace & Sandbox Tools**: The agent can read/write files and execute sandboxed shell commands.
* **Omni-Channel Skeletons**: Built-in support to route messages from Telegram, Discord, Slack, and WhatsApp straight to your local browser agent.

---

## 🛠️ Architecture

* **Frontend**: Svelte 5 + Vite. Beautiful, reactive, fluid UI.
* **Agent Core**: Rust (`ezclaw-core`). Compiles to `pkg/` via `wasm-pack`.
* **State & DB**: `localStorage` for fast config/identity, `sql.js` for persistent vector memory.
* **Bridging**: TypeScript bridges (`provider-bridge.ts`, `tool-runtime.ts`, `identity-bridge.ts`, `sandbox-manager.ts`) connect the Svelte UI to the WASM core.

---

## 💻 Setup & Installation

You need `Node.js` (for Vite/Svelte) and `Rust` + `wasm-pack` (for the core engine).

### 1. Prerequisites
* Install Node.js (v18+)
* Install Rust (`rustup`)
* Install wasm-pack: `cargo install wasm-pack`

### 2. Build the WASM Core
```bash
cd crates/ezclaw-core
wasm-pack build --target web --out-dir ../../pkg
```

### 3. Start the Frontend
```bash
# From the root of the project
npm install
npm run dev
```
Navigate to `http://localhost:5173` in your browser.

### 4. Docker Deployment (Optional)
We provide a `docker-compose.yml` for quick isolated building.
```bash
docker-compose build dev
docker-compose up -d dev
```

---

## 📖 Source Documentation Reference

This project heavily references and adapts architectures from the Claw ecosystem:
* **OpenClaw**: For the core agentic loop, SOUL.md personality injection, and dynamic tool-calling. (Source: https://github.com/openclaw/openclaw)
* **IronClaw**: For sandbox tiering, safe shell execution policies, and secure tool routing. (Source: https://github.com/nearai/ironclaw)
* **ZeroClaw**: For the client-side, zero-server efficiency model using WebAssembly.
