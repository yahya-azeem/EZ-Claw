//! Security module — IronClaw-inspired defense-in-depth for browser WASM.
//!
//! Adapted from IronClaw's (nearai/ironclaw) security architecture:
//! - Capability-based permissions (seL4-like zero-access default)
//! - Domain allowlist validator
//! - Leak detection scanner (secret exfiltration prevention)
//! - Credential vault with boundary-only injection
//! - Prompt injection defense
//! - Sandbox manager with policy tiers
//!
//! # Security Pipeline
//!
//! ```text
//! Tool Request → Allowlist Validator → Leak Scan (outbound)
//!     → Credential Injector → Execute (via TS bridge)
//!     → Leak Scan (inbound) → Tool Response
//! ```
//!
//! All processing happens in WASM for performance and isolation.

pub mod allowlist;
pub mod credential_vault;
pub mod leak_detection;
pub mod permissions;
pub mod prompt_defense;
pub mod sandbox;

// Re-exports
pub use allowlist::{AllowlistEntry, DomainAllowlist};
pub use credential_vault::{CredentialMapping, CredentialVault};
pub use leak_detection::{LeakAction, LeakDetectionResult, LeakScanner};
pub use permissions::{Permission, SecurityPolicy, ToolPermissions};
pub use prompt_defense::{DefenseAction, PromptDefense, ThreatLevel};
pub use sandbox::{SandboxManager, SandboxPolicy};
