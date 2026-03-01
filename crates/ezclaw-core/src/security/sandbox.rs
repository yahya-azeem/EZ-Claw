//! Sandbox manager — adapted from IronClaw's SandboxManager.
//!
//! Orchestrates the full security pipeline for tool execution:
//!
//! ```text
//! Tool Request
//!   → Permission Check (capability-based)
//!   → Domain Allowlist Validation (for HTTP)
//!   → Leak Scan (outbound)
//!   → Credential Injection Mapping
//!   → [Execute via TS Bridge]
//!   → Leak Scan (inbound)
//!   → Prompt Defense (on response)
//!   → Tool Response
//! ```
//!
//! # Sandbox Policies (from IronClaw)
//!
//! | Policy | Filesystem | Network | Use Case |
//! |--------|-----------|---------|----------|
//! | `ReadOnly` | Read workspace | Allowlisted only | Search, fetch docs |
//! | `WorkspaceWrite` | Read/write workspace | Allowlisted only | Build, edit files |
//! | `FullAccess` | Full (native CLI) | All | Power user mode |

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

use super::allowlist::DomainAllowlist;
use super::credential_vault::{CredentialMapping, CredentialVault};
use super::leak_detection::{LeakAction, LeakScanner};
use super::permissions::SecurityPolicy;
use super::prompt_defense::PromptDefense;

/// Sandbox policy tier (adapted from IronClaw).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SandboxPolicy {
    /// Read workspace only, allowlisted network.
    ReadOnly,
    /// Read/write workspace, allowlisted network.
    WorkspaceWrite,
    /// Full access (requires companion CLI or explicit grant).
    FullAccess,
}

impl Default for SandboxPolicy {
    fn default() -> Self {
        SandboxPolicy::WorkspaceWrite
    }
}

/// Resource limits for tool execution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceLimits {
    /// Max execution time in milliseconds.
    pub timeout_ms: u64,
    /// Max output size in bytes.
    pub max_output_bytes: usize,
    /// Max memory usage in bytes (for WASI sandbox).
    pub max_memory_bytes: usize,
}

impl Default for ResourceLimits {
    fn default() -> Self {
        Self {
            timeout_ms: 30_000,           // 30 seconds
            max_output_bytes: 1_048_576,  // 1 MB
            max_memory_bytes: 67_108_864, // 64 MB
        }
    }
}

/// Request to execute a tool (from the agent loop).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolExecutionRequest {
    /// Tool name (e.g., "web_search", "read_file").
    pub tool_name: String,
    /// Tool arguments as JSON string.
    pub arguments: String,
    /// Required capabilities for this tool call.
    pub required_capabilities: Vec<String>,
    /// Target URL (if HTTP request).
    pub target_url: Option<String>,
    /// Request body (if HTTP request).
    pub request_body: Option<String>,
}

/// Result of security pipeline validation.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecurityCheckResult {
    /// Whether the tool call is approved.
    pub approved: bool,
    /// Reason for rejection (if any).
    pub rejection_reason: Option<String>,
    /// Whether user confirmation is needed.
    pub needs_confirmation: bool,
    /// Confirmation prompt for the user.
    pub confirmation_prompt: Option<String>,
    /// Credential mapping to inject (if applicable).
    pub credential_mapping: Option<CredentialInjection>,
    /// Any warnings to display.
    pub warnings: Vec<String>,
    /// Sanitized request body (if leak/defense modified it).
    pub sanitized_body: Option<String>,
}

/// Instructions for the TS bridge to inject credentials.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CredentialInjection {
    pub credential_id: String,
    pub inject_type: String, // "header", "query", "body"
    pub inject_key: String,
    pub inject_prefix: String,
}

impl SecurityCheckResult {
    pub fn approved() -> Self {
        Self {
            approved: true,
            rejection_reason: None,
            needs_confirmation: false,
            confirmation_prompt: None,
            credential_mapping: None,
            warnings: Vec::new(),
            sanitized_body: None,
        }
    }

