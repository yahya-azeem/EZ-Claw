# EZ-Claw Architecture Specification

## Overview

This document outlines the architecture for upgrading EZ-Claw to achieve feature parity with IronClaw while being browser-native.

## Target Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        EZ-Claw UI                              │
│  (Svelte + TypeScript + WASM)                                 │
└────────────────────────┬────────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
┌───────────────┐ ┌───────────┐ ┌───────────────┐
│   Persona    │ │  Skills   │ │  Workspace   │
│   Layer      │ │   Layer   │ │    Layer     │
│  (Soul.md)   │ │ (SKILL.md) │ │ (Files)      │
└───────────────┘ └───────────┘ └───────────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                   WASI Container Layer                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │         container2wasm (Alpine Linux)             │    │
│  │  - Pre-booted with wizer                          │    │
│  │  - WASM runtime (wasmtime)                       │    │
│  │  - VFS mounted from OPFS                          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Layer Definitions

### 1. Persona Layer (Identity)
- **Soul.md**: Core identity, values, personality
- **Agent.md**: Behavioral instructions, preferences
- **Persona**: Runtime persona selection (hot-swappable)

### 2. Skills Layer
- **SKILL.md files**: Tool definitions
- **Skills registry**: Trust-gated skill management
- **Notes**: User notes and memories

### 3. Workspace Layer
- **Working directory**: User's active files
- **OPFS**: Origin Private File System for persistence
- **Mount point**: `/workspace` in WASI container

## WASI Container Implementation

### Build Pipeline

```bash
# 1. Build Alpine Linux with wizer pre-boot
docker build -t alpine-wizer:latest -f Dockerfile.wizer .
docker run -v $(pwd)/out:/out alpine-wizer:latest \
  c2w --wizer alpine:3.19 /out/alpine-wasm.wasm

# 2. Architecture detection
# Detect client architecture (x86_64 vs AArch64)
# Serve optimized WASM binary

# 3. Runtime loading
# Load WASM blob in browser
# Mount OPFS workspace to container
```

### Browser Integration

```javascript
// WASI shim loads container
const container = await WASIContainer.load('/containers/alpine.wasm');

// Mount workspace from OPFS
await container.mount('/workspace', opfsRoot);

// Execute commands
const result = await container.run('ls', ['-la', '/workspace']);
```

## Shell Command Tool

```json
{
  "name": "run_shell_command",
  "description": "Execute a shell command in the WASI container",
  "parameters": {
    "type": "object",
    "properties": {
      "command": { "type": "string" },
      "args": { "type": "array", "items": { "type": "string" } },
      "working_dir": { "type": "string", "default": "/workspace" }
    }
  }
}
```

Returns:
```json
{
  "stdout": "...",
  "stderr": "...",
  "exit_code": 0
}
```

## Container Images

| Image | Use Case | Size |
|-------|----------|------|
| alpine | Default, lightweight | ~5MB |
| kali | Security tools | ~100MB |

## Security Considerations

- WASM sandbox isolates untrusted code
- No direct filesystem access (only through WASI)
- Secrets injected at host boundary
- Network requests filtered through proxy
