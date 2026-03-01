//! Domain allowlist validator — adapted from IronClaw's DomainAllowlist.
//!
//! Controls which HTTP endpoints tools can reach. All outbound requests
//! must pass through this validator before execution. Mirrors IronClaw's
//! `sandbox/proxy.rs` allowlist with glob-style path matching.
//!
//! # Default Allowlist
//!
//! LLM providers and free search APIs are pre-approved:
//! - `api.openai.com/*`, `api.anthropic.com/*`, `api.deepseek.com/*`
//! - `generativelanguage.googleapis.com/*`
//! - `api.duckduckgo.com/*` (free search, no key needed)
//!
//! Users can add custom entries for MCP servers, APIs, etc.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// A single allowlist entry: domain + optional path pattern.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AllowlistEntry {
    /// Domain to allow (e.g., "api.openai.com").
    pub domain: String,
    /// Optional path pattern with wildcards (e.g., "/v1/*"). None = all paths.
    pub path_pattern: Option<String>,
    /// Human-readable label.
    pub label: String,
    /// Whether this is a built-in (non-removable) entry.
    pub builtin: bool,
}

impl AllowlistEntry {
    pub fn new(domain: &str, path_pattern: Option<&str>, label: &str, builtin: bool) -> Self {
        Self {
            domain: domain.to_lowercase(),
            path_pattern: path_pattern.map(|p| p.to_string()),
            label: label.into(),
            builtin,
        }
    }

    /// Check if a URL matches this entry.
    pub fn matches(&self, url: &str) -> bool {
        // Parse the URL to extract domain and path
        let url_lower = url.to_lowercase();

        // Extract domain from URL
        let domain_start = if let Some(pos) = url_lower.find("://") {
            pos + 3
        } else {
            0
        };

        let after_scheme = &url_lower[domain_start..];
        let domain_end = after_scheme.find('/').unwrap_or(after_scheme.len());
        let url_domain = &after_scheme[..domain_end];

        // Strip port for comparison
        let url_domain_no_port = url_domain.split(':').next().unwrap_or(url_domain);

        // Domain match (exact or wildcard prefix)
        let domain_matches = if self.domain.starts_with("*.") {
            let suffix = &self.domain[2..];
            url_domain_no_port == suffix || url_domain_no_port.ends_with(&format!(".{}", suffix))
        } else {
            url_domain_no_port == self.domain
        };

        if !domain_matches {
            return false;
        }

        // Path match
        if let Some(ref pattern) = self.path_pattern {
            let url_path = if domain_end < after_scheme.len() {
                &after_scheme[domain_end..]
            } else {
                "/"
            };
            glob_match(pattern, url_path)
        } else {
            true // No path restriction = all paths allowed
        }
    }
}

/// Simple glob matching for path patterns (supports `*` and `**`).
fn glob_match(pattern: &str, text: &str) -> bool {
    if pattern == "*" || pattern == "/*" || pattern == "/**" {
        return true;
    }

    let pattern_parts: Vec<&str> = pattern.split('*').collect();
    if pattern_parts.len() == 1 {
        return text == pattern;
    }

    let mut pos = 0;
    for (i, part) in pattern_parts.iter().enumerate() {
        if part.is_empty() {
            continue;
        }
        if let Some(found) = text[pos..].find(part) {
            if i == 0 && found != 0 {
                return false; // Must match from start
            }
            pos += found + part.len();
        } else {
            return false;
        }
    }

    // If pattern ends with *, any trailing text is OK
    pattern.ends_with('*') || pos == text.len()
}

/// Domain allowlist — controls which endpoints tools can reach.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DomainAllowlist {
    entries: Vec<AllowlistEntry>,
}

