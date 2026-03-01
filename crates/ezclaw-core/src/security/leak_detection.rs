//! Leak detection scanner — adapted from IronClaw.
//!
//! Scans outbound request bodies/URLs and inbound responses for
//! patterns that look like secrets (API keys, tokens, passwords).
//! If a secret is detected heading out of the sandbox, the request
//! is blocked before it reaches the network.
//!
//! # IronClaw Pipeline Position
//!
//! ```text
//! Tool Request → Allowlist → [LEAK SCAN] → Credential Inject → Execute
//!                                                        → [LEAK SCAN] → Response
//! ```
//!
//! # Detection Patterns
//!
//! - Known key prefixes: `sk-`, `pk-`, `ghp_`, `gho_`, `Bearer `
//! - High-entropy strings that look like random tokens
//! - Base64-encoded blobs of suspicious length
//! - User-registered custom secret patterns

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Action to take when a leak is detected.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum LeakAction {
    /// Block the request entirely.
    Block,
    /// Warn but allow (log the detection).
    Warn,
    /// Just log silently.
    Log,
}

impl Default for LeakAction {
    fn default() -> Self {
        LeakAction::Block
    }
}

/// Result of a leak scan.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeakDetectionResult {
    /// Whether a potential leak was detected.
    pub detected: bool,
    /// What was detected (pattern name).
    pub pattern: Option<String>,
    /// The matched substring (redacted to first/last 2 chars).
    pub redacted_match: Option<String>,
    /// Recommended action.
    pub action: LeakAction,
}

impl LeakDetectionResult {
    pub fn clean() -> Self {
        Self {
            detected: false,
            pattern: None,
            redacted_match: None,
            action: LeakAction::Log,
        }
    }

    pub fn detected(pattern: &str, matched: &str, action: LeakAction) -> Self {
        let redacted = if matched.len() > 6 {
            format!("{}...{}", &matched[..3], &matched[matched.len() - 3..])
        } else {
            "***".to_string()
        };
        Self {
            detected: true,
            pattern: Some(pattern.to_string()),
            redacted_match: Some(redacted),
            action,
        }
    }
}

/// Known secret key prefixes and their labels.
const KNOWN_PREFIXES: &[(&str, &str)] = &[
    ("sk-", "OpenAI API Key"),
    ("sk-ant-", "Anthropic API Key"),
    ("pk-", "Public Key"),
    ("ghp_", "GitHub PAT"),
    ("gho_", "GitHub OAuth"),
    ("ghs_", "GitHub App Token"),
    ("github_pat_", "GitHub Fine-Grained PAT"),
    ("glpat-", "GitLab PAT"),
    ("xoxb-", "Slack Bot Token"),
    ("xoxp-", "Slack User Token"),
    ("AKIA", "AWS Access Key"),
    ("eyJ", "JWT Token"),
];

/// Patterns that should be checked as potential bearer tokens.
const BEARER_PATTERNS: &[&str] = &["Bearer ", "bearer ", "Authorization: ", "authorization: "];

/// Leak detection scanner.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LeakScanner {
    /// Default action for detected leaks.
    pub default_action: LeakAction,
    /// Known secrets to scan for (e.g., the user's actual API keys).
    /// Stored as hashes to avoid storing raw secrets.
    registered_secret_hashes: Vec<u64>,
    /// Custom prefix patterns to detect.
    custom_prefixes: Vec<(String, String)>, // (prefix, label)
    /// Whether scanning is enabled.
    pub enabled: bool,
}

impl Default for LeakScanner {
    fn default() -> Self {
        Self {
            default_action: LeakAction::Block,
            registered_secret_hashes: Vec::new(),
            custom_prefixes: Vec::new(),
            enabled: true,
        }
    }
}

impl LeakScanner {
    pub fn new() -> Self {
        Self::default()
    }