    pub fn rejected(reason: &str) -> Self {
        Self {
            approved: false,
            rejection_reason: Some(reason.to_string()),
            needs_confirmation: false,
            confirmation_prompt: None,
            credential_mapping: None,
            warnings: Vec::new(),
            sanitized_body: None,
        }
    }

    pub fn needs_confirmation(prompt: &str) -> Self {
        Self {
            approved: false,
            rejection_reason: None,
            needs_confirmation: true,
            confirmation_prompt: Some(prompt.to_string()),
            credential_mapping: None,
            warnings: Vec::new(),
            sanitized_body: None,
        }
    }
}

/// The sandbox manager — central security orchestrator.
///
/// Adapted from IronClaw's `SandboxManager` + `NetworkProxy`.
#[derive(Debug, Clone)]
pub struct SandboxManager {
    pub policy: SandboxPolicy,
    pub security_policy: SecurityPolicy,
    pub allowlist: DomainAllowlist,
    pub leak_scanner: LeakScanner,
    pub credential_vault: CredentialVault,
    pub prompt_defense: PromptDefense,
    pub resource_limits: ResourceLimits,
    /// Execution audit log.
    audit_log: Vec<AuditEntry>,
}

/// Audit log entry for tool executions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuditEntry {
    pub tool_name: String,
    pub action: String, // "approved", "denied", "confirmed", "blocked_leak"
    pub details: String,
    pub timestamp: String,
}

impl Default for SandboxManager {
    fn default() -> Self {
        Self {
            policy: SandboxPolicy::default(),
            security_policy: SecurityPolicy::default(),
            allowlist: DomainAllowlist::default(),
            leak_scanner: LeakScanner::default(),
            credential_vault: CredentialVault::default(),
            prompt_defense: PromptDefense::default(),
            resource_limits: ResourceLimits::default(),
            audit_log: Vec::new(),
        }
    }
}

impl SandboxManager {
    pub fn new() -> Self {
        Self::default()
    }

