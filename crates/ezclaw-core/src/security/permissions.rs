//! Capability-based permission system — adapted from IronClaw.
//!
//! Follows the seL4 microkernel principle: zero access by default,
//! every capability must be explicitly granted. Tools get nothing
//! unless the user/config opts in.
//!
//! # Permission Model
//!
//! Each tool has a `ToolPermissions` struct with per-capability grants:
//! - `http` — can make network requests (subject to allowlist)
//! - `filesystem` — can read/write workspace files
//! - `secrets` — can request credential injection at boundary
//! - `shell` — can execute shell commands (sandbox-dependent)
//! - `mcp` — can invoke MCP server tools
//!
//! # Autonomy Levels
//!
//! - `Manual` — confirm every tool invocation
//! - `Semi` — auto-approve reads, confirm writes/shell/network
//! - `Auto` — fully autonomous (with policy/allowlist enforcement)

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

/// Per-capability permission grant.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Permission {
    /// Allowed unconditionally.
    Allow,
    /// Blocked unconditionally.
    Deny,
    /// Requires user confirmation each time.
    Ask,
}

impl Default for Permission {
    fn default() -> Self {
        Permission::Deny // Zero-access default (IronClaw principle)
    }
}

/// Autonomy level — how much the agent can do without user confirmation.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AutonomyLevel {
    /// Confirm every tool call.
    Manual,
    /// Auto-approve reads; confirm writes, shell, network.
    Semi,
    /// Fully autonomous within policy.
    Auto,
}

impl Default for AutonomyLevel {
    fn default() -> Self {
        AutonomyLevel::Semi
    }
}

/// Per-tool capability permissions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolPermissions {
    pub http: Permission,
    pub filesystem: Permission,
    pub secrets: Permission,
    pub shell: Permission,
    pub mcp: Permission,
}

impl Default for ToolPermissions {
    fn default() -> Self {
        Self {
            http: Permission::Deny,
            filesystem: Permission::Deny,
            secrets: Permission::Deny,
            shell: Permission::Deny,
            mcp: Permission::Deny,
        }
    }
}

impl ToolPermissions {
    /// Built-in tools get restricted defaults.
    pub fn builtin_defaults() -> Self {
        Self {
            http: Permission::Allow,
            filesystem: Permission::Allow,
            secrets: Permission::Deny,
            shell: Permission::Deny,
            mcp: Permission::Deny,
        }
    }

    /// Trusted tools get broader access.
    pub fn trusted() -> Self {
        Self {
            http: Permission::Allow,
            filesystem: Permission::Allow,
            secrets: Permission::Ask,
            shell: Permission::Ask,
            mcp: Permission::Allow,
        }
    }

    /// Check if a specific capability is allowed.
    pub fn check(&self, capability: &str) -> Permission {
        match capability {
            "http" => self.http,
            "filesystem" => self.filesystem,
            "secrets" => self.secrets,
            "shell" => self.shell,
            "mcp" => self.mcp,
            _ => Permission::Deny,
        }
    }
}

/// Security policy for the entire agent session.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityPolicy {
    /// Global autonomy level.
    pub autonomy: AutonomyLevel,
    /// Default permissions for tools without explicit overrides.
    pub default_permissions: ToolPermissions,
    /// Per-tool permission overrides (tool_name → permissions).
    pub tool_overrides: HashMap<String, ToolPermissions>,
    /// Maximum agent loop iterations before requiring confirmation.
    pub max_auto_iterations: u32,
    /// Enable prompt injection defense.
    pub prompt_defense_enabled: bool,
    /// Enable leak detection on outbound requests.
    pub leak_detection_enabled: bool,
}

impl Default for SecurityPolicy {
    fn default() -> Self {
        Self {
            autonomy: AutonomyLevel::Semi,
            default_permissions: ToolPermissions::builtin_defaults(),
            tool_overrides: HashMap::new(),
            max_auto_iterations: 25,
            prompt_defense_enabled: true,
            leak_detection_enabled: true,
        }
    }
}

