//! Provider types — adapted from ZeroClaw's `providers/traits.rs`.
//!
//! Preserves ZeroClaw's exact struct definitions: ChatMessage, ToolCall,
//! ChatResponse, StreamChunk, ToolSpec, ConversationMessage, etc.
//! The async Provider trait is replaced with WASM-friendly synchronous
//! request/response construction (actual HTTP is done in TypeScript).

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// ── Core types (from ZeroClaw providers/traits.rs) ───────────────

/// A single message in a conversation (from ZeroClaw).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

impl ChatMessage {
    pub fn system(content: impl Into<String>) -> Self {
        Self {
            role: "system".into(),
            content: content.into(),
        }
    }

    pub fn user(content: impl Into<String>) -> Self {
        Self {
            role: "user".into(),
            content: content.into(),
        }
    }

    pub fn assistant(content: impl Into<String>) -> Self {
        Self {
            role: "assistant".into(),
            content: content.into(),
        }
    }

    pub fn tool(content: impl Into<String>) -> Self {
        Self {
            role: "tool".into(),
            content: content.into(),
        }
    }
}

/// A tool call requested by the LLM (from ZeroClaw).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolCall {
    pub id: String,
    pub name: String,
    pub arguments: String,
}

/// Raw token counts from a single LLM API response (from ZeroClaw).
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct TokenUsage {
    pub input_tokens: Option<u64>,
    pub output_tokens: Option<u64>,
}

/// An LLM response (from ZeroClaw).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChatResponse {
    pub text: Option<String>,
    pub tool_calls: Vec<ToolCall>,
    #[serde(default)]
    pub usage: Option<TokenUsage>,
    #[serde(default)]
    pub reasoning_content: Option<String>,
}

impl ChatResponse {
    /// True when the LLM wants to invoke at least one tool (from ZeroClaw).
    pub fn has_tool_calls(&self) -> bool {
        !self.tool_calls.is_empty()
    }

    /// Convenience: return text content or empty string (from ZeroClaw).
    pub fn text_or_empty(&self) -> &str {
        self.text.as_deref().unwrap_or("")
    }
}

/// A tool result to feed back to the LLM (from ZeroClaw).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolResultMessage {
    pub tool_call_id: String,
    pub content: String,
}

/// A message in a multi-turn conversation (from ZeroClaw).
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ConversationMessage {
    /// Regular chat message (system, user, assistant).
    Chat(ChatMessage),
    /// Tool calls from the assistant.
    AssistantToolCalls {
        text: Option<String>,
        tool_calls: Vec<ToolCall>,
        reasoning_content: Option<String>,
    },
    /// Results of tool executions.
    ToolResults(Vec<ToolResultMessage>),
}

/// A chunk of content from a streaming response (from ZeroClaw).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamChunk {
    pub delta: String,
    pub is_final: bool,
    pub token_count: usize,
}

impl StreamChunk {
    pub fn delta(text: impl Into<String>) -> Self {
        Self {
            delta: text.into(),
            is_final: false,
            token_count: 0,
        }
    }

    pub fn final_chunk() -> Self {
        Self {
            delta: String::new(),
            is_final: true,
            token_count: 0,
        }
    }

    pub fn error(message: impl Into<String>) -> Self {
        Self {
            delta: message.into(),
            is_final: true,
            token_count: 0,
        }
    }

    /// Estimate tokens (~4 chars per token, same as ZeroClaw).
    pub fn with_token_estimate(mut self) -> Self {
        self.token_count = self.delta.len().div_ceil(4);
        self
    }
}

/// Description of a tool for the LLM (from ZeroClaw tools/traits.rs).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolSpec {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value,
}

/// Result of a tool execution (from ZeroClaw tools/traits.rs).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolResult {
    pub success: bool,
    pub output: String,
    pub error: Option<String>,
}

// ── Provider request construction (WASM-friendly) ────────────────

