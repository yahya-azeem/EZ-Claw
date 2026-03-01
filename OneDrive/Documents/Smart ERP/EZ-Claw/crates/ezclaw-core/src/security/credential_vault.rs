//! Credential vault — adapted from IronClaw's credential protection.
//!
//! Secrets (API keys, tokens) are stored encrypted with ChaCha20Poly1305
//! (same cipher as ZeroClaw's crypto module). The critical IronClaw
//! innovation is **boundary injection**: secrets are NEVER exposed to
//! the LLM context or to WASM tools. They are injected only at the
//! HTTP request boundary by the TypeScript fetch bridge.
//!
//! # How It Works
//!
//! 1. User stores API key → encrypted in IndexedDB via WASM crypto
//! 2. Agent says "call OpenAI" → tool request created WITHOUT the key
//! 3. TS bridge intercepts → asks WASM vault for credential mapping
//! 4. WASM vault returns: "for api.openai.com, set header Authorization = Bearer {decrypted_key}"
//! 5. TS bridge injects the header AFTER all security checks
//! 6. Key never appears in LLM context, tool args, or agent observations

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

/// How a credential should be injected into an HTTP request.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CredentialMapping {
    /// Unique identifier for this credential.
    pub id: String,
    /// Human-readable label (e.g., "OpenAI API Key").
    pub label: String,
    /// Domain this credential applies to (e.g., "api.openai.com").
    pub domain: String,
    /// Optional path pattern (e.g., "/v1/*").
    pub path_pattern: Option<String>,
    /// How to inject: "header", "query", "body".
    pub inject_type: InjectType,
    /// Header name, query param name, or body key.
    pub inject_key: String,
    /// Prefix to prepend to the value (e.g., "Bearer ").
    pub inject_prefix: String,
}

/// How the credential is injected into the request.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InjectType {
    /// Set as HTTP header (e.g., Authorization: Bearer <key>).
    Header,
    /// Append as query parameter.
    Query,
    /// Insert into JSON body.
    Body,
}

/// Audit log entry for credential accesses.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CredentialAccessLog {
    pub credential_id: String,
    pub domain: String,
    pub timestamp: String,
    pub tool_name: String,
    pub action: String, // "injected", "denied", "not_found"
}

/// Credential vault — manages encrypted secrets with boundary injection.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CredentialVault {
    /// Credential mappings (how to inject each cred).
    mappings: Vec<CredentialMapping>,
    /// Encrypted credential values (id → hex-encoded encrypted data).
    /// The actual decryption happens via the crypto module.
    encrypted_values: HashMap<String, String>,
    /// Access audit log (most recent N entries).
    audit_log: Vec<CredentialAccessLog>,
    /// Max audit log entries.
    max_audit_entries: usize,
}

impl Default for CredentialVault {
    fn default() -> Self {
        Self {
            mappings: Vec::new(),
            encrypted_values: HashMap::new(),
            audit_log: Vec::new(),
            max_audit_entries: 1000,
        }
    }
}

impl CredentialVault {
    pub fn new() -> Self {
        Self::default()
    }

    /// Store a credential mapping (without the actual secret value).
    pub fn add_mapping(&mut self, mapping: CredentialMapping) {
        // Remove existing mapping with same id
        self.mappings.retain(|m| m.id != mapping.id);
        self.mappings.push(mapping);
    }

    /// Store the encrypted value for a credential.
    /// The value should already be encrypted by the crypto module.
    pub fn store_encrypted(&mut self, credential_id: &str, encrypted_hex: &str) {
        self.encrypted_values
            .insert(credential_id.to_string(), encrypted_hex.to_string());
    }

    /// Find which credential mapping applies to a given URL.
    pub fn find_mapping_for_url(&self, url: &str) -> Option<&CredentialMapping> {
        let url_lower = url.to_lowercase();

        for mapping in &self.mappings {
            // Extract domain from URL
            let domain_start = url_lower.find("://").map(|p| p + 3).unwrap_or(0);
            let after_scheme = &url_lower[domain_start..];
            let domain_end = after_scheme.find('/').unwrap_or(after_scheme.len());
            let url_domain = after_scheme[..domain_end]
                .split(':')
                .next()
                .unwrap_or("");

            if url_domain == mapping.domain {
                // Check path pattern if specified
                if let Some(ref pattern) = mapping.path_pattern {
                    let url_path = if domain_end < after_scheme.len() {
                        &after_scheme[domain_end..]
                    } else {
                        "/"
                    };
                    if !url_path.starts_with(pattern.trim_end_matches('*')) {
                        continue;
                    }
                }
                return Some(mapping);
            }
        }
        None
    }

    /// Get the encrypted value for a credential ID.
    pub fn get_encrypted(&self, credential_id: &str) -> Option<&str> {
        self.encrypted_values.get(credential_id).map(|s| s.as_str())
    }

    /// Check if a credential exists.
    pub fn has_credential(&self, credential_id: &str) -> bool {
        self.encrypted_values.contains_key(credential_id)
    }

    /// Record an access in the audit log.
    pub fn log_access(&mut self, entry: CredentialAccessLog) {
        self.audit_log.push(entry);
        // Trim if over limit
        if self.audit_log.len() > self.max_audit_entries {
            let excess = self.audit_log.len() - self.max_audit_entries;
            self.audit_log.drain(..excess);
        }
    }

    /// Get recent audit log entries.
    pub fn recent_accesses(&self, limit: usize) -> &[CredentialAccessLog] {
        let start = self.audit_log.len().saturating_sub(limit);
        &self.audit_log[start..]
    }

