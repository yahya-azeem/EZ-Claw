//! Dynamic Tools — agent self-expanding tool building.
//!
//! Adapted from IronClaw's "Self-Expanding" feature.
//! The agent can define new tools at runtime by specifying:
//! - Tool name and description
//! - JSON schema for parameters
//! - Execution strategy (HTTP call, workspace script, composed tools)
//!
//! Dynamic tools run in the same security pipeline as built-in tools,
//! with trust level defaulting to Untrusted.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Execution strategy for a dynamic tool.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", rename_all = "snake_case")]
pub enum ExecutionStrategy {
    /// Make an HTTP request.
    HttpRequest {
        url_template: String,
        method: String,
        headers: Vec<(String, String)>,
        body_template: Option<String>,
    },
    /// Execute a sequence of existing tools.
    Composed {
        steps: Vec<ComposedStep>,
    },
    /// Run a script stored in the workspace.
    WorkspaceScript {
        path: String,
        interpreter: String, // "python", "node", "bash"
    },
}

/// A step in a composed tool.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ComposedStep {
    pub tool_name: String,
    pub arguments_template: String,
    /// Variable name to store the result in.
    pub output_var: Option<String>,
}

/// A dynamically-defined tool.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DynamicTool {
    pub name: String,
    pub description: String,
    /// JSON Schema for parameters (OpenAI function calling format).
    pub parameters_schema: serde_json::Value,
    /// How to execute this tool.
    pub strategy: ExecutionStrategy,
    /// Who created it.
    pub author: String, // "agent" or "user"
    /// When it was created.
    pub created_at: String,
    /// Whether this tool is enabled.
    pub enabled: bool,
}

/// Registry of dynamic tools.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct DynamicToolRegistry {
    tools: Vec<DynamicTool>,
}

impl DynamicToolRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    /// Register a new dynamic tool.
    pub fn register(&mut self, tool: DynamicTool) -> Result<(), String> {
        // Validate name
        if tool.name.is_empty() {
            return Err("Tool name cannot be empty".into());
        }

        // Check for reserved names
        let reserved = [
            "web_search", "web_fetch", "read_file", "write_file",
            "list_dir", "memory_store", "memory_recall", "shell_exec",
        ];
        if reserved.contains(&tool.name.as_str()) {
            return Err(format!("'{}' is a reserved tool name", tool.name));
        }

        // Replace existing
        self.tools.retain(|t| t.name != tool.name);
        self.tools.push(tool);
        Ok(())
    }

    /// Remove a dynamic tool.
    pub fn unregister(&mut self, name: &str) -> bool {
        let before = self.tools.len();
        self.tools.retain(|t| t.name != name);
        self.tools.len() < before
    }

    /// Get a tool by name.
    pub fn get(&self, name: &str) -> Option<&DynamicTool> {
        self.tools.iter().find(|t| t.name == name)
    }

    /// Get all enabled tools.
    pub fn enabled_tools(&self) -> Vec<&DynamicTool> {
        self.tools.iter().filter(|t| t.enabled).collect()
    }

    /// Generate JSON schemas for all enabled tools (for LLM function calling).
    pub fn generate_schemas(&self) -> Vec<serde_json::Value> {
        self.enabled_tools()
            .iter()
            .map(|tool| {
                serde_json::json!({
                    "type": "function",
                    "function": {
                        "name": tool.name,
                        "description": tool.description,
                        "parameters": tool.parameters_schema,
                    }
                })
            })
            .collect()
    }

    /// Process an HTTP template, replacing {{var}} with values.
    pub fn render_template(template: &str, args: &serde_json::Value) -> String {
        let mut result = template.to_string();
        if let Some(obj) = args.as_object() {
            for (key, value) in obj {
                let placeholder = format!("{{{{{}}}}}", key);
                let replacement = match value {
                    serde_json::Value::String(s) => s.clone(),
                    other => other.to_string(),
                };
                result = result.replace(&placeholder, &replacement);
            }
        }
        result
    }

    /// Export registry as JSON.
    pub fn export(&self) -> String {
        serde_json::to_string(&self.tools).unwrap_or_default()
    }

    /// Import from JSON.
    pub fn import(&mut self, json: &str) -> Result<usize, String> {
        let tools: Vec<DynamicTool> = serde_json::from_str(json)
            .map_err(|e| format!("Invalid tools JSON: {}", e))?;
        let count = tools.len();
        self.tools = tools;
        Ok(count)
    }
}

// ── WASM Bindings ────────────────────────────────────────────────

#[wasm_bindgen]
pub struct WasmDynamicToolRegistry {
    inner: DynamicToolRegistry,
}

#[wasm_bindgen]
impl WasmDynamicToolRegistry {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: DynamicToolRegistry::new(),
        }
    }

    /// Register a dynamic tool from JSON definition.
    #[wasm_bindgen]
    pub fn register(&mut self, json: &str) -> Result<(), JsValue> {
        let tool: DynamicTool = serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("Invalid tool: {}", e)))?;
        self.inner
            .register(tool)
            .map_err(|e| JsValue::from_str(&e))
    }

    /// Remove a dynamic tool.
    #[wasm_bindgen]
    pub fn unregister(&mut self, name: &str) -> bool {
        self.inner.unregister(name)
    }

    /// Get all tool schemas as JSON (for LLM function calling).
    #[wasm_bindgen]
    pub fn schemas_json(&self) -> String {
        serde_json::to_string(&self.inner.generate_schemas()).unwrap_or_default()
    }

    /// List all dynamic tools as JSON.
    #[wasm_bindgen]
    pub fn list_tools(&self) -> String {
        self.inner.export()
    }

    /// Get tool count.
    #[wasm_bindgen]
    pub fn count(&self) -> usize {
        self.inner.tools.len()
    }

    /// Export for persistence.
    #[wasm_bindgen]
    pub fn export(&self) -> String {
        self.inner.export()
    }

    /// Import from persistence.
    #[wasm_bindgen]
    pub fn import(&mut self, json: &str) -> Result<usize, JsValue> {
        self.inner
            .import(json)
            .map_err(|e| JsValue::from_str(&e))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn register_and_get() {
        let mut registry = DynamicToolRegistry::new();
        let tool = DynamicTool {
            name: "weather".into(),
            description: "Get weather".into(),
            parameters_schema: serde_json::json!({
                "type": "object",
                "properties": {
                    "city": { "type": "string" }
                },
                "required": ["city"]
            }),
            strategy: ExecutionStrategy::HttpRequest {
                url_template: "https://api.weather.com/{{city}}".into(),
                method: "GET".into(),
                headers: vec![],
                body_template: None,
            },
            author: "user".into(),
            created_at: "2026-01-01".into(),
            enabled: true,
        };
        registry.register(tool).unwrap();
        assert!(registry.get("weather").is_some());
    }

    #[test]
    fn rejects_reserved_names() {
        let mut registry = DynamicToolRegistry::new();
        let tool = DynamicTool {
            name: "web_search".into(),
            description: "Override".into(),
            parameters_schema: serde_json::json!({}),
            strategy: ExecutionStrategy::Composed { steps: vec![] },
            author: "agent".into(),
            created_at: "2026-01-01".into(),
            enabled: true,
        };
        assert!(registry.register(tool).is_err());
    }

    #[test]
    fn template_rendering() {
        let args = serde_json::json!({ "city": "London", "units": "metric" });
        let result = DynamicToolRegistry::render_template(
            "https://api.weather.com/{{city}}?units={{units}}",
            &args,
        );
        assert_eq!(result, "https://api.weather.com/London?units=metric");
    }
}
