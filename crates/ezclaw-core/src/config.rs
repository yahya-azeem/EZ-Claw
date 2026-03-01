//! Configuration module — adapted from ZeroClaw's `config/schema.rs`.
//!
//! Mirrors ZeroClaw's Config struct but scoped to browser-compatible features.
//! Excludes: daemon, systemd, channels (Telegram/Discord/etc.), hardware,
//! GPIO, serial, tunnel, gateway, service management, peripherals.
//! Keeps: provider, memory, identity, autonomy, agent, skills, secrets,
//! research, reliability, cost, browser (adapted), wasm.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

// ── Top-level Config ─────────────────────────────────────────────

/// Top-level EZ-Claw configuration, adapted from ZeroClaw's Config struct.
///
/// Resolution in browser: loaded from IndexedDB, not filesystem.
#[derive(Clone, Serialize, Deserialize)]
pub struct Config {
    /// API key for the selected provider.
    pub api_key: Option<String>,
    /// Base URL override for provider API.
    pub api_url: Option<String>,
    /// Default provider ID or alias (e.g. "deepseek", "openrouter", "ollama").
    pub default_provider: Option<String>,
    /// Default model routed through the selected provider.
    #[serde(alias = "model")]
    pub default_model: Option<String>,
    /// Default temperature (0.0–2.0). Default: 0.7.
    pub default_temperature: f64,

    /// Optional named provider profiles keyed by id.
    #[serde(default)]
    pub model_providers: HashMap<String, ModelProviderConfig>,

    /// Provider behavior overrides.
    #[serde(default)]
    pub provider: ProviderConfig,

    /// Agent orchestration settings.
    #[serde(default)]
    pub agent: AgentConfig,

    /// Memory backend configuration.
    #[serde(default)]
    pub memory: MemoryConfig,

    /// Autonomy and security policy configuration.
    #[serde(default)]
    pub autonomy: AutonomyConfig,

    /// Research phase configuration.
    #[serde(default)]
    pub research: ResearchPhaseConfig,

    /// Reliability settings: retries, fallback providers.
    #[serde(default)]
    pub reliability: ReliabilityConfig,

    /// Identity format configuration: OpenClaw or AIEOS.
    #[serde(default)]
    pub identity: IdentityConfig,

    /// Secrets encryption configuration.
    #[serde(default)]
    pub secrets: SecretsConfig,

    /// Skills configuration.
    #[serde(default)]
    pub skills: SkillsConfig,

    /// Cost tracking configuration.
    #[serde(default)]
    pub cost: CostConfig,

    /// Multimodal (image) handling configuration.
    #[serde(default)]
    pub multimodal: MultimodalConfig,

    /// Vision support override for the active provider/model.
    #[serde(default)]
    pub model_support_vision: Option<bool>,

    /// Delegate agent configurations for multi-agent workflows.
    #[serde(default)]
    pub agents: HashMap<String, DelegateAgentConfig>,

    /// Query classification for model routing.
    #[serde(default)]
    pub query_classification: QueryClassificationConfig,
}

// ── Sub-configs (adapted from ZeroClaw) ──────────────────────────

/// Named provider profile definition (from ZeroClaw).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ModelProviderConfig {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub base_url: Option<String>,
    #[serde(default)]
    pub wire_api: Option<String>,
}

/// Provider behavior overrides (from ZeroClaw `[provider]`).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProviderConfig {
    #[serde(default)]
    pub reasoning_level: Option<String>,
}

/// Agent orchestration configuration (from ZeroClaw `[agent]`).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentConfig {
    /// Use compact context for small models.
    #[serde(default)]
    pub compact_context: bool,
    /// Maximum tool-call loop turns per user message. Default: 20.
    #[serde(default = "default_agent_max_tool_iterations")]
    pub max_tool_iterations: usize,
    /// Maximum conversation history messages retained. Default: 50.
    #[serde(default = "default_agent_max_history_messages")]
    pub max_history_messages: usize,
    /// Enable parallel tool execution. Default: false.
    #[serde(default)]
    pub parallel_tools: bool,
    /// Tool dispatch strategy. Default: "auto".
    #[serde(default = "default_agent_tool_dispatcher")]
    pub tool_dispatcher: String,
}