    /// Run the full security pipeline on a tool execution request.
    ///
    /// This is the core function that mirrors IronClaw's pipeline:
    /// Permission → Allowlist → Leak Scan → Credential Mapping
    pub fn check_request(&mut self, request: &ToolExecutionRequest) -> SecurityCheckResult {
        let mut result = SecurityCheckResult::approved();

        // ─── Step 1: Permission Check ───
        for capability in &request.required_capabilities {
            if self
                .security_policy
                .is_denied(&request.tool_name, capability)
            {
                self.log_audit(
                    &request.tool_name,
                    "denied",
                    &format!("Capability '{}' denied", capability),
                );
                return SecurityCheckResult::rejected(&format!(
                    "Tool '{}' does not have '{}' permission",
                    request.tool_name, capability
                ));
            }

            if self
                .security_policy
                .requires_confirmation(&request.tool_name, capability)
            {
                result.needs_confirmation = true;
                result.confirmation_prompt = Some(format!(
                    "Tool '{}' wants to use '{}' capability. Allow?",
                    request.tool_name, capability
                ));
            }
        }

        // ─── Step 2: Domain Allowlist (for HTTP requests) ───
        if let Some(ref url) = request.target_url {
            if !self.allowlist.is_allowed(url) {
                self.log_audit(
                    &request.tool_name,
                    "denied",
                    &format!("URL not in allowlist: {}", url),
                );
                return SecurityCheckResult::rejected(&format!("URL not in allowlist: {}", url));
            }
        }

        // ─── Step 3: Leak Detection (outbound) ───
        // Scan the request body for secret leaks
        if let Some(ref body) = request.request_body {
            let leak_result = self.leak_scanner.scan(body);
            if leak_result.detected {
                match leak_result.action {
                    LeakAction::Block => {
                        self.log_audit(
                            &request.tool_name,
                            "blocked_leak",
                            &format!(
                                "Secret leak detected in request: {}",
                                leak_result.pattern.as_deref().unwrap_or("unknown")
                            ),
                        );
                        return SecurityCheckResult::rejected(&format!(
                            "Potential secret leak detected: {}",
                            leak_result.pattern.unwrap_or_default()
                        ));
                    }
                    LeakAction::Warn => {
                        result.warnings.push(format!(
                            "⚠️ Potential secret in request: {}",
                            leak_result.pattern.unwrap_or_default()
                        ));
                    }
                    LeakAction::Log => {
                        // Just log it
                    }
                }
            }
        }

        // Also scan the arguments
        let args_leak = self.leak_scanner.scan(&request.arguments);
        if args_leak.detected && args_leak.action == LeakAction::Block {
            self.log_audit(
                &request.tool_name,
                "blocked_leak",
                "Secret leak detected in arguments",
            );
            return SecurityCheckResult::rejected("Potential secret leak in tool arguments");
        }

        // ─── Step 4: Credential Mapping ───
        // If this is an HTTP request, find the credential to inject
        if let Some(ref url) = request.target_url {
            if let Some(mapping) = self.credential_vault.find_mapping_for_url(url) {
                if self.credential_vault.has_credential(&mapping.id) {
                    result.credential_mapping = Some(CredentialInjection {
                        credential_id: mapping.id.clone(),
                        inject_type: match &mapping.inject_type {
                            super::credential_vault::InjectType::Header => "header".into(),
                            super::credential_vault::InjectType::Query => "query".into(),
                            super::credential_vault::InjectType::Body => "body".into(),
                        },
                        inject_key: mapping.inject_key.clone(),
                        inject_prefix: mapping.inject_prefix.clone(),
                    });
                }
            }
        }

        // ─── Step 5: Filesystem policy ───
        if request
            .required_capabilities
            .iter()
            .any(|c| c == "filesystem")
        {
            match self.policy {
                SandboxPolicy::ReadOnly => {
                    // Only allow read operations
                    if request.tool_name.contains("write")
                        || request.tool_name.contains("delete")
                        || request.tool_name.contains("mkdir")
                    {
                        return SecurityCheckResult::rejected(
                            "ReadOnly sandbox policy: write operations not allowed",
                        );
                    }
                }
                SandboxPolicy::WorkspaceWrite => {
                    // Allow read/write within workspace (enforced by workspace module)
                }
                SandboxPolicy::FullAccess => {
                    // Allow everything
                }
            }
        }

        if result.needs_confirmation {
            result.approved = false; // Wait for user confirmation
        }

        if result.approved {
            self.log_audit(&request.tool_name, "approved", "Security checks passed");
        }

        result
    }

    /// Scan an inbound response for leaks and injection.
    pub fn check_response(&self, tool_name: &str, response: &str) -> (String, Vec<String>) {
        let mut warnings = Vec::new();
        let mut output = response.to_string();

        // Leak scan on response
        let leak_result = self.leak_scanner.scan(response);
        if leak_result.detected {
            warnings.push(format!(
                "⚠️ Response contains potential secret: {}",
                leak_result.pattern.unwrap_or_default()
            ));
        }

        // Prompt defense scan
        let defense_result = self.prompt_defense.scan(response);
        if defense_result.threat_level >= super::prompt_defense::ThreatLevel::Medium {
            warnings.push(format!(
                "⚠️ Response contains potential injection: {:?}",
                defense_result.matches.first().map(|m| &m.label)
            ));
            // Wrap the output for safety
            output = PromptDefense::wrap_tool_output(tool_name, &output);
        }

        (output, warnings)
    }

    /// Log an audit entry.
    fn log_audit(&mut self, tool_name: &str, action: &str, details: &str) {
        self.audit_log.push(AuditEntry {
            tool_name: tool_name.to_string(),
            action: action.to_string(),
            details: details.to_string(),
            timestamp: String::new(), // Set by caller/TS bridge
        });

        // Keep last 500 entries
        if self.audit_log.len() > 500 {
            self.audit_log.drain(..self.audit_log.len() - 500);
        }
    }

