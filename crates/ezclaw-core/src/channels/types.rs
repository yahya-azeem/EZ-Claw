//! Channel message types — unified format for all messaging platforms.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

/// Supported channel types.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum ChannelType {
    Telegram,
    Discord,
    Slack,
    WhatsApp,
    WebChat, // Local browser chat (default)
}

impl ChannelType {
    pub fn from_str(s: &str) -> Self {
        match s.to_lowercase().as_str() {
            "telegram" => Self::Telegram,
            "discord" => Self::Discord,
            "slack" => Self::Slack,
            "whatsapp" => Self::WhatsApp,
            _ => Self::WebChat,
        }
    }

    pub fn as_str(&self) -> &str {
        match self {
            Self::Telegram => "telegram",
            Self::Discord => "discord",
            Self::Slack => "slack",
            Self::WhatsApp => "whatsapp",
            Self::WebChat => "webchat",
        }
    }

    pub fn max_message_length(&self) -> usize {
        match self {
            Self::Telegram => 4096,
            Self::Discord => 2000,
            Self::Slack => 40000,
            Self::WhatsApp => 65536,
            Self::WebChat => usize::MAX,
        }
    }

    pub fn supports_markdown(&self) -> bool {
        match self {
            Self::Telegram => true,  // MarkdownV2
            Self::Discord => true,   // Full markdown
            Self::Slack => false,    // mrkdwn (Slack's own format)
            Self::WhatsApp => false, // Limited formatting
            Self::WebChat => true,   // Full markdown
        }
    }
}

/// An attachment on a channel message.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Attachment {
    pub filename: String,
    pub content_type: String,
    pub url: Option<String>,
    pub data: Option<String>, // base64 for inline
    pub size_bytes: u64,
}

/// A unified channel message — normalized from all platforms.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelMessage {
    /// Unique message ID (platform-specific).
    pub id: String,
    /// Channel this message came from.
    pub channel_type: ChannelType,
    /// Channel-specific identifier (chat_id, channel_id, etc.).
    pub channel_id: String,
    /// Sender display name.
    pub sender_name: String,
    /// Sender platform-specific ID.
    pub sender_id: String,
    /// Message text content.
    pub content: String,
    /// Attachments.
    pub attachments: Vec<Attachment>,
    /// Timestamp (ISO 8601).
    pub timestamp: String,
    /// Whether this is a reply to another message.
    pub reply_to: Option<String>,
    /// Thread ID (for threaded conversations).
    pub thread_id: Option<String>,
    /// Raw platform-specific metadata as JSON.
    pub metadata: Option<String>,
}

/// Agent's response to be sent back through the channel.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelResponse {
    /// The channel to respond to.
    pub channel_type: ChannelType,
    /// Channel-specific target (chat_id, channel_id, etc.).
    pub channel_id: String,
    /// Response text.
    pub content: String,
    /// Reply to specific message ID.
    pub reply_to: Option<String>,
    /// Thread ID.
    pub thread_id: Option<String>,
    /// Attachments to send.
    pub attachments: Vec<Attachment>,
}

/// Configuration for a channel connection.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelConfig {
    pub channel_type: ChannelType,
    pub enabled: bool,
    /// Bot token / API key (stored encrypted in vault).
    pub token_credential_id: String,
    /// Channel-specific settings.
    pub settings: std::collections::HashMap<String, String>,
}

// ── WASM Bindings ────────────────────────────────────────────────