fn default_agent_max_tool_iterations() -> usize { 20 }
fn default_agent_max_history_messages() -> usize { 50 }
fn default_agent_tool_dispatcher() -> String { "auto".into() }

impl Default for AgentConfig {
    fn default() -> Self {
        Self {
            compact_context: true,
            max_tool_iterations: default_agent_max_tool_iterations(),
            max_history_messages: default_agent_max_history_messages(),
            parallel_tools: false,
            tool_dispatcher: default_agent_tool_dispatcher(),
        }
    }
}

/// Memory backend configuration (from ZeroClaw `[memory]`).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryConfig {
    /// "sqlite" (via sql.js in browser), "none".
    #[serde(default = "default_memory_backend")]
    pub backend: String,
    #[serde(default = "default_true")]
    pub auto_save: bool,
    /// "none" for keyword-only, "openai" for embeddings.
    #[serde(default = "default_embedding_provider")]
    pub embedding_provider: String,
    #[serde(default = "default_vector_weight")]
    pub vector_weight: f64,
    #[serde(default = "default_keyword_weight")]
    pub keyword_weight: f64,
}

fn default_memory_backend() -> String { "sqlite".into() }
fn default_true() -> bool { true }
fn default_embedding_provider() -> String { "none".into() }
fn default_vector_weight() -> f64 { 0.7 }
fn default_keyword_weight() -> f64 { 0.3 }

impl Default for MemoryConfig {
    fn default() -> Self {
        Self {
            backend: default_memory_backend(),
            auto_save: true,
            embedding_provider: default_embedding_provider(),
            vector_weight: default_vector_weight(),
            keyword_weight: default_keyword_weight(),
        }
    }
}

/// Autonomy configuration (from ZeroClaw `[autonomy]`).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AutonomyConfig {
    /// "readonly", "supervised", "full".
    #[serde(default = "default_autonomy_level")]
    pub level: String,
    #[serde(default = "default_true")]
    pub workspace_only: bool,
    #[serde(default)]
    pub allowed_commands: Vec<String>,
    #[serde(default)]
    pub forbidden_paths: Vec<String>,
}

fn default_autonomy_level() -> String { "supervised".into() }

impl Default for AutonomyConfig {
    fn default() -> Self {
        Self {
            level: default_autonomy_level(),
            workspace_only: true,
            allowed_commands: vec![],
            forbidden_paths: vec![],
        }
    }
}

/// Research phase configuration (from ZeroClaw `[research]`).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ResearchPhaseConfig {
    #[serde(default)]
    pub enabled: bool,
}

/// Reliability settings (from ZeroClaw `[reliability]`).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ReliabilityConfig {
    #[serde(default = "default_max_retries")]
    pub max_retries: u32,
    #[serde(default)]
    pub fallback_provider: Option<String>,
    #[serde(default)]
    pub fallback_model: Option<String>,
}

fn default_max_retries() -> u32 { 2 }

impl Default for ReliabilityConfig {
    fn default() -> Self {
        Self {
            max_retries: default_max_retries(),
            fallback_provider: None,
            fallback_model: None,
        }
    }
}

/// Identity format configuration (from ZeroClaw `[identity]`).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IdentityConfig {
    /// "openclaw" (markdown) or "aieos" (JSON).
    #[serde(default = "default_identity_format")]
    pub format: String,
    /// Additional workspace files to include.
    #[serde(default)]
    pub extra_files: Vec<String>,
    /// Path to AIEOS JSON file.
    #[serde(default)]
    pub aieos_path: Option<String>,
    /// Inline AIEOS JSON.
    #[serde(default)]
    pub aieos_inline: Option<String>,
}

fn default_identity_format() -> String { "openclaw".into() }

impl Default for IdentityConfig {
    fn default() -> Self {
        Self {
            format: default_identity_format(),
            extra_files: vec![],
            aieos_path: None,
            aieos_inline: None,
        }
    }
}

/// Secrets encryption configuration (from ZeroClaw `[secrets]`).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SecretsConfig {
    #[serde(default)]
    pub encrypt: bool,
}

