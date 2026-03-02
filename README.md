# 🦀 EZ-Claw

An entirely client-sided, WebAssembly-powered AI agent running right in your browser.

**License:** Copyright © 2026 [yahya-azeem]. All Rights Reserved.
License Terms:
1. Permission is hereby granted to use, copy, and redistribute this software in its original, unmodified form for both commercial and non-commercial purposes, provided that the following conditions are met:
2. Attribution: Proper credit is given to the original author ([yahya-azeem]) and the copyright notice above is included.
3. No Modification: Modification, adaptation, translation, or creation of derivative works is strictly prohibited without prior written permission from the copyright holder.
4. No Unauthorized Monetization: While the software may be used for commercial purposes (e.g., in a company's internal tools), the software itself may not be sold, sublicensed, or bundled for profit by any party other than the original author.
5. Contributions and improvements are welcome and may be submitted to the original author for inclusion in official versions.
6. THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.

   
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

## How to use:
   (click this link) -->  https://yahya-azeem.github.io/EZ-Claw/



### OR Docker Self Hosting Deployment (Optional)
We provide a `docker-compose.yml` for quick isolated building.
```bash
docker-compose build dev
docker-compose up -d dev
```