impl Default for DomainAllowlist {
    fn default() -> Self {
        Self {
            entries: vec![
                // LLM providers
                AllowlistEntry::new("api.openai.com", Some("/v1/*"), "OpenAI", true),
                AllowlistEntry::new("api.anthropic.com", Some("/v1/*"), "Anthropic", true),
                AllowlistEntry::new("api.deepseek.com", Some("/*"), "DeepSeek", true),
                AllowlistEntry::new(
                    "generativelanguage.googleapis.com",
                    Some("/*"),
                    "Google Gemini",
                    true,
                ),
                AllowlistEntry::new("openrouter.ai", Some("/api/*"), "OpenRouter", true),
                AllowlistEntry::new("api.groq.com", Some("/openai/*"), "Groq", true),
                // Free search (no API key needed)
                AllowlistEntry::new(
                    "api.duckduckgo.com",
                    None,
                    "DuckDuckGo Search",
                    true,
                ),
                AllowlistEntry::new(
                    "html.duckduckgo.com",
                    None,
                    "DuckDuckGo HTML",
                    true,
                ),
                // sql.js WASM
                AllowlistEntry::new("sql.js.org", Some("/dist/*"), "sql.js WASM", true),
            ],
        }
    }
}

impl DomainAllowlist {
    pub fn new() -> Self {
        Self::default()
    }

    /// Check if a URL is allowed.
    pub fn is_allowed(&self, url: &str) -> bool {
        self.entries.iter().any(|entry| entry.matches(url))
    }

    /// Add a custom entry. Returns false if domain already exists.
    pub fn add(&mut self, entry: AllowlistEntry) -> bool {
        if self.entries.iter().any(|e| e.domain == entry.domain) {
            return false;
        }
        self.entries.push(entry);
        true
    }

    /// Remove an entry by domain (only non-builtin entries).
    pub fn remove(&mut self, domain: &str) -> bool {
        let before = self.entries.len();
        self.entries.retain(|e| e.builtin || e.domain != domain);
        self.entries.len() < before
    }

    /// List all entries.
    pub fn list(&self) -> &[AllowlistEntry] {
        &self.entries
    }

    /// Get entry count.
    pub fn len(&self) -> usize {
        self.entries.len()
    }

    pub fn is_empty(&self) -> bool {
        self.entries.is_empty()
    }
}

// ── WASM Bindings ────────────────────────────────────────────────

#[wasm_bindgen]
pub struct WasmAllowlist {
    inner: DomainAllowlist,
}

#[wasm_bindgen]
impl WasmAllowlist {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: DomainAllowlist::default(),
        }
    }

    /// Check if URL is in the allowlist.
    #[wasm_bindgen]
    pub fn is_allowed(&self, url: &str) -> bool {
        self.inner.is_allowed(url)
    }

    /// Add a custom domain. Returns JSON of the entry.
    #[wasm_bindgen]
    pub fn add_domain(&mut self, domain: &str, path_pattern: &str, label: &str) -> bool {
        let pattern = if path_pattern.is_empty() {
            None
        } else {
            Some(path_pattern)
        };
        self.inner
            .add(AllowlistEntry::new(domain, pattern, label, false))
    }

    /// Remove a custom domain.
    #[wasm_bindgen]
    pub fn remove_domain(&mut self, domain: &str) -> bool {
        self.inner.remove(domain)
    }

    /// List all entries as JSON.
    #[wasm_bindgen]
    pub fn list_json(&self) -> String {
        serde_json::to_string(self.inner.list()).unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_allows_openai() {
        let al = DomainAllowlist::default();
        assert!(al.is_allowed("https://api.openai.com/v1/chat/completions"));
    }

    #[test]
    fn default_allows_deepseek() {
        let al = DomainAllowlist::default();
        assert!(al.is_allowed("https://api.deepseek.com/v1/chat/completions"));
    }

    #[test]
    fn blocks_unknown_domain() {
        let al = DomainAllowlist::default();
        assert!(!al.is_allowed("https://evil.com/steal-data"));
    }

    #[test]
    fn custom_entry_works() {
        let mut al = DomainAllowlist::default();
        al.add(AllowlistEntry::new("my-mcp.example.com", None, "My MCP", false));
        assert!(al.is_allowed("https://my-mcp.example.com/tools/list"));
    }

    #[test]
    fn cannot_remove_builtin() {
        let mut al = DomainAllowlist::default();
        assert!(!al.remove("api.openai.com"));
    }

    #[test]
    fn wildcard_domain() {
        let mut al = DomainAllowlist::new();
        al.add(AllowlistEntry::new("*.googleapis.com", None, "Google APIs", false));
        assert!(al.is_allowed("https://storage.googleapis.com/bucket/file"));
    }
}