    /// Get recent audit entries.
    pub fn recent_audit(&self, limit: usize) -> &[AuditEntry] {
        let start = self.audit_log.len().saturating_sub(limit);
        &self.audit_log[start..]
    }

    // ─── Convenience methods (used by WasmAgent in agent.rs) ───

    /// Add a credential mapping from JSON string.
    pub fn add_credential_mapping(&mut self, json: &str) -> Result<(), JsValue> {
        let mapping: CredentialMapping = serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("Invalid mapping: {}", e)))?;
        self.credential_vault.add_mapping(mapping);
        Ok(())
    }

    /// Store an encrypted credential value.
    pub fn store_credential(&mut self, id: &str, encrypted_hex: &str) {
        self.credential_vault.store_encrypted(id, encrypted_hex);
    }

    /// Add a domain to the allowlist.
    pub fn add_allowed_domain(&mut self, domain: &str, path: &str, label: &str) -> bool {
        use super::allowlist::AllowlistEntry;
        let path_pattern = if path.is_empty() { None } else { Some(path) };
        self.allowlist
            .add(AllowlistEntry::new(domain, path_pattern, label, false))
    }

    /// Register a secret for leak detection.
    pub fn register_secret(&mut self, secret: &str) {
        self.leak_scanner.register_secret(secret);
    }

    /// Get audit log as JSON.
    pub fn audit_log_json(&self, limit: usize) -> String {
        serde_json::to_string(self.recent_audit(limit)).unwrap_or_default()
    }

    /// Export full state for persistence.
    pub fn export_state(&self) -> String {
        serde_json::to_string(&serde_json::json!({
            "policy": self.policy,
            "allowlist": self.allowlist,
            "credential_vault": self.credential_vault,
            "resource_limits": self.resource_limits,
            "security_policy": self.security_policy,
        }))
        .unwrap_or_default()
    }
}

// ── WASM Bindings ────────────────────────────────────────────────

#[wasm_bindgen]
pub struct WasmSandboxManager {
    inner: SandboxManager,
}

