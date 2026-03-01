//! EZ-Claw WASM core — autonomous agent platform.
//!
//! Combines ZeroClaw's efficiency, IronClaw's security, and OpenClaw's
//! feature set — all running client-side in WebAssembly.
//!
//! # Architecture
//!
//! - **Agent Engine** — ReAct loop, planning, tool dispatch
//! - **Security Layer** — IronClaw-adapted: WASM sandbox, leak detection,
//!   credential vault, prompt injection defense
//! - **Knowledge** — Memory, identity, workspace filesystem
//! - **Config** — Model providers, settings
//!
//! TypeScript bridge handles browser APIs (fetch, IndexedDB, OPFS).
//! Async operations bridge to JS Promises via `wasm-bindgen-futures`.

use wasm_bindgen::prelude::*;

// ── Core modules (ZeroClaw heritage) ──
pub mod agent;
pub mod config;
pub mod crypto;
pub mod identity;
pub mod memory;
pub mod providers;
pub mod text;

// ── Phase 1: Agent Engine + Security ──
pub mod security;
pub mod tools;
pub mod planning;
pub mod workspace;

// ── Phase 2: Skills + MCP + Dynamic Tools ──
pub mod skills;
pub mod dynamic_tools;

// ── Phase 3: Messaging Channels + Routines ──
pub mod channels;
pub mod routines;

/// Initialize WASM module — sets panic hook for better error messages.
#[wasm_bindgen(start)]
pub fn init() {
    console_error_panic_hook::set_once();
}

/// Get EZ-Claw version string.
#[wasm_bindgen]
pub fn version() -> String {
    format!(
        "ezclaw-core {} (ZeroClaw WASM port)",
        env!("CARGO_PKG_VERSION")
    )
}

/// Health check — returns true if WASM module is loaded and operational.
#[wasm_bindgen]
pub fn health_check() -> bool {
    true
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn version_includes_package_version() {
        let v = version();
        assert!(v.contains("ezclaw-core"));
        assert!(v.contains("ZeroClaw"));
    }

    #[test]
    fn health_check_returns_true() {
        assert!(health_check());
    }
}
