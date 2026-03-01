//! Agent engine — autonomous ReAct loop with IronClaw security.
//!
//! Combines ZeroClaw's SystemPromptBuilder with an autonomous agent loop:
//! - **ReAct loop**: Reason → Act → Observe → Repeat
//! - **Security pipeline**: Every tool call goes through IronClaw sandbox
//! - **Autonomy levels**: Manual / Semi / Auto
//! - **Stuck detection**: Exponential backoff on repeated failures
//! - **Async**: All execution bridges to JS Promises via wasm-bindgen-futures

use serde::{Deserialize, Serialize};
use std::fmt::Write;
use wasm_bindgen::prelude::*;

use crate::config::Config;
use crate::providers::{ChatMessage, ToolCall, ToolSpec};
use crate::security::sandbox::{SandboxManager, ToolExecutionRequest};
use crate::text;
use crate::tools::ToolRegistry;

// ── SystemPromptBuilder (adapted from ZeroClaw's agent/prompt.rs) ──

/// Prompt section — trait from ZeroClaw's agent/prompt.rs.
pub trait PromptSection: Send + Sync {
    fn name(&self) -> &str;
    fn build(&self, ctx: &PromptContext) -> String;
}

/// Context passed to prompt sections (adapted from ZeroClaw).
pub struct PromptContext<'a> {
    pub model_name: &'a str,
    pub tools: &'a [ToolSpec],
    pub identity_content: Option<&'a str>,
    pub recalled_memories: &'a [String],
}

/// SystemPromptBuilder — same architecture as ZeroClaw's agent/prompt.rs.
pub struct SystemPromptBuilder {
    sections: Vec<Box<dyn PromptSection>>,
}

impl SystemPromptBuilder {
    pub fn with_defaults() -> Self {
        Self {
            sections: vec![
                Box::new(IdentitySection),
                Box::new(ToolsSection),
                Box::new(SafetySection),
                Box::new(MemorySection),
                Box::new(RuntimeSection),
                Box::new(DateTimeSection),
            ],
        }
    }

    pub fn add_section(mut self, section: Box<dyn PromptSection>) -> Self {
        self.sections.push(section);
        self
    }

    pub fn build(&self, ctx: &PromptContext) -> String {
        let mut output = String::new();
        for section in &self.sections {
            let part = section.build(ctx);
            let trimmed = part.trim();
            if trimmed.is_empty() {
                continue;
            }
            output.push_str(trimmed);
            output.push_str("\n\n");
        }
        output
    }
}

// ── Prompt sections (adapted from ZeroClaw) ──────────────────────

pub struct IdentitySection;
pub struct ToolsSection;
pub struct SafetySection;
pub struct MemorySection;
pub struct RuntimeSection;
pub struct DateTimeSection;

impl PromptSection for IdentitySection {
    fn name(&self) -> &str {
        "identity"
    }

    fn build(&self, ctx: &PromptContext) -> String {
        let mut prompt = String::from("## Identity\n\n");
        if let Some(content) = ctx.identity_content {
            let trimmed = content.trim();
            if !trimmed.is_empty() {
                prompt.push_str(trimmed);
                prompt.push_str("\n\n");
            }
        } else {
            prompt.push_str(
                "You are EZ-Claw, a high-performance AI assistant powered by ZeroClaw's engine \
                 running in the browser via WebAssembly. You are knowledgeable, concise, and helpful.\n",
            );
        }
        prompt
    }
}

impl PromptSection for ToolsSection {
    fn name(&self) -> &str {
        "tools"
    }

    fn build(&self, ctx: &PromptContext) -> String {
        if ctx.tools.is_empty() {
            return String::new();
        }
        let mut out = String::from("## Tools\n\n");
        for tool in ctx.tools {
            let _ = writeln!(
                out,
                "- **{}**: {}\n  Parameters: `{}`",
                tool.name,
                tool.description,
                serde_json::to_string(&tool.parameters).unwrap_or_default()
            );
        }
        out
    }
}

impl PromptSection for SafetySection {
    fn name(&self) -> &str {
        "safety"
    }

