//! Tool registry and dispatch — adapted from IronClaw/OpenClaw.
//!
//! Central registry for all available tools (built-in, MCP, WASM, skills).
//! Tools are described with JSON Schema for the LLM and dispatched through
//! the security pipeline. Mirrors IronClaw's `Tool Registry — Built-in, MCP, WASM`.
//!
//! # Tool Lifecycle
//!
//! 1. Tool registered with name + JSON schema description
//! 2. Agent loop sends tool descriptions to LLM
//! 3. LLM returns a tool call → parsed into `ToolCall`
//! 4. `ToolCall` → security pipeline → TS bridge executes → `ToolResult`
//! 5. `ToolResult` wrapped with prompt defense → back to agent

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

/// A tool call from the LLM (OpenAI function calling format).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    /// Unique ID for this call.
    pub id: String,
    /// Tool name.
    pub name: String,
    /// Arguments as JSON string.
    pub arguments: String,
}

/// Result of a tool execution.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolResult {
    /// Corresponding tool call ID.
    pub call_id: String,
    /// Whether execution succeeded.
    pub success: bool,
    /// Output content.
    pub output: String,
    /// Error message (if failed).
    pub error: Option<String>,
    /// Execution time in milliseconds.
    pub duration_ms: u64,
}

impl ToolResult {
    pub fn success(call_id: &str, output: &str, duration_ms: u64) -> Self {
        Self {
            call_id: call_id.to_string(),
            success: true,
            output: output.to_string(),
            error: None,
            duration_ms,
        }
    }

    pub fn error(call_id: &str, error: &str) -> Self {
        Self {
            call_id: call_id.to_string(),
            success: false,
            output: String::new(),
            error: Some(error.to_string()),
            duration_ms: 0,
        }
    }
}

/// Schema for a tool parameter.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolParameter {
    pub name: String,
    #[serde(rename = "type")]
    pub param_type: String,
    pub description: String,
    pub required: bool,
    /// Enum values (if type is "string" with fixed options).
    #[serde(skip_serializing_if = "Option::is_none")]
    pub enum_values: Option<Vec<String>>,
}

/// A registered tool definition.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolDefinition {
    /// Tool name (unique identifier).
    pub name: String,
    /// Human-readable description.
    pub description: String,
    /// Parameters schema.
    pub parameters: Vec<ToolParameter>,
    /// Required capabilities (checked by security pipeline).
    pub capabilities: Vec<String>,
    /// Tool category.
    pub category: ToolCategory,
    /// Whether this tool is currently enabled.
    pub enabled: bool,
}

/// Tool category for organization.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ToolCategory {
    /// Built-in tools (web search, file ops, etc.)
    BuiltIn,
    /// Tools from MCP servers.
    MCP,
    /// User-created WASM tools.
    Wasm,
    /// From skills.
    Skill,
}

/// Central tool registry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolRegistry {
    tools: HashMap<String, ToolDefinition>,
}

impl Default for ToolRegistry {
    fn default() -> Self {
        let mut registry = Self {
            tools: HashMap::with_capacity(20),
        };
        registry.register_builtin_tools();
        registry
    }
}