impl Default for SecretsConfig {
    fn default() -> Self {
        Self { encrypt: false }
    }
}

/// Skills configuration (from ZeroClaw `[skills]`).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SkillsConfig {
    #[serde(default)]
    pub open_skills_enabled: bool,
}

/// Cost tracking configuration (from ZeroClaw `[cost]`).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CostConfig {
    #[serde(default)]
    pub enabled: bool,
}

/// Multimodal handling configuration (from ZeroClaw `[multimodal]`).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MultimodalConfig {
    #[serde(default)]
    pub enabled: bool,
}

/// Query classification configuration (from ZeroClaw).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct QueryClassificationConfig {
    #[serde(default)]
    pub enabled: bool,
}

/// Delegate agent configuration (from ZeroClaw).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DelegateAgentConfig {
    pub provider: String,
    pub model: String,
    #[serde(default)]
    pub system_prompt: Option<String>,
    #[serde(default)]
    pub api_key: Option<String>,
    #[serde(default)]
    pub temperature: Option<f64>,
    #[serde(default = "default_max_depth")]
    pub max_depth: u32,
    #[serde(default)]
    pub agentic: bool,
    #[serde(default)]
    pub allowed_tools: Vec<String>,
    #[serde(default = "default_max_tool_iterations")]
    pub max_iterations: usize,
}

fn default_max_depth() -> u32 { 3 }
fn default_max_tool_iterations() -> usize { 10 }

// ── Config Default ───────────────────────────────────────────────

impl Default for Config {
    fn default() -> Self {
        Self {
            api_key: None,
            api_url: None,
            default_provider: Some("deepseek".into()),
            default_model: Some("deepseek-chat".into()),
            default_temperature: 0.7,
            model_providers: HashMap::new(),
            provider: ProviderConfig::default(),
            agent: AgentConfig::default(),
            memory: MemoryConfig::default(),
            autonomy: AutonomyConfig::default(),
            research: ResearchPhaseConfig::default(),
            reliability: ReliabilityConfig::default(),
            identity: IdentityConfig::default(),
            secrets: SecretsConfig::default(),
            skills: SkillsConfig::default(),
            cost: CostConfig::default(),
            multimodal: MultimodalConfig::default(),
            model_support_vision: None,
            agents: HashMap::new(),
            query_classification: QueryClassificationConfig::default(),
        }
    }
}

// ── wasm_bindgen exports ─────────────────────────────────────────

/// Wrapper for JS interop (wasm_bindgen doesn't support generics in structs).
#[wasm_bindgen]
pub struct WasmConfig {
    inner: Config,
}

#[wasm_bindgen]
impl WasmConfig {
    /// Create a default configuration (same defaults as ZeroClaw).
    #[wasm_bindgen(constructor)]
    pub fn new() -> WasmConfig {
        WasmConfig { inner: Config::default() }
    }

    /// Parse a TOML config string into a Config.
    #[wasm_bindgen]
    pub fn from_toml(toml_str: &str) -> Result<WasmConfig, JsValue> {
        let inner: Config = toml::from_str(toml_str)
            .map_err(|e| JsValue::from_str(&format!("TOML parse error: {e}")))?;
        Ok(WasmConfig { inner })
    }

    /// Serialize to TOML string.
    #[wasm_bindgen]
    pub fn to_toml(&self) -> Result<String, JsValue> {
        toml::to_string_pretty(&self.inner)
            .map_err(|e| JsValue::from_str(&format!("TOML serialize error: {e}")))
    }

    /// Serialize to JSON string (for JS interop).
    #[wasm_bindgen]
    pub fn to_json(&self) -> Result<String, JsValue> {
        serde_json::to_string(&self.inner)
            .map_err(|e| JsValue::from_str(&format!("JSON serialize error: {e}")))
    }

    /// Parse a JSON config string.
    #[wasm_bindgen]
    pub fn from_json(json_str: &str) -> Result<WasmConfig, JsValue> {
        let inner: Config = serde_json::from_str(json_str)
            .map_err(|e| JsValue::from_str(&format!("JSON parse error: {e}")))?;
        Ok(WasmConfig { inner })
    }