#[wasm_bindgen]
impl WasmSandboxManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: SandboxManager::default(),
        }
    }

    /// Run security checks on a tool request. Returns JSON SecurityCheckResult.
    #[wasm_bindgen]
    pub fn check_request(&mut self, request_json: &str) -> String {
        let request: Result<ToolExecutionRequest, _> = serde_json::from_str(request_json);
        match request {
            Ok(req) => {
                let result = self.inner.check_request(&req);
                serde_json::to_string(&result).unwrap_or_default()
            }
            Err(e) => {
                let result = SecurityCheckResult::rejected(&format!("Invalid request: {}", e));
                serde_json::to_string(&result).unwrap_or_default()
            }
        }
    }

    /// Check a response for leaks/injection. Returns JSON { output, warnings }.
    #[wasm_bindgen]
    pub fn check_response(&self, tool_name: &str, response: &str) -> String {
        let (output, warnings) = self.inner.check_response(tool_name, response);
        serde_json::to_string(&serde_json::json!({
            "output": output,
            "warnings": warnings,
        }))
        .unwrap_or_default()
    }

    /// Set sandbox policy: "readonly", "workspace_write", "full_access".
    #[wasm_bindgen]
    pub fn set_policy(&mut self, policy: &str) {
        self.inner.policy = match policy {
            "readonly" => SandboxPolicy::ReadOnly,
            "full_access" => SandboxPolicy::FullAccess,
            _ => SandboxPolicy::WorkspaceWrite,
        };
    }

    /// Add domain to allowlist.
    #[wasm_bindgen]
    pub fn add_allowed_domain(&mut self, domain: &str, path: &str, label: &str) -> bool {
        use super::allowlist::AllowlistEntry;
        let path_pattern = if path.is_empty() { None } else { Some(path) };
        self.inner
            .allowlist
            .add(AllowlistEntry::new(domain, path_pattern, label, false))
    }

    /// Register a secret for leak detection.
    #[wasm_bindgen]
    pub fn register_secret(&mut self, secret: &str) {
        self.inner.leak_scanner.register_secret(secret);
    }

    /// Store credential mapping from JSON.
    #[wasm_bindgen]
    pub fn add_credential_mapping(&mut self, json: &str) -> Result<(), JsValue> {
        let mapping: CredentialMapping = serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("Invalid mapping: {}", e)))?;
        self.inner.credential_vault.add_mapping(mapping);
        Ok(())
    }

    /// Store encrypted credential value.
    #[wasm_bindgen]
    pub fn store_credential(&mut self, id: &str, encrypted_hex: &str) {
        self.inner
            .credential_vault
            .store_encrypted(id, encrypted_hex);
    }

    /// Get recent audit log as JSON.
    #[wasm_bindgen]
    pub fn audit_log_json(&self, limit: usize) -> String {
        serde_json::to_string(self.inner.recent_audit(limit)).unwrap_or_default()
    }

    /// Export full state for persistence.
    #[wasm_bindgen]
    pub fn export_state(&self) -> String {
        serde_json::to_string(&serde_json::json!({
            "policy": self.inner.policy,
            "allowlist": self.inner.allowlist,
            "credential_vault": self.inner.credential_vault,
            "resource_limits": self.inner.resource_limits,
            "security_policy": self.inner.security_policy,
        }))
        .unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_request(tool_name: &str, capabilities: Vec<&str>) -> ToolExecutionRequest {
        ToolExecutionRequest {
            tool_name: tool_name.to_string(),
            arguments: "{}".to_string(),
            required_capabilities: capabilities.into_iter().map(|s| s.to_string()).collect(),
            target_url: None,
            request_body: None,
        }
    }

    #[test]
    fn approves_basic_read() {
        let mut manager = SandboxManager::new();
        let req = test_request("read_file", vec!["filesystem"]);
        let result = manager.check_request(&req);
        assert!(result.approved);
    }

    #[test]
    fn blocks_unapproved_url() {
        let mut manager = SandboxManager::new();
        let req = ToolExecutionRequest {
            tool_name: "web_fetch".into(),
            arguments: "{}".into(),
            required_capabilities: vec!["http".into()],
            target_url: Some("https://evil.com/steal".into()),
            request_body: None,
        };
        let result = manager.check_request(&req);
        assert!(!result.approved);
    }

    #[test]
    fn allows_openai_url() {
        let mut manager = SandboxManager::new();
        let req = ToolExecutionRequest {
            tool_name: "llm_call".into(),
            arguments: "{}".into(),
            required_capabilities: vec!["http".into()],
            target_url: Some("https://api.openai.com/v1/chat/completions".into()),
            request_body: Some("{}".into()),
        };
        let result = manager.check_request(&req);
        assert!(result.approved);
    }

    #[test]
    fn blocks_leak_in_request() {
        let mut manager = SandboxManager::new();
        let req = ToolExecutionRequest {
            tool_name: "web_fetch".into(),
            arguments: "{}".into(),
            required_capabilities: vec!["http".into()],
            target_url: Some("https://api.openai.com/v1/test".into()),
            request_body: Some("Here is my key: sk-abc123456789012345678901234567890".into()),
        };
        let result = manager.check_request(&req);
        assert!(!result.approved);
        assert!(result.rejection_reason.unwrap().contains("leak"));
    }

    #[test]
    fn readonly_blocks_write() {
        let mut manager = SandboxManager::new();
        manager.policy = SandboxPolicy::ReadOnly;
        let req = test_request("write_file", vec!["filesystem"]);
        let result = manager.check_request(&req);
        assert!(!result.approved);
    }

    #[test]
    fn audit_log_records() {
        let mut manager = SandboxManager::new();
        let req = test_request("read_file", vec!["filesystem"]);
        manager.check_request(&req);
        assert!(!manager.recent_audit(10).is_empty());
    }
}
