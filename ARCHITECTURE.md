# EZ-Claw Architecture

This document outlines the high-level architecture and design patterns used in the EZ-Claw project.

## Overview

EZ-Claw is an agentic coding assistant built with Svelte and a robust background worker system. It leverages WebAssembly (WASM) for isolated execution and high-performance tasks.

## Core Components

### 1. The Claw Worker (`claw-worker.ts`)
The single source of truth for the application state. It runs in a `SharedWorker` (or fallback `Worker`) and handles:
- **Persistence**: Managed via IndexedDB in the worker thread.
- **Agentic Loop**: Executes complex tasks using LLM providers.
- **Tool Execution**: Interfaces with the `SandboxManager` to run commands.

### 2. The Orchestrator (`claw-orchestrator.ts`)
The main-thread bridge that manages communication between the Svelte UI and the background worker. It uses a request-response pattern over `postMessage`.

### 3. Sandbox Management (`sandbox-manager.ts`)
Provides multiple execution tiers:
- **WASI (In-Browser)**: Lightweight WASM-based execution.
- **Container2WASM (🐳)**: A full Linux kernel running in a browser-based WASM container.
- **Native (Local)**: Connects to a local companion CLI via WebSockets for full host access.

### 4. Storage Bridge (`storage-bridge.ts`)
Utilities for interacting with IndexedDB, including exports, imports, and secret management.

## Technical Patterns

- **Constants-Driven Development**: Magic strings and numbers are strictly prohibited. All configuration tokens are centralized in `constants.ts`.
- **Atomic State Updates**: The worker handles state mutations and broadcasts updates to all connected tabs.
- **WASM Isolation**: Sensitive operations (encryption, kernel execution) are performed in WASM for security and performance.

## Design Philosophy

EZ-Claw follows a premium, OLED-friendly design system with a focus on:
- High contrast and readability (Perfect blacks).
- Subtle, high-quality animations.
- Neon-violet and teal accents for a modern "hacker" aesthetic.
- Reduced glassmorphism in favor of solid, elevated surfaces.