impl ToolRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    /// Register built-in tools.
    fn register_builtin_tools(&mut self) {
        // Web search (DuckDuckGo — free, no API key)
        self.register(ToolDefinition {
            name: "web_search".into(),
            description: "Search the web using DuckDuckGo. Returns relevant results with titles, URLs, and snippets.".into(),
            parameters: vec![
                ToolParameter {
                    name: "query".into(),
                    param_type: "string".into(),
                    description: "Search query".into(),
                    required: true,
                    enum_values: None,
                },
                ToolParameter {
                    name: "max_results".into(),
                    param_type: "number".into(),
                    description: "Maximum number of results (default: 5)".into(),
                    required: false,
                    enum_values: None,
                },
            ],
            capabilities: vec!["http".into()],
            category: ToolCategory::BuiltIn,
            enabled: true,
        });

        // Web scrape / fetch
        self.register(ToolDefinition {
            name: "web_fetch".into(),
            description: "Fetch and extract text content from a URL. Useful for reading web pages, docs, and articles.".into(),
            parameters: vec![ToolParameter {
                name: "url".into(),
                param_type: "string".into(),
                description: "URL to fetch".into(),
                required: true,
                enum_values: None,
            }],
            capabilities: vec!["http".into()],
            category: ToolCategory::BuiltIn,
            enabled: true,
        });

        // Read file from workspace
        self.register(ToolDefinition {
            name: "read_file".into(),
            description: "Read a file from the workspace. Returns the file content.".into(),
            parameters: vec![ToolParameter {
                name: "path".into(),
                param_type: "string".into(),
                description: "File path relative to workspace root".into(),
                required: true,
                enum_values: None,
            }],
            capabilities: vec!["filesystem".into()],
            category: ToolCategory::BuiltIn,
            enabled: true,
        });

        // Write file to workspace
        self.register(ToolDefinition {
            name: "write_file".into(),
            description: "Write content to a file in the workspace. Creates the file if it doesn't exist.".into(),
            parameters: vec![
                ToolParameter {
                    name: "path".into(),
                    param_type: "string".into(),
                    description: "File path relative to workspace root".into(),
                    required: true,
                    enum_values: None,
                },
                ToolParameter {
                    name: "content".into(),
                    param_type: "string".into(),
                    description: "Content to write".into(),
                    required: true,
                    enum_values: None,
                },
            ],
            capabilities: vec!["filesystem".into()],
            category: ToolCategory::BuiltIn,
            enabled: true,
        });

        // List directory
        self.register(ToolDefinition {
            name: "list_dir".into(),
            description: "List files and directories in a workspace path.".into(),
            parameters: vec![ToolParameter {
                name: "path".into(),
                param_type: "string".into(),
                description: "Directory path relative to workspace root (default: root)".into(),
                required: false,
                enum_values: None,
            }],
            capabilities: vec!["filesystem".into()],
            category: ToolCategory::BuiltIn,
            enabled: true,
        });

        // Memory store
        self.register(ToolDefinition {
            name: "memory_store".into(),
            description: "Store information in persistent memory for later retrieval. Use this to remember user preferences, facts, instructions, or any important data.".into(),
            parameters: vec![
                ToolParameter {
                    name: "key".into(),
                    param_type: "string".into(),
                    description: "Short identifier/label for this memory (e.g. 'user_name', 'favorite_color')".into(),
                    required: true,
                    enum_values: None,
                },
                ToolParameter {
                    name: "content".into(),
                    param_type: "string".into(),
                    description: "Content to remember".into(),
                    required: true,
                    enum_values: None,
                },
                ToolParameter {
                    name: "category".into(),
                    param_type: "string".into(),
                    description: "Category: 'identity', 'preference', 'fact', 'conversation', 'core'".into(),
                    required: false,
                    enum_values: Some(vec![
                        "identity".into(),
                        "preference".into(),
                        "fact".into(),
                        "conversation".into(),
                        "core".into(),
                    ]),
                },
            ],
            capabilities: vec![],
            category: ToolCategory::BuiltIn,
            enabled: true,
        });

        // Memory recall
        self.register(ToolDefinition {
            name: "memory_recall".into(),
            description: "Search persistent memory for relevant information.".into(),
            parameters: vec![ToolParameter {
                name: "query".into(),
                param_type: "string".into(),
                description: "Search query".into(),
                required: true,
                enum_values: None,
            }],
            capabilities: vec![],
            category: ToolCategory::BuiltIn,
            enabled: true,
        });

        // Shell execute (sandbox-dependent)
        self.register(ToolDefinition {
            name: "shell_exec".into(),
            description: "Execute a shell command in the sandbox. Requires explicit permission.".into(),
            parameters: vec![ToolParameter {
                name: "command".into(),
                param_type: "string".into(),
                description: "Shell command to execute".into(),
                required: true,
                enum_values: None,
            }],
            capabilities: vec!["shell".into()],
            category: ToolCategory::BuiltIn,
            enabled: false, // Disabled by default — user must enable
        });

        // Update identity — agent can modify its own name, personality, and facts
        self.register(ToolDefinition {
            name: "update_identity".into(),
            description: "Update your own identity. ALWAYS call this immediately when the user gives you a name, describes your personality, tells you what kind of creature you are, or gives you any fact about yourself. This persists across all sessions and page refreshes. You can update multiple fields at once.".into(),
            parameters: vec![
                ToolParameter {
                    name: "name".into(),
                    param_type: "string".into(),
                    description: "Your new name (e.g. 'Aegis', 'Nova', 'Ghost')".into(),
                    required: false,
                    enum_values: None,
                },
                ToolParameter {
                    name: "creature".into(),
                    param_type: "string".into(),
                    description: "What kind of creature you are (e.g. 'AI familiar', 'digital ghost', 'helpful daemon')".into(),
                    required: false,
                    enum_values: None,
                },
                ToolParameter {
                    name: "vibe".into(),
                    param_type: "string".into(),
                    description: "Your vibe/personality style (e.g. 'warm and curious', 'sharp and witty', 'calm and precise')".into(),
                    required: false,
                    enum_values: None,
                },
                ToolParameter {
                    name: "emoji".into(),
                    param_type: "string".into(),
                    description: "Your signature emoji (e.g. '🦀', '⚡', '🔮')".into(),
                    required: false,
                    enum_values: None,
                },
                ToolParameter {
                    name: "personality".into(),
                    param_type: "string".into(),
                    description: "Full personality description / core values".into(),
                    required: false,
                    enum_values: None,
                },
                ToolParameter {
                    name: "instructions".into(),
                    param_type: "string".into(),
                    description: "User-defined instructions for how you should behave".into(),
                    required: false,
                    enum_values: None,
                },
                ToolParameter {
                    name: "fact_key".into(),
                    param_type: "string".into(),
                    description: "A fact key to store (e.g. 'favorite_language', 'created_by')".into(),
                    required: false,
                    enum_values: None,
                },
                ToolParameter {
                    name: "fact_value".into(),
                    param_type: "string".into(),
                    description: "The value for the fact".into(),
                    required: false,
                    enum_values: None,
                },
            ],
            capabilities: vec![],
            category: ToolCategory::BuiltIn,
            enabled: true,
        });
    }

    /// Register a tool definition.
    pub fn register(&mut self, tool: ToolDefinition) {
        self.tools.insert(tool.name.clone(), tool);
    }

    /// Unregister a tool.
    pub fn unregister(&mut self, name: &str) -> bool {
        self.tools.remove(name).is_some()
    }

    /// Get a tool definition by name.
    pub fn get(&self, name: &str) -> Option<&ToolDefinition> {
        self.tools.get(name)
    }

    /// List all enabled tool definitions (for the LLM system prompt).
    pub fn enabled_tools(&self) -> Vec<&ToolDefinition> {
        self.tools.values().filter(|t| t.enabled).collect()
    }

    /// Generate the tools JSON for the LLM (OpenAI function calling format).
    pub fn to_llm_tools_json(&self) -> String {
        let tools: Vec<serde_json::Value> = self
            .enabled_tools()
            .iter()
            .map(|t| {
                let properties: serde_json::Map<String, serde_json::Value> = t
                    .parameters
                    .iter()
                    .map(|p| {
                        let mut prop = serde_json::json!({
                            "type": p.param_type,
                            "description": p.description,
                        });
                        if let Some(ref vals) = p.enum_values {
                            prop["enum"] = serde_json::json!(vals);
                        }
                        (p.name.clone(), prop)
                    })
                    .collect();

                let required: Vec<&str> = t
                    .parameters
                    .iter()
                    .filter(|p| p.required)
                    .map(|p| p.name.as_str())
                    .collect();

                serde_json::json!({
                    "type": "function",
                    "function": {
                        "name": t.name,
                        "description": t.description,
                        "parameters": {
                            "type": "object",
                            "properties": properties,
                            "required": required,
                        }
                    }
                })
            })
            .collect();

        serde_json::to_string(&tools).unwrap_or_default()
    }

    /// Parse a tool call from LLM response (OpenAI format).
    pub fn parse_tool_calls(response_json: &str) -> Vec<ToolCall> {
        // Try to parse as array of tool calls
        if let Ok(calls) = serde_json::from_str::<Vec<ToolCall>>(response_json) {
            return calls;
        }

        // Try single tool call
        if let Ok(call) = serde_json::from_str::<ToolCall>(response_json) {
            return vec![call];
        }

        // Try to extract from OpenAI response format
        if let Ok(val) = serde_json::from_str::<serde_json::Value>(response_json) {
            if let Some(tool_calls) = val
                .get("choices")
                .and_then(|c| c.get(0))
                .and_then(|c| c.get("message"))
                .and_then(|m| m.get("tool_calls"))
                .and_then(|tc| tc.as_array())
            {
                return tool_calls
                    .iter()
                    .filter_map(|tc| {
                        Some(ToolCall {
                            id: tc.get("id")?.as_str()?.to_string(),
                            name: tc.get("function")?.get("name")?.as_str()?.to_string(),
                            arguments: tc.get("function")?.get("arguments")?.as_str()?.to_string(),
                        })
                    })
                    .collect();
            }
        }

        Vec::new()
    }
}