    // ── Getters/setters ──

    #[wasm_bindgen(getter)]
    pub fn api_key(&self) -> Option<String> { self.inner.api_key.clone() }
    #[wasm_bindgen(setter)]
    pub fn set_api_key(&mut self, val: Option<String>) { self.inner.api_key = val; }

    #[wasm_bindgen(getter)]
    pub fn default_provider(&self) -> Option<String> { self.inner.default_provider.clone() }
    #[wasm_bindgen(setter)]
    pub fn set_default_provider(&mut self, val: Option<String>) { self.inner.default_provider = val; }

    #[wasm_bindgen(getter)]
    pub fn default_model(&self) -> Option<String> { self.inner.default_model.clone() }
    #[wasm_bindgen(setter)]
    pub fn set_default_model(&mut self, val: Option<String>) { self.inner.default_model = val; }

    #[wasm_bindgen(getter)]
    pub fn default_temperature(&self) -> f64 { self.inner.default_temperature }
    #[wasm_bindgen(setter)]
    pub fn set_default_temperature(&mut self, val: f64) { self.inner.default_temperature = val; }

    #[wasm_bindgen(getter)]
    pub fn api_url(&self) -> Option<String> { self.inner.api_url.clone() }
    #[wasm_bindgen(setter)]
    pub fn set_api_url(&mut self, val: Option<String>) { self.inner.api_url = val; }

    #[wasm_bindgen(getter)]
    pub fn max_tool_iterations(&self) -> usize { self.inner.agent.max_tool_iterations }
    #[wasm_bindgen(setter)]
    pub fn set_max_tool_iterations(&mut self, val: usize) { self.inner.agent.max_tool_iterations = val; }

    #[wasm_bindgen(getter)]
    pub fn max_history_messages(&self) -> usize { self.inner.agent.max_history_messages }
    #[wasm_bindgen(setter)]
    pub fn set_max_history_messages(&mut self, val: usize) { self.inner.agent.max_history_messages = val; }

    #[wasm_bindgen(getter)]
    pub fn memory_backend(&self) -> String { self.inner.memory.backend.clone() }
    #[wasm_bindgen(setter)]
    pub fn set_memory_backend(&mut self, val: String) { self.inner.memory.backend = val; }

    #[wasm_bindgen(getter)]
    pub fn memory_auto_save(&self) -> bool { self.inner.memory.auto_save }
    #[wasm_bindgen(setter)]
    pub fn set_memory_auto_save(&mut self, val: bool) { self.inner.memory.auto_save = val; }

    #[wasm_bindgen(getter)]
    pub fn identity_format(&self) -> String { self.inner.identity.format.clone() }
    #[wasm_bindgen(setter)]
    pub fn set_identity_format(&mut self, val: String) { self.inner.identity.format = val; }

    #[wasm_bindgen(getter)]
    pub fn encrypt_secrets(&self) -> bool { self.inner.secrets.encrypt }
    #[wasm_bindgen(setter)]
    pub fn set_encrypt_secrets(&mut self, val: bool) { self.inner.secrets.encrypt = val; }
}

impl WasmConfig {
    /// Access the inner Config for other WASM modules.
    pub fn config(&self) -> &Config {
        &self.inner
    }

    pub fn config_mut(&mut self) -> &mut Config {
        &mut self.inner
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_config_has_deepseek() {
        let config = Config::default();
        assert_eq!(config.default_provider.as_deref(), Some("deepseek"));
        assert_eq!(config.default_model.as_deref(), Some("deepseek-chat"));
        assert_eq!(config.default_temperature, 0.7);
    }

    #[test]
    fn config_roundtrip_toml() {
        let config = Config::default();
        let toml_str = toml::to_string_pretty(&config).unwrap();
        let parsed: Config = toml::from_str(&toml_str).unwrap();
        assert_eq!(parsed.default_provider, config.default_provider);
    }

    #[test]
    fn config_roundtrip_json() {
        let config = Config::default();
        let json = serde_json::to_string(&config).unwrap();
        let parsed: Config = serde_json::from_str(&json).unwrap();
        assert_eq!(parsed.default_model, config.default_model);
    }
}