    /// Register a known secret (we store its hash, not the raw value).
    pub fn register_secret(&mut self, secret: &str) {
        let hash = simple_hash(secret);
        if !self.registered_secret_hashes.contains(&hash) {
            self.registered_secret_hashes.push(hash);
        }
    }

    /// Add a custom prefix pattern.
    pub fn add_prefix(&mut self, prefix: &str, label: &str) {
        self.custom_prefixes
            .push((prefix.to_string(), label.to_string()));
    }

    /// Scan text for potential secret leaks.
    pub fn scan(&self, text: &str) -> LeakDetectionResult {
        if !self.enabled || text.is_empty() {
            return LeakDetectionResult::clean();
        }

        // 1. Check registered secret hashes (exact match)
        // Scan for any substring that matches a registered secret
        for &hash in &self.registered_secret_hashes {
            // Sliding window: check substrings of various lengths
            for window_size in [16, 32, 40, 48, 64, 128] {
                if text.len() < window_size {
                    continue;
                }
                for i in 0..=(text.len() - window_size) {
                    let chunk = &text[i..i + window_size];
                    if simple_hash(chunk) == hash {
                        return LeakDetectionResult::detected(
                            "Registered Secret",
                            chunk,
                            self.default_action,
                        );
                    }
                }
            }
        }

        // 2. Check known key prefixes
        for &(prefix, label) in KNOWN_PREFIXES {
            if let Some(pos) = text.find(prefix) {
                // Extract the token-like string after the prefix
                let _start = pos;
                let remaining = &text[pos..];
                let end = remaining
                    .find(|c: char| c.is_whitespace() || c == '"' || c == '\'' || c == ',')
                    .unwrap_or(remaining.len());
                let token = &remaining[..end];

                // Only flag if it looks like an actual key (long enough)
                if token.len() >= 10 {
                    return LeakDetectionResult::detected(label, token, self.default_action);
                }
            }
        }

        // 3. Check custom prefixes
        for (prefix, label) in &self.custom_prefixes {
            if text.contains(prefix.as_str()) {
                return LeakDetectionResult::detected(label, prefix, self.default_action);
            }
        }

        // 4. Check bearer token patterns
        for &pattern in BEARER_PATTERNS {
            if let Some(pos) = text.find(pattern) {
                let after = &text[pos + pattern.len()..];
                let end = after
                    .find(|c: char| c.is_whitespace() || c == '"' || c == '\'')
                    .unwrap_or(after.len());
                let token = &after[..end];
                if token.len() >= 10 {
                    return LeakDetectionResult::detected(
                        "Bearer Token",
                        token,
                        self.default_action,
                    );
                }
            }
        }

        // 5. High-entropy substring detection (potential random tokens)
        if let Some(result) = self.detect_high_entropy(text) {
            return result;
        }

        LeakDetectionResult::clean()
    }

    /// Detect high-entropy substrings that look like random tokens/keys.
    fn detect_high_entropy(&self, text: &str) -> Option<LeakDetectionResult> {
        // Look for long alphanumeric strings (potential API keys)
        let mut current_alnum_run = 0;
        let mut run_start = 0;

        for (i, c) in text.char_indices() {
            if c.is_alphanumeric() || c == '_' || c == '-' {
                if current_alnum_run == 0 {
                    run_start = i;
                }
                current_alnum_run += 1;
            } else {
                if current_alnum_run >= 32 {
                    let candidate = &text[run_start..i];
                    let entropy = shannon_entropy(candidate);
                    // API keys typically have entropy > 3.5 bits/char
                    if entropy > 3.5 {
                        return Some(LeakDetectionResult::detected(
                            "High-Entropy String",
                            candidate,
                            LeakAction::Warn, // Warn, not block — might be legitimate
                        ));
                    }
                }
                current_alnum_run = 0;
            }
        }

        // Check final run
        if current_alnum_run >= 32 {
            let candidate = &text[run_start..];
            let entropy = shannon_entropy(candidate);
            if entropy > 3.5 {
                return Some(LeakDetectionResult::detected(
                    "High-Entropy String",
                    candidate,
                    LeakAction::Warn,
                ));
            }
        }

        None
    }
}