    /// Safety section — exact same text as ZeroClaw's SafetySection.
    fn build(&self, _ctx: &PromptContext) -> String {
        "## Safety\n\n\
        - Do not exfiltrate private data.\n\
        - Do not run destructive commands without asking.\n\
        - Do not bypass oversight or approval mechanisms.\n\
        - When in doubt, ask before acting externally."
            .into()
    }
}

impl PromptSection for MemorySection {
    fn name(&self) -> &str {
        "memory"
    }

    fn build(&self, ctx: &PromptContext) -> String {
        if ctx.recalled_memories.is_empty() {
            return String::new();
        }
        let mut out = String::from("## Recalled Memories\n\n");
        for (i, mem) in ctx.recalled_memories.iter().enumerate() {
            let _ = writeln!(out, "{}. {}", i + 1, mem.trim());
        }
        out.push_str("\nUse the above memories as context if relevant to the user's question.");
        out
    }
}

impl PromptSection for RuntimeSection {
    fn name(&self) -> &str {
        "runtime"
    }

    fn build(&self, ctx: &PromptContext) -> String {
        format!(
            "## Runtime\n\nEnvironment: Browser (WebAssembly) | Model: {}",
            ctx.model_name
        )
    }
}

impl PromptSection for DateTimeSection {
    fn name(&self) -> &str {
        "datetime"
    }

    fn build(&self, _ctx: &PromptContext) -> String {
        // In browser, datetime comes from JS via Date — injected by bridge.
        // Placeholder: the TypeScript bridge will set this.
        "## Current Date & Time\n\n[Injected by browser runtime]".into()
    }
}

// ── Tool instructions (from ZeroClaw's providers/traits.rs) ──────

