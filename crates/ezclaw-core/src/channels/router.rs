//! Channel Router — routes messages to agent sessions.
//!
//! Maps channel+sender combinations to specific agent sessions.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

use super::types::{ChannelConfig, ChannelMessage};

/// Route key: channel_type + channel_id + sender_id.
#[derive(Debug, Clone, Hash, PartialEq, Eq, Serialize, Deserialize)]
pub struct RouteKey {
    pub channel_type: String,
    pub channel_id: String,
    pub sender_id: String,
}

impl RouteKey {
    pub fn from_message(msg: &ChannelMessage) -> Self {
        Self {
            channel_type: msg.channel_type.as_str().to_string(),
            channel_id: msg.channel_id.clone(),
            sender_id: msg.sender_id.clone(),
        }
    }

    pub fn to_string_key(&self) -> String {
        format!(
            "{}:{}:{}",
            self.channel_type, self.channel_id, self.sender_id
        )
    }
}

/// Channel Route — maps a channel sender to an agent session.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelRoute {
    pub key: RouteKey,
    pub session_id: String,
    pub created_at: String,
    pub last_active: String,
    pub message_count: u64,
}

/// Channel Router — manages routing of channel messages to sessions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ChannelRouter {
    routes: HashMap<String, ChannelRoute>,
    configs: HashMap<String, ChannelConfig>,
}

impl ChannelRouter {
    pub fn new() -> Self {
        Self {
            routes: HashMap::new(),
            configs: HashMap::new(),
        }
    }

    /// Get or create a session route for a message.
    pub fn route_message(&mut self, msg: &ChannelMessage) -> &ChannelRoute {
        let key = RouteKey::from_message(msg);
        let string_key = key.to_string_key();

        if !self.routes.contains_key(&string_key) {
            let route = ChannelRoute {
                key: key.clone(),
                session_id: format!("ch-{}", uuid_v4()),
                created_at: msg.timestamp.clone(),
                last_active: msg.timestamp.clone(),
                message_count: 0,
            };
            self.routes.insert(string_key.clone(), route);
        }

        let route = self.routes.get_mut(&string_key).unwrap();
        route.last_active = msg.timestamp.clone();
        route.message_count += 1;
        route
    }

    /// Get an existing route for a message.
    pub fn get_route(&self, msg: &ChannelMessage) -> Option<&ChannelRoute> {
        let key = RouteKey::from_message(msg);
        self.routes.get(&key.to_string_key())
    }

    /// Register a channel configuration.
    pub fn register_channel(&mut self, config: ChannelConfig) {
        self.configs
            .insert(config.channel_type.as_str().to_string(), config);
    }

    /// Get channel config.
    pub fn get_config(&self, channel_type: &str) -> Option<&ChannelConfig> {
        self.configs.get(channel_type)
    }

    /// List all active routes.
    pub fn active_routes(&self) -> Vec<&ChannelRoute> {
        self.routes.values().collect()
    }

    /// Export state as JSON.
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_default()
    }

    /// Import state from JSON.
    pub fn from_json(json: &str) -> Result<Self, String> {
        serde_json::from_str(json).map_err(|e| format!("Invalid router state: {e}"))
    }
}

fn uuid_v4() -> String {
    // Simple UUID v4 generation using available random
    use std::fmt::Write;
    let mut buf = String::with_capacity(36);
    let bytes: Vec<u8> = (0..16)
        .map(|_| {
            // Use a simple hash-based approach since getrandom might not be available
            let t = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .subsec_nanos();
            (t % 256) as u8
        })
        .collect();

    for (i, b) in bytes.iter().enumerate() {
        if i == 4 || i == 6 || i == 8 || i == 10 {
            buf.push('-');
        }
        let _ = write!(buf, "{:02x}", b);
    }
    buf
}

// ── WASM Bindings ────────────────────────────────────────────────

#[wasm_bindgen]
pub struct WasmChannelRouter {
    inner: ChannelRouter,
}

#[wasm_bindgen]
impl WasmChannelRouter {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: ChannelRouter::new(),
        }
    }

    /// Route a message and return the session ID.
    #[wasm_bindgen]
    pub fn route_message(&mut self, message_json: &str) -> Result<String, JsValue> {
        let msg: ChannelMessage = serde_json::from_str(message_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid message: {e}")))?;

        let route = self.inner.route_message(&msg);

        serde_json::to_string(route)
            .map_err(|e| JsValue::from_str(&format!("Serialize error: {e}")))
    }

    /// Register a channel config.
    #[wasm_bindgen]
    pub fn register_channel(&mut self, config_json: &str) -> Result<(), JsValue> {
        let config: ChannelConfig = serde_json::from_str(config_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid config: {e}")))?;
        self.inner.register_channel(config);
        Ok(())
    }

    /// Get all active routes as JSON.
    #[wasm_bindgen]
    pub fn active_routes(&self) -> String {
        let routes: Vec<&ChannelRoute> = self.inner.active_routes();
        serde_json::to_string(&routes).unwrap_or_default()
    }

    /// Export state.
    #[wasm_bindgen]
    pub fn export_state(&self) -> String {
        self.inner.to_json()
    }

    /// Import state.
    #[wasm_bindgen]
    pub fn import_state(&mut self, json: &str) -> Result<(), JsValue> {
        self.inner = ChannelRouter::from_json(json).map_err(|e| JsValue::from_str(&e))?;
        Ok(())
    }
}