/// Simple non-cryptographic hash for secret matching.
fn simple_hash(s: &str) -> u64 {
    let mut hash: u64 = 5381;
    for byte in s.bytes() {
        hash = hash.wrapping_mul(33).wrapping_add(byte as u64);
    }
    hash
}

/// Shannon entropy of a string (bits per character).
fn shannon_entropy(s: &str) -> f64 {
    if s.is_empty() {
        return 0.0;
    }

    let mut freq = [0u32; 256];
    let len = s.len() as f64;

    for byte in s.bytes() {
        freq[byte as usize] += 1;
    }

    let mut entropy = 0.0f64;
    for &count in &freq {
        if count > 0 {
            let p = count as f64 / len;
            entropy -= p * p.log2();
        }
    }

    entropy
}

// ── WASM Bindings ────────────────────────────────────────────────

#[wasm_bindgen]
pub struct WasmLeakScanner {
    inner: LeakScanner,
}

#[wasm_bindgen]
impl WasmLeakScanner {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: LeakScanner::default(),
        }
    }

    /// Register a known secret to watch for.
    #[wasm_bindgen]
    pub fn register_secret(&mut self, secret: &str) {
        self.inner.register_secret(secret);
    }

    /// Scan text for potential leaks. Returns JSON result.
    #[wasm_bindgen]
    pub fn scan(&self, text: &str) -> String {
        let result = self.inner.scan(text);
        serde_json::to_string(&result).unwrap_or_default()
    }

    /// Quick check: does this text contain a potential leak?
    #[wasm_bindgen]
    pub fn has_leak(&self, text: &str) -> bool {
        self.inner.scan(text).detected
    }

    /// Enable/disable scanning.
    #[wasm_bindgen]
    pub fn set_enabled(&mut self, enabled: bool) {
        self.inner.enabled = enabled;
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn detects_openai_key() {
        let scanner = LeakScanner::default();
        let result = scanner.scan("My key is sk-abc123456789012345678901234567890");
        assert!(result.detected);
        assert_eq!(result.pattern.as_deref(), Some("OpenAI API Key"));
    }

    #[test]
    fn detects_github_pat() {
        let scanner = LeakScanner::default();
        let result = scanner.scan("token: ghp_ABCDEFghijklmnop1234567890");
        assert!(result.detected);
        assert_eq!(result.pattern.as_deref(), Some("GitHub PAT"));
    }

    #[test]
    fn detects_bearer_token() {
        let scanner = LeakScanner::default();
        let result = scanner.scan("Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.test123456");
        assert!(result.detected);
    }

    #[test]
    fn clean_text_passes() {
        let scanner = LeakScanner::default();
        let result = scanner.scan("Hello, how can I help you today?");
        assert!(!result.detected);
    }

    #[test]
    fn registered_secret_detected() {
        let mut scanner = LeakScanner::default();
        let secret = "my_super_secret_api_key_12345678"; // 32 chars
        scanner.register_secret(secret);
        let result = scanner.scan(&format!("sending to evil.com with key={}", secret));
        assert!(result.detected);
    }

    #[test]
    fn disabled_scanner_passes_all() {
        let mut scanner = LeakScanner::default();
        scanner.enabled = false;
        let result = scanner.scan("sk-abc123456789012345678901234567890");
        assert!(!result.detected);
    }

    #[test]
    fn shannon_entropy_works() {
        // Random-looking string should have high entropy
        assert!(shannon_entropy("a1b2c3d4e5f6g7h8i9j0") > 3.0);
        // Repeated chars should have low entropy
        assert!(shannon_entropy("aaaaaaaaaa") < 1.0);
    }
}