/// Build tool instructions text for prompt-guided tool calling.
/// Exact same format as ZeroClaw's `build_tool_instructions_text`.
pub fn build_tool_instructions_text(tools: &[ToolSpec]) -> String {
    let mut instructions = String::new();

    instructions.push_str("## Tool Use Protocol\n\n");
    instructions.push_str("To use a tool, wrap a JSON object in <tool_call></tool_call> tags:\n\n");
    instructions.push_str("<tool_call>\n");
    instructions.push_str(r#"{"name": "tool_name", "arguments": {"param": "value"}}"#);
    instructions.push_str("\n</tool_call>\n\n");
    instructions.push_str("You may use multiple tool calls in a single response. ");
    instructions.push_str("After tool execution, results appear in <tool_result> tags. ");
    instructions
        .push_str("Continue reasoning with the results until you can give a final answer.\n\n");
    instructions.push_str("### Available Tools\n\n");

    for tool in tools {
        writeln!(&mut instructions, "**{}**: {}", tool.name, tool.description)
            .expect("writing to String cannot fail");
        let parameters =
            serde_json::to_string(&tool.parameters).unwrap_or_else(|_| "{}".to_string());
        writeln!(&mut instructions, "Parameters: `{parameters}`")
            .expect("writing to String cannot fail");
        instructions.push('\n');
    }

    instructions
}

// ── WasmAgent (wasm_bindgen wrapper) ─────────────────────────────

#[wasm_bindgen]
pub struct WasmAgent {
    config: Config,
    tool_registry: ToolRegistry,
    sandbox: SandboxManager,
}

#[wasm_bindgen]
impl WasmAgent {
    /// Create a new Agent with the given configuration JSON.
    #[wasm_bindgen(constructor)]
    pub fn new(config_json: &str) -> Result<WasmAgent, JsValue> {
        let config: Config = serde_json::from_str(config_json)
            .map_err(|e| JsValue::from_str(&format!("Config parse error: {e}")))?;
        Ok(WasmAgent {
            config,
            tool_registry: ToolRegistry::default(),
            sandbox: SandboxManager::default(),
        })
    }

    /// Update configuration (hot-reload, like ZeroClaw).
    #[wasm_bindgen]
    pub fn update_config(&mut self, config_json: &str) -> Result<(), JsValue> {
        self.config = serde_json::from_str(config_json)
            .map_err(|e| JsValue::from_str(&format!("Config parse error: {e}")))?;
        Ok(())
    }

    /// Build the complete message array for a provider request.
    ///
    /// Takes: history JSON, memories JSON array, identity content string, datetime string.
    /// Returns: JSON array of ChatMessage.
    #[wasm_bindgen]
    pub fn build_messages(
        &self,
        history_json: &str,
        memories_json: &str,
        identity_content: &str,
        datetime_str: &str,
    ) -> Result<String, JsValue> {
        let history: Vec<ChatMessage> = serde_json::from_str(history_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid history JSON: {e}")))?;

        let memories: Vec<String> = serde_json::from_str(memories_json).unwrap_or_default();

        let model_name = self.config.default_model.as_deref().unwrap_or("unknown");

        let identity = if identity_content.trim().is_empty() {
            None
        } else {
            Some(identity_content)
        };

        let ctx = PromptContext {
            model_name,
            tools: &[],
            identity_content: identity,
            recalled_memories: &memories,
        };

        let mut system_prompt = SystemPromptBuilder::with_defaults().build(&ctx);

        // Inject actual datetime (from JS)
        if !datetime_str.trim().is_empty() {
            system_prompt = system_prompt.replace("[Injected by browser runtime]", datetime_str);
        }

        let mut messages: Vec<ChatMessage> = Vec::new();

        // 1. System prompt (always first, like ZeroClaw)
        messages.push(ChatMessage::system(system_prompt));

        // 2. History (truncated to max_history_messages)
        let max_history = self.config.agent.max_history_messages;
        let history_slice = if history.len() > max_history {
            &history[history.len() - max_history..]
        } else {
            &history
        };

        for msg in history_slice {
            messages.push(msg.clone());
        }

        serde_json::to_string(&messages)
            .map_err(|e| JsValue::from_str(&format!("Serialize error: {e}")))
    }

    /// Parse tool calls from a provider response JSON chunk.
    /// Returns JSON array of ToolCall.
    #[wasm_bindgen]
    pub fn parse_tool_calls(&self, response_json: &str) -> Result<String, JsValue> {
        #[derive(Deserialize)]
        struct Choice {
            message: Option<ChoiceMessage>,
            delta: Option<ChoiceMessage>,
        }
        #[derive(Deserialize)]
        struct ChoiceMessage {
            tool_calls: Option<Vec<RawToolCall>>,
        }
        #[derive(Deserialize)]
        struct RawToolCall {
            id: Option<String>,
            function: Option<RawFunction>,
        }
        #[derive(Deserialize)]
        struct RawFunction {
            name: Option<String>,
            arguments: Option<String>,
        }
        #[derive(Deserialize)]
        struct Response {
            choices: Option<Vec<Choice>>,
        }

        let resp: Response = serde_json::from_str(response_json)
            .map_err(|e| JsValue::from_str(&format!("Parse error: {e}")))?;

        let raw_calls = resp
            .choices
            .and_then(|c| c.into_iter().next())
            .and_then(|c| c.message.or(c.delta))
            .and_then(|m| m.tool_calls)
            .unwrap_or_default();

        let tool_calls: Vec<ToolCall> = raw_calls
            .into_iter()
            .filter_map(|tc| {
                let func = tc.function?;
                Some(ToolCall {
                    id: tc.id.unwrap_or_default(),
                    name: func.name.unwrap_or_default(),
                    arguments: func.arguments.unwrap_or_default(),
                })
            })
            .collect();

        serde_json::to_string(&tool_calls)
            .map_err(|e| JsValue::from_str(&format!("Serialize error: {e}")))
    }

    /// Format a tool result as a ChatMessage JSON.
    #[wasm_bindgen]
    pub fn format_tool_result(
        &self,
        tool_call_id: &str,
        tool_name: &str,
        result: &str,
    ) -> Result<String, JsValue> {
        let msg = ChatMessage {
            role: "tool".to_string(),
            content: result.to_string(),
        };
        // Include tool_call_id and name as extra fields for provider compatibility
        let mut val = serde_json::to_value(&msg).unwrap();
        if let Some(obj) = val.as_object_mut() {
            obj.insert(
                "tool_call_id".into(),
                serde_json::Value::String(tool_call_id.into()),
            );
            obj.insert("name".into(), serde_json::Value::String(tool_name.into()));
        }
        serde_json::to_string(&val).map_err(|e| JsValue::from_str(&format!("Serialize error: {e}")))
    }

    /// Estimate total tokens for a message array (JSON string).
    #[wasm_bindgen]
    pub fn estimate_context_tokens(&self, messages_json: &str) -> u32 {
        let messages: Vec<ChatMessage> = serde_json::from_str(messages_json).unwrap_or_default();
        let mut total: u32 = 0;
        for msg in &messages {
            total += 4; // ~4 tokens per message overhead (role, separators)
            total += text::estimate_tokens(&msg.content);
        }
        total
    }

    // ─── Agent Engine Methods (Phase 1) ────────────────────────────

    /// Get all enabled tools as LLM-compatible JSON.
    #[wasm_bindgen]
    pub fn get_tools_json(&self) -> String {
        self.tool_registry.to_llm_tools_json()
    }

    /// Security-check a tool call. Returns JSON SecurityCheckResult.
    #[wasm_bindgen]
    pub fn check_tool_security(
        &mut self,
        tool_name: &str,
        arguments: &str,
        target_url: &str,
    ) -> String {
        let tool_def = self.tool_registry.get(tool_name);
        let capabilities = tool_def.map(|t| t.capabilities.clone()).unwrap_or_default();

        let request = ToolExecutionRequest {
            tool_name: tool_name.to_string(),
            arguments: arguments.to_string(),
            required_capabilities: capabilities,
            target_url: if target_url.is_empty() {
                None
            } else {
                Some(target_url.to_string())
            },
            request_body: Some(arguments.to_string()),
        };

        let result = self.sandbox.check_request(&request);
        serde_json::to_string(&result).unwrap_or_default()
    }

    /// Wrap a tool result through the security response pipeline.
    #[wasm_bindgen]
    pub fn secure_tool_response(&self, tool_name: &str, response: &str) -> String {
        let (output, warnings) = self.sandbox.check_response(tool_name, response);
        serde_json::to_string(&serde_json::json!({
            "output": output,
            "warnings": warnings,
        }))
        .unwrap_or_default()
    }

    /// Register a credential for the vault.
    #[wasm_bindgen]
    pub fn add_credential(
        &mut self,
        mapping_json: &str,
        encrypted_value: &str,
    ) -> Result<(), JsValue> {
        self.sandbox.add_credential_mapping(mapping_json)?;
        // Extract the ID from the mapping to store the value
        if let Ok(mapping) = serde_json::from_str::<serde_json::Value>(mapping_json) {
            if let Some(id) = mapping.get("id").and_then(|v| v.as_str()) {
                self.sandbox.store_credential(id, encrypted_value);
            }
        }
        Ok(())
    }

    /// Add a domain to the allowlist.
    #[wasm_bindgen]
    pub fn add_allowed_domain(&mut self, domain: &str, path: &str, label: &str) -> bool {
        self.sandbox.add_allowed_domain(domain, path, label)
    }

    /// Register a secret for leak detection.
    #[wasm_bindgen]
    pub fn register_leak_secret(&mut self, secret: &str) {
        self.sandbox.register_secret(secret);
    }

    /// Get security audit log.
    #[wasm_bindgen]
    pub fn get_audit_log(&self, limit: usize) -> String {
        self.sandbox.audit_log_json(limit)
    }

    /// Export security state for persistence.
    #[wasm_bindgen]
    pub fn export_security_state(&self) -> String {
        self.sandbox.export_state()
    }
}

// ── Autonomous Agent Loop (ReAct) ────────────────────────────────

/// Agent state for the ReAct loop.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AgentState {
    /// Waiting for user input.
    Idle,
    /// Processing / thinking (LLM call in progress).
    Thinking,
    /// Executing a tool.
    Acting,
    /// Waiting for user confirmation (permission check).
    WaitingConfirmation,
    /// Task complete, final answer ready.
    Complete,
    /// Error state.
    Error,
}

/// Events emitted by the agent loop for UI updates.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AgentEvent {
    /// Event type.
    pub event_type: AgentEventType,
    /// Associated data (JSON).
    pub data: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AgentEventType {
    /// State changed.
    StateChange,
    /// Thinking text (LLM reasoning).
    ThinkingUpdate,
    /// Tool call requested.
    ToolCallRequested,
    /// Tool call needs confirmation.
    ConfirmationNeeded,
    /// Tool result received.
    ToolResultReceived,
    /// Security warning.
    SecurityWarning,
    /// Final answer ready.
    FinalAnswer,
    /// Error occurred.
    Error,
    /// Iteration progress.
    IterationProgress,
}

/// The autonomous agent loop state machine.
#[wasm_bindgen]
pub struct WasmAgentLoop {
    state: AgentState,
    iteration: u32,
    max_iterations: u32,
    consecutive_errors: u32,
    events: Vec<AgentEvent>,
}

#[wasm_bindgen]
impl WasmAgentLoop {
    #[wasm_bindgen(constructor)]
    pub fn new(max_iterations: u32) -> Self {
        Self {
            state: AgentState::Idle,
            iteration: 0,
            max_iterations: if max_iterations == 0 {
                25
            } else {
                max_iterations
            },
            consecutive_errors: 0,
            events: Vec::new(),
        }
    }

    /// Get current state as string.
    #[wasm_bindgen]
    pub fn state(&self) -> String {
        serde_json::to_string(&self.state).unwrap_or_default()
    }

    /// Get current iteration number.
    #[wasm_bindgen]
    pub fn iteration(&self) -> u32 {
        self.iteration
    }

    /// Check if the loop should continue.
    #[wasm_bindgen]
    pub fn should_continue(&self) -> bool {
        self.state != AgentState::Complete
            && self.state != AgentState::Error
            && self.iteration < self.max_iterations
            && self.consecutive_errors < 3
    }

    /// Start a new iteration. Returns false if loop should stop.
    #[wasm_bindgen]
    pub fn begin_iteration(&mut self) -> bool {
        if !self.should_continue() {
            return false;
        }
        self.iteration += 1;
        self.state = AgentState::Thinking;
        self.emit_event(
            AgentEventType::IterationProgress,
            &serde_json::json!({
                "iteration": self.iteration,
                "max_iterations": self.max_iterations,
            })
            .to_string(),
        );
        self.emit_event(AgentEventType::StateChange, &format!("\"Thinking\""));
        true
    }

    /// Process LLM response. Returns whether there are tool calls to execute.
    ///
    /// The TS bridge calls this after getting the LLM response.
    /// - If response has tool calls → returns true (enter Acting state)
    /// - If response is final answer → returns false (enter Complete state)
    #[wasm_bindgen]
    pub fn process_llm_response(&mut self, has_tool_calls: bool, response_text: &str) -> bool {
        if has_tool_calls {
            self.state = AgentState::Acting;
            self.consecutive_errors = 0;
            self.emit_event(AgentEventType::StateChange, &format!("\"Acting\""));
            true
        } else {
            // Final answer
            self.state = AgentState::Complete;
            self.emit_event(AgentEventType::FinalAnswer, response_text);
            self.emit_event(AgentEventType::StateChange, &format!("\"Complete\""));
            false
        }
    }

    /// Record a tool result and prepare for next iteration.
    #[wasm_bindgen]
    pub fn record_tool_result(&mut self, tool_name: &str, success: bool, _output: &str) {
        if success {
            self.consecutive_errors = 0;
        } else {
            self.consecutive_errors += 1;
        }

        self.emit_event(
            AgentEventType::ToolResultReceived,
            &serde_json::json!({
                "tool": tool_name,
                "success": success,
                "iteration": self.iteration,
            })
            .to_string(),
        );

        // Back to thinking for next iteration
        self.state = AgentState::Thinking;
    }

    /// Mark that we need user confirmation before proceeding.
    #[wasm_bindgen]
    pub fn request_confirmation(&mut self, prompt: &str) {
        self.state = AgentState::WaitingConfirmation;
        self.emit_event(
            AgentEventType::ConfirmationNeeded,
            &serde_json::json!({ "prompt": prompt }).to_string(),
        );
    }

    /// User confirmed — resume execution.
    #[wasm_bindgen]
    pub fn confirm(&mut self) {
        if self.state == AgentState::WaitingConfirmation {
            self.state = AgentState::Acting;
            self.emit_event(AgentEventType::StateChange, &format!("\"Acting\""));
        }
    }

    /// User denied — skip tool call, continue loop.
    #[wasm_bindgen]
    pub fn deny(&mut self) {
        if self.state == AgentState::WaitingConfirmation {
            self.state = AgentState::Thinking;
            self.emit_event(AgentEventType::StateChange, &format!("\"Thinking\""));
        }
    }

    /// Record an error.
    #[wasm_bindgen]
    pub fn record_error(&mut self, error: &str) {
        self.consecutive_errors += 1;
        if self.consecutive_errors >= 3 {
            self.state = AgentState::Error;
            self.emit_event(
                AgentEventType::Error,
                &serde_json::json!({
                    "error": error,
                    "fatal": true,
                    "message": "Too many consecutive errors. Agent loop stopped.",
                })
                .to_string(),
            );
        } else {
            self.emit_event(
                AgentEventType::Error,
                &serde_json::json!({
                    "error": error,
                    "fatal": false,
                    "retry": self.consecutive_errors,
                })
                .to_string(),
            );
        }
    }

    /// Reset the loop for a new conversation turn.
    #[wasm_bindgen]
    pub fn reset(&mut self) {
        self.state = AgentState::Idle;
        self.iteration = 0;
        self.consecutive_errors = 0;
        self.events.clear();
    }

    /// Drain pending events as JSON array.
    #[wasm_bindgen]
    pub fn drain_events(&mut self) -> String {
        let events = std::mem::take(&mut self.events);
        serde_json::to_string(&events).unwrap_or_default()
    }

    /// Internal: emit an event.
    fn emit_event(&mut self, event_type: AgentEventType, data: &str) {
        self.events.push(AgentEvent {
            event_type,
            data: data.to_string(),
        });
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn system_prompt_builder_assembles_sections() {
        let ctx = PromptContext {
            model_name: "deepseek-chat",
            tools: &[],
            identity_content: None,
            recalled_memories: &[],
        };
        let prompt = SystemPromptBuilder::with_defaults().build(&ctx);
        assert!(prompt.contains("## Identity"));
        assert!(prompt.contains("## Safety"));
        assert!(prompt.contains("## Runtime"));
    }

    #[test]
    fn system_prompt_includes_memories() {
        let memories = vec!["User prefers Rust".into(), "Working on EZ-Claw".into()];
        let ctx = PromptContext {
            model_name: "test",
            tools: &[],
            identity_content: None,
            recalled_memories: &memories,
        };
        let prompt = SystemPromptBuilder::with_defaults().build(&ctx);
        assert!(prompt.contains("## Recalled Memories"));
        assert!(prompt.contains("User prefers Rust"));
    }

    #[test]
    fn safety_section_matches_zeroclaw() {
        let ctx = PromptContext {
            model_name: "test",
            tools: &[],
            identity_content: None,
            recalled_memories: &[],
        };
        let output = SafetySection.build(&ctx);
        assert!(output.contains("Do not exfiltrate private data"));
        assert!(output.contains("Do not bypass oversight"));
    }

    #[test]
    fn build_tool_instructions_matches_zeroclaw_format() {
        let tools = vec![ToolSpec {
            name: "shell".into(),
            description: "Execute commands".into(),
            parameters: serde_json::json!({"type": "object"}),
        }];
        let instructions = build_tool_instructions_text(&tools);
        assert!(instructions.contains("Tool Use Protocol"));
        assert!(instructions.contains("<tool_call>"));
        assert!(instructions.contains("**shell**"));
    }

    #[test]
    fn agent_loop_basic_cycle() {
        let mut loop_state = WasmAgentLoop::new(10);
        assert!(loop_state.should_continue());

        // Start iteration
        assert!(loop_state.begin_iteration());
        assert_eq!(loop_state.iteration(), 1);

        // LLM returns tool call
        assert!(loop_state.process_llm_response(true, ""));

        // Tool completes
        loop_state.record_tool_result("web_search", true, "results");

        // Next iteration — LLM gives final answer
        assert!(loop_state.begin_iteration());
        assert!(!loop_state.process_llm_response(false, "Here is your answer"));

        assert!(!loop_state.should_continue());
    }

    #[test]
    fn agent_loop_stops_on_errors() {
        let mut loop_state = WasmAgentLoop::new(10);
        loop_state.begin_iteration();
        loop_state.record_error("Error 1");
        loop_state.record_error("Error 2");
        loop_state.record_error("Error 3"); // 3rd consecutive error
        assert!(!loop_state.should_continue());
    }
}