    /// Remove a credential entirely.
    pub fn remove(&mut self, credential_id: &str) {
        self.mappings.retain(|m| m.id != credential_id);
        self.encrypted_values.remove(credential_id);
    }

    /// List all credential IDs and labels (no secret values).
    pub fn list_credentials(&self) -> Vec<(&str, &str)> {
        self.mappings
            .iter()
            .map(|m| (m.id.as_str(), m.label.as_str()))
            .collect()
    }

    /// Get mapping count.
    pub fn count(&self) -> usize {
        self.mappings.len()
    }
}

// ── WASM Bindings ────────────────────────────────────────────────

#[wasm_bindgen]
pub struct WasmCredentialVault {
    inner: CredentialVault,
}

#[wasm_bindgen]
impl WasmCredentialVault {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: CredentialVault::default(),
        }
    }

    /// Add a credential mapping from JSON.
    #[wasm_bindgen]
    pub fn add_mapping_json(&mut self, json: &str) -> Result<(), JsValue> {
        let mapping: CredentialMapping = serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("Invalid mapping: {}", e)))?;
        self.inner.add_mapping(mapping);
        Ok(())
    }

    /// Store encrypted value for a credential.
    #[wasm_bindgen]
    pub fn store_encrypted(&mut self, credential_id: &str, encrypted_hex: &str) {
        self.inner.store_encrypted(credential_id, encrypted_hex);
    }

    /// Find credential mapping for a URL. Returns JSON or empty string.
    #[wasm_bindgen]
    pub fn find_mapping_for_url(&self, url: &str) -> String {
        match self.inner.find_mapping_for_url(url) {
            Some(m) => serde_json::to_string(m).unwrap_or_default(),
            None => String::new(),
        }
    }

    /// Get encrypted value for a credential ID.
    #[wasm_bindgen]
    pub fn get_encrypted(&self, credential_id: &str) -> Option<String> {
        self.inner.get_encrypted(credential_id).map(|s| s.to_string())
    }

    /// Check if credential exists.
    #[wasm_bindgen]
    pub fn has_credential(&self, credential_id: &str) -> bool {
        self.inner.has_credential(credential_id)
    }

    /// Remove a credential.
    #[wasm_bindgen]
    pub fn remove_credential(&mut self, credential_id: &str) {
        self.inner.remove(credential_id);
    }

    /// List all credentials as JSON (id + label, no secrets).
    #[wasm_bindgen]
    pub fn list_json(&self) -> String {
        let list: Vec<_> = self
            .inner
            .list_credentials()
            .into_iter()
            .map(|(id, label)| serde_json::json!({"id": id, "label": label}))
            .collect();
        serde_json::to_string(&list).unwrap_or_default()
    }

    /// Log a credential access. Returns audit log entry JSON.
    #[wasm_bindgen]
    pub fn log_access(
        &mut self,
        credential_id: &str,
        domain: &str,
        tool_name: &str,
        action: &str,
    ) {
        self.inner.log_access(CredentialAccessLog {
            credential_id: credential_id.to_string(),
            domain: domain.to_string(),
            timestamp: String::new(), // Set by TS bridge
            tool_name: tool_name.to_string(),
            action: action.to_string(),
        });
    }

    /// Get recent audit log as JSON.
    #[wasm_bindgen]
    pub fn recent_accesses_json(&self, limit: usize) -> String {
        serde_json::to_string(self.inner.recent_accesses(limit)).unwrap_or_default()
    }

    /// Export vault state as JSON (for IndexedDB persistence).
    #[wasm_bindgen]
    pub fn export_json(&self) -> String {
        serde_json::to_string(&self.inner).unwrap_or_default()
    }

    /// Import vault state from JSON.
    #[wasm_bindgen]
    pub fn import_json(&mut self, json: &str) -> Result<(), JsValue> {
        self.inner = serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("Invalid vault JSON: {}", e)))?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn test_mapping() -> CredentialMapping {
        CredentialMapping {
            id: "openai_key".into(),
            label: "OpenAI API Key".into(),
            domain: "api.openai.com".into(),
            path_pattern: Some("/v1/".into()),
            inject_type: InjectType::Header,
            inject_key: "Authorization".into(),
            inject_prefix: "Bearer ".into(),
        }
    }

    #[test]
    fn mapping_found_by_url() {
        let mut vault = CredentialVault::new();
        vault.add_mapping(test_mapping());
        vault.store_encrypted("openai_key", "abc123encrypted");

        let mapping = vault.find_mapping_for_url("https://api.openai.com/v1/chat/completions");
        assert!(mapping.is_some());
        assert_eq!(mapping.unwrap().id, "openai_key");
    }

    #[test]
    fn no_mapping_for_unknown_domain() {
        let vault = CredentialVault::new();
        assert!(vault.find_mapping_for_url("https://evil.com/steal").is_none());
    }

    #[test]
    fn audit_log_tracks_accesses() {
        let mut vault = CredentialVault::new();
        vault.log_access(CredentialAccessLog {
            credential_id: "test".into(),
            domain: "api.openai.com".into(),
            timestamp: "2026-01-01T00:00:00Z".into(),
            tool_name: "web_search".into(),
            action: "injected".into(),
        });
        assert_eq!(vault.recent_accesses(10).len(), 1);
    }

    #[test]
    fn remove_credential() {
        let mut vault = CredentialVault::new();
        vault.add_mapping(test_mapping());
        vault.store_encrypted("openai_key", "encrypted");
        assert!(vault.has_credential("openai_key"));

        vault.remove("openai_key");
        assert!(!vault.has_credential("openai_key"));
    }
}