impl SecurityPolicy {
    /// Get effective permissions for a tool (override > default).
    pub fn permissions_for(&self, tool_name: &str) -> &ToolPermissions {
        self.tool_overrides
            .get(tool_name)
            .unwrap_or(&self.default_permissions)
    }

    /// Check if a tool call requires user confirmation based on autonomy level.
    pub fn requires_confirmation(
        &self,
        tool_name: &str,
        capability: &str,
    ) -> bool {
        let perm = self.permissions_for(tool_name).check(capability);
        match perm {
            Permission::Allow => {
                // Even with Allow, Manual autonomy still confirms
                self.autonomy == AutonomyLevel::Manual
            }
            Permission::Ask => true,
            Permission::Deny => true, // Denied = always block/confirm
        }
    }

    /// Check if a tool call is outright denied.
    pub fn is_denied(&self, tool_name: &str, capability: &str) -> bool {
        let perm = self.permissions_for(tool_name).check(capability);
        perm == Permission::Deny && self.autonomy != AutonomyLevel::Manual
    }
}

// ── WASM Bindings ────────────────────────────────────────────────

#[wasm_bindgen]
pub struct WasmSecurityPolicy {
    inner: SecurityPolicy,
}

#[wasm_bindgen]
impl WasmSecurityPolicy {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: SecurityPolicy::default(),
        }
    }

    /// Create from JSON config string.
    #[wasm_bindgen]
    pub fn from_json(json: &str) -> Result<WasmSecurityPolicy, JsValue> {
        let inner: SecurityPolicy = serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("Invalid policy JSON: {}", e)))?;
        Ok(Self { inner })
    }

    /// Serialize to JSON.
    #[wasm_bindgen]
    pub fn to_json(&self) -> String {
        serde_json::to_string(&self.inner).unwrap_or_default()
    }

    /// Check if a tool+capability requires user confirmation.
    #[wasm_bindgen]
    pub fn requires_confirmation(&self, tool_name: &str, capability: &str) -> bool {
        self.inner.requires_confirmation(tool_name, capability)
    }

    /// Check if a tool+capability is denied.
    #[wasm_bindgen]
    pub fn is_denied(&self, tool_name: &str, capability: &str) -> bool {
        self.inner.is_denied(tool_name, capability)
    }

    /// Set autonomy level: "manual", "semi", "auto".
    #[wasm_bindgen]
    pub fn set_autonomy(&mut self, level: &str) {
        self.inner.autonomy = match level {
            "manual" => AutonomyLevel::Manual,
            "auto" => AutonomyLevel::Auto,
            _ => AutonomyLevel::Semi,
        };
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_policy_denies_shell() {
        let policy = SecurityPolicy::default();
        assert!(policy.requires_confirmation("any_tool", "shell"));
    }

    #[test]
    fn builtin_allows_http_filesystem() {
        let policy = SecurityPolicy::default();
        let perms = policy.permissions_for("web_search");
        assert_eq!(perms.http, Permission::Allow);
        assert_eq!(perms.filesystem, Permission::Allow);
    }

    #[test]
    fn override_takes_precedence() {
        let mut policy = SecurityPolicy::default();
        policy.tool_overrides.insert(
            "dangerous_tool".into(),
            ToolPermissions::default(), // All deny
        );
        assert!(policy.is_denied("dangerous_tool", "http"));
    }

    #[test]
    fn zero_access_default() {
        let perms = ToolPermissions::default();
        assert_eq!(perms.http, Permission::Deny);
        assert_eq!(perms.filesystem, Permission::Deny);
        assert_eq!(perms.secrets, Permission::Deny);
        assert_eq!(perms.shell, Permission::Deny);
        assert_eq!(perms.mcp, Permission::Deny);
    }
}