/// Parse a platform-specific message into a unified ChannelMessage.
#[wasm_bindgen]
pub fn normalize_channel_message(raw_json: &str, channel_type: &str) -> Result<String, JsValue> {
    let ct = ChannelType::from_str(channel_type);

    // Parse the raw platform message and normalize it
    let raw: serde_json::Value = serde_json::from_str(raw_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid message JSON: {e}")))?;

    let msg = match ct {
        ChannelType::Telegram => normalize_telegram(&raw)?,
        ChannelType::Discord => normalize_discord(&raw)?,
        ChannelType::Slack => normalize_slack(&raw)?,
        _ => return Err(JsValue::from_str("Unsupported channel type for normalization")),
    };

    serde_json::to_string(&msg)
        .map_err(|e| JsValue::from_str(&format!("Serialize error: {e}")))
}

/// Format an agent response for a specific platform.
#[wasm_bindgen]
pub fn format_channel_response(response_json: &str) -> Result<String, JsValue> {
    let response: ChannelResponse = serde_json::from_str(response_json)
        .map_err(|e| JsValue::from_str(&format!("Invalid response JSON: {e}")))?;

    let formatted = match response.channel_type {
        ChannelType::Telegram => format_for_telegram(&response),
        ChannelType::Discord => format_for_discord(&response),
        ChannelType::Slack => format_for_slack(&response),
        _ => response.content.clone(),
    };

    // Split into chunks if needed
    let max_len = response.channel_type.max_message_length();
    let chunks: Vec<&str> = if formatted.len() > max_len {
        formatted.as_bytes()
            .chunks(max_len)
            .map(|chunk| std::str::from_utf8(chunk).unwrap_or(""))
            .collect()
    } else {
        vec![&formatted]
    };

    let result = serde_json::json!({
        "channel_type": response.channel_type.as_str(),
        "channel_id": response.channel_id,
        "chunks": chunks,
        "reply_to": response.reply_to,
        "thread_id": response.thread_id,
    });

    serde_json::to_string(&result)
        .map_err(|e| JsValue::from_str(&format!("Serialize error: {e}")))
}

// ── Platform-Specific Normalizers ────────────────────────────────

fn normalize_telegram(raw: &serde_json::Value) -> Result<ChannelMessage, JsValue> {
    let msg = raw.get("message").or(Some(raw))
        .ok_or_else(|| JsValue::from_str("No message field"))?;

    Ok(ChannelMessage {
        id: msg.get("message_id")
            .and_then(|v| v.as_i64())
            .map(|v| v.to_string())
            .unwrap_or_default(),
        channel_type: ChannelType::Telegram,
        channel_id: msg.get("chat")
            .and_then(|c| c.get("id"))
            .and_then(|v| v.as_i64())
            .map(|v| v.to_string())
            .unwrap_or_default(),
        sender_name: msg.get("from")
            .and_then(|f| f.get("first_name"))
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown")
            .to_string(),
        sender_id: msg.get("from")
            .and_then(|f| f.get("id"))
            .and_then(|v| v.as_i64())
            .map(|v| v.to_string())
            .unwrap_or_default(),
        content: msg.get("text")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        attachments: vec![],
        timestamp: msg.get("date")
            .and_then(|v| v.as_i64())
            .map(|v| v.to_string())
            .unwrap_or_default(),
        reply_to: msg.get("reply_to_message")
            .and_then(|r| r.get("message_id"))
            .and_then(|v| v.as_i64())
            .map(|v| v.to_string()),
        thread_id: None,
        metadata: Some(serde_json::to_string(raw).unwrap_or_default()),
    })
}

fn normalize_discord(raw: &serde_json::Value) -> Result<ChannelMessage, JsValue> {
    Ok(ChannelMessage {
        id: raw.get("id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        channel_type: ChannelType::Discord,
        channel_id: raw.get("channel_id")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        sender_name: raw.get("author")
            .and_then(|a| a.get("username"))
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown")
            .to_string(),
        sender_id: raw.get("author")
            .and_then(|a| a.get("id"))
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        content: raw.get("content")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        attachments: raw.get("attachments")
            .and_then(|a| a.as_array())
            .map(|arr| arr.iter().filter_map(|a| {
                Some(Attachment {
                    filename: a.get("filename")?.as_str()?.to_string(),
                    content_type: a.get("content_type")
                        .and_then(|v| v.as_str())
                        .unwrap_or("application/octet-stream")
                        .to_string(),
                    url: a.get("url").and_then(|v| v.as_str()).map(|s| s.to_string()),
                    data: None,
                    size_bytes: a.get("size").and_then(|v| v.as_u64()).unwrap_or(0),
                })
            }).collect())
            .unwrap_or_default(),
        timestamp: raw.get("timestamp")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        reply_to: raw.get("referenced_message")
            .and_then(|r| r.get("id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        thread_id: raw.get("thread")
            .and_then(|t| t.get("id"))
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        metadata: Some(serde_json::to_string(raw).unwrap_or_default()),
    })
}

fn normalize_slack(raw: &serde_json::Value) -> Result<ChannelMessage, JsValue> {
    Ok(ChannelMessage {
        id: raw.get("ts")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        channel_type: ChannelType::Slack,
        channel_id: raw.get("channel")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        sender_name: raw.get("user_profile")
            .and_then(|p| p.get("display_name"))
            .and_then(|v| v.as_str())
            .unwrap_or("Unknown")
            .to_string(),
        sender_id: raw.get("user")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        content: raw.get("text")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        attachments: vec![],
        timestamp: raw.get("ts")
            .and_then(|v| v.as_str())
            .unwrap_or("")
            .to_string(),
        reply_to: None,
        thread_id: raw.get("thread_ts")
            .and_then(|v| v.as_str())
            .map(|s| s.to_string()),
        metadata: Some(serde_json::to_string(raw).unwrap_or_default()),
    })
}

// ── Platform-Specific Formatters ─────────────────────────────────

fn format_for_telegram(response: &ChannelResponse) -> String {
    // Telegram MarkdownV2: escape special chars
    let mut text = response.content.clone();
    // Escape only outside of code blocks for MarkdownV2
    for ch in ['_', '*', '[', ']', '(', ')', '~', '>', '#', '+', '-', '=', '|', '{', '}', '.', '!'] {
        text = text.replace(ch, &format!("\\{ch}"));
    }
    text
}

fn format_for_discord(response: &ChannelResponse) -> String {
    // Discord supports standard markdown
    response.content.clone()
}

fn format_for_slack(response: &ChannelResponse) -> String {
    // Convert markdown to Slack mrkdwn
    let mut text = response.content.clone();
    // Bold: **text** → *text*
    text = text.replace("**", "*");
    // Italic: *text* or _text_ → _text_
    // Links: [text](url) → <url|text>
    text
}