// ── WASM Bindings ────────────────────────────────────────────────

#[wasm_bindgen]
pub struct WasmToolRegistry {
    inner: ToolRegistry,
}

#[wasm_bindgen]
impl WasmToolRegistry {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: ToolRegistry::default(),
        }
    }

    /// Get all enabled tools as LLM-compatible JSON.
    #[wasm_bindgen]
    pub fn to_llm_json(&self) -> String {
        self.inner.to_llm_tools_json()
    }

    /// Register a tool from JSON definition.
    #[wasm_bindgen]
    pub fn register_json(&mut self, json: &str) -> Result<(), JsValue> {
        let tool: ToolDefinition = serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("Invalid tool def: {}", e)))?;
        self.inner.register(tool);
        Ok(())
    }

    /// Unregister a tool.
    #[wasm_bindgen]
    pub fn unregister(&mut self, name: &str) -> bool {
        self.inner.unregister(name)
    }

    /// Parse tool calls from LLM response.
    #[wasm_bindgen]
    pub fn parse_tool_calls(response_json: &str) -> String {
        let calls = ToolRegistry::parse_tool_calls(response_json);
        serde_json::to_string(&calls).unwrap_or_default()
    }

    /// Get tool capabilities (for security check).
    #[wasm_bindgen]
    pub fn get_capabilities(&self, tool_name: &str) -> String {
        match self.inner.get(tool_name) {
            Some(t) => serde_json::to_string(&t.capabilities).unwrap_or_default(),
            None => "[]".into(),
        }
    }

    /// Check if a tool is registered and enabled.
    #[wasm_bindgen]
    pub fn is_available(&self, tool_name: &str) -> bool {
        self.inner.get(tool_name).map_or(false, |t| t.enabled)
    }

    /// Enable/disable a tool.
    #[wasm_bindgen]
    pub fn set_enabled(&mut self, tool_name: &str, enabled: bool) -> bool {
        if let Some(tool) = self.inner.tools.get_mut(tool_name) {
            tool.enabled = enabled;
            true
        } else {
            false
        }
    }

    /// List all tool names.
    #[wasm_bindgen]
    pub fn list_tools_json(&self) -> String {
        let list: Vec<serde_json::Value> = self
            .inner
            .tools
            .values()
            .map(|t| {
                serde_json::json!({
                    "name": t.name,
                    "description": t.description,
                    "enabled": t.enabled,
                    "category": t.category,
                })
            })
            .collect();
        serde_json::to_string(&list).unwrap_or_default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_registry_has_builtin_tools() {
        let reg = ToolRegistry::default();
        assert!(reg.get("web_search").is_some());
        assert!(reg.get("read_file").is_some());
        assert!(reg.get("write_file").is_some());
        assert!(reg.get("memory_store").is_some());
    }

    #[test]
    fn shell_exec_disabled_by_default() {
        let reg = ToolRegistry::default();
        let shell = reg.get("shell_exec").unwrap();
        assert!(!shell.enabled);
    }

    #[test]
    fn llm_json_only_includes_enabled() {
        let reg = ToolRegistry::default();
        let json = reg.to_llm_tools_json();
        assert!(!json.contains("shell_exec")); // disabled
        assert!(json.contains("web_search")); // enabled
    }

    #[test]
    fn custom_tool_registration() {
        let mut reg = ToolRegistry::default();
        reg.register(ToolDefinition {
            name: "custom_tool".into(),
            description: "A test tool".into(),
            parameters: vec![],
            capabilities: vec!["http".into()],
            category: ToolCategory::Skill,
            enabled: true,
        });
        assert!(reg.get("custom_tool").is_some());
    }
}