/// Build an OpenAI-compatible chat completion request body.
/// Called from WASM; the TypeScript bridge sends this via fetch().
#[wasm_bindgen]
pub fn build_provider_request(
    messages_json: &str,
    model: &str,
    temperature: f64,
    stream: bool,
) -> Result<String, JsValue> {
    let messages: Vec<ChatMessage> = serde_json::from_str(messages_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid messages JSON: {e}")))?;

    let mut body = serde_json::Map::new();
    body.insert("model".into(), serde_json::Value::String(model.into()));
    body.insert("messages".into(), serde_json::to_value(&messages).unwrap());
    body.insert(
        "temperature".into(),
        serde_json::Value::Number(serde_json::Number::from_f64(temperature).unwrap()),
    );
    body.insert("stream".into(), serde_json::Value::Bool(stream));

    serde_json::to_string(&body).map_err(|e| JsValue::from_str(&format!("Serialize error: {e}")))
}

/// Build an OpenAI-compatible request body WITH tool definitions included.
/// This is the preferred method for agentic mode — includes function calling.
#[wasm_bindgen]
pub fn build_provider_request_with_tools(
    messages_json: &str,
    model: &str,
    temperature: f64,
    stream: bool,
    tools_json: &str,
) -> Result<String, JsValue> {
    let messages: Vec<ChatMessage> = serde_json::from_str(messages_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid messages JSON: {e}")))?;

    let tools: serde_json::Value =
        serde_json::from_str(tools_json).unwrap_or(serde_json::Value::Array(vec![]));

    let mut body = serde_json::Map::new();
    body.insert("model".into(), serde_json::Value::String(model.into()));
    body.insert("messages".into(), serde_json::to_value(&messages).unwrap());
    body.insert(
        "temperature".into(),
        serde_json::Value::Number(serde_json::Number::from_f64(temperature).unwrap()),
    );
    body.insert("stream".into(), serde_json::Value::Bool(stream));

    // Only add tools if non-empty
    if let serde_json::Value::Array(ref arr) = tools {
        if !arr.is_empty() {
            body.insert("tools".into(), tools);
            body.insert(
                "tool_choice".into(),
                serde_json::Value::String("auto".into()),
            );
        }
    }

    serde_json::to_string(&body).map_err(|e| JsValue::from_str(&format!("Serialize error: {e}")))
}

/// Parse an SSE line from a streaming response.
/// Returns: { delta: string, is_final: bool } as JSON.
#[wasm_bindgen]
pub fn parse_sse_line(line: &str) -> Result<String, JsValue> {
    let trimmed = line.trim();

    if trimmed.is_empty() || trimmed.starts_with(':') {
        return Ok(serde_json::to_string(&StreamChunk::delta("")).unwrap());
    }

    if !trimmed.starts_with("data: ") {
        return Ok(serde_json::to_string(&StreamChunk::delta("")).unwrap());
    }

    let data = &trimmed[6..];

    if data == "[DONE]" {
        return Ok(serde_json::to_string(&StreamChunk::final_chunk()).unwrap());
    }

    #[derive(Deserialize)]
    struct SSEChoice {
        delta: Option<SSEDelta>,
    }
    #[derive(Deserialize)]
    struct SSEDelta {
        content: Option<String>,
    }
    #[derive(Deserialize)]
    struct SSEResponse {
        choices: Option<Vec<SSEChoice>>,
    }

    let resp: SSEResponse = serde_json::from_str(data)
        .map_err(|e| JsValue::from_str(&format!("SSE parse error: {e}")))?;

    let text = resp
        .choices
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.delta)
        .and_then(|d| d.content)
        .unwrap_or_default();

    let chunk = StreamChunk::delta(text).with_token_estimate();
    serde_json::to_string(&chunk).map_err(|e| JsValue::from_str(&format!("Serialize error: {e}")))
}

/// Get the provider base URL for a known provider alias.
#[wasm_bindgen]
pub fn provider_base_url(provider: &str) -> String {
    match provider {
        "deepseek" => "https://api.deepseek.com/v1".into(),
        "openrouter" => "https://openrouter.ai/api/v1".into(),
        "openai" => "https://api.openai.com/v1".into(),
        "anthropic" => "https://api.anthropic.com/v1".into(),
        "gemini" => "https://generativelanguage.googleapis.com/v1beta".into(),
        "ollama" => "http://localhost:11434/v1".into(),
        "puter" => "https://api.puter.com/v1".into(),
        _ => {
            // Assume custom provider — URL comes from config
            String::new()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn chat_message_constructors() {
        let sys = ChatMessage::system("Be helpful");
        assert_eq!(sys.role, "system");
        assert_eq!(sys.content, "Be helpful");

        let user = ChatMessage::user("Hello");
        assert_eq!(user.role, "user");

        let asst = ChatMessage::assistant("Hi there");
        assert_eq!(asst.role, "assistant");

        let tool = ChatMessage::tool("{}");
        assert_eq!(tool.role, "tool");
    }

    #[test]
    fn chat_response_helpers() {
        let empty = ChatResponse {
            text: None,
            tool_calls: vec![],
            usage: None,
            reasoning_content: None,
        };
        assert!(!empty.has_tool_calls());
        assert_eq!(empty.text_or_empty(), "");

        let with_tools = ChatResponse {
            text: Some("Let me check".into()),
            tool_calls: vec![ToolCall {
                id: "1".into(),
                name: "shell".into(),
                arguments: "{}".into(),
            }],
            usage: None,
            reasoning_content: None,
        };
        assert!(with_tools.has_tool_calls());
        assert_eq!(with_tools.text_or_empty(), "Let me check");
    }

    #[test]
    fn tool_call_serialization() {
        let tc = ToolCall {
            id: "call_123".into(),
            name: "file_read".into(),
            arguments: r#"{"path":"test.txt"}"#.into(),
        };
        let json = serde_json::to_string(&tc).unwrap();
        assert!(json.contains("call_123"));
        assert!(json.contains("file_read"));
    }

    #[test]
    fn stream_chunk_token_estimate() {
        let chunk = StreamChunk::delta("Hello world!").with_token_estimate();
        assert_eq!(chunk.token_count, 3); // 12 chars / 4 = 3
        assert!(!chunk.is_final);
    }

    #[test]
    fn conversation_message_variants() {
        let chat = ConversationMessage::Chat(ChatMessage::user("hi"));
        let json = serde_json::to_string(&chat).unwrap();
        assert!(json.contains("\"type\":\"Chat\""));
    }
}
