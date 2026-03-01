//! Messaging Channels — Unified message normalization and routing.
//!
//! Adapts IronClaw's approach: channels as WASM tools with unified message format.
//! All channel-specific logic is in the TypeScript bridge; this module handles:
//!
//! - Message normalization (unified `ChannelMessage` struct)
//! - Channel routing (which agent session handles which channel)
//! - Message → agent input conversion
//! - Agent output → channel-specific formatting
//!
//! # Supported Channels
//!
//! | Channel  | Transport              | Client-Side? |
//! |----------|------------------------|--------------|
//! | Telegram | Bot API HTTP polling    | ✅ Yes       |
//! | Discord  | Bot Gateway WebSocket   | ✅ Yes       |
//! | Slack    | Socket Mode WebSocket   | ✅ Yes       |
//! | WhatsApp | User-deployed relay     | ⚠️ Relay     |

pub mod types;
pub mod router;
