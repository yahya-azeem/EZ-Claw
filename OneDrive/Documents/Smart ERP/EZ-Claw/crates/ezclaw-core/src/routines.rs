//! Routines Engine — Cron scheduling, event triggers, and heartbeat system.
//!
//! Adapted from IronClaw's routines engine for browser execution.
//! Uses browser APIs (setInterval, Service Worker) for scheduling.
//!
//! # Features
//! - Cron expression parsing (standard 5-field + extensions)
//! - Event-driven triggers
//! - Heartbeat monitoring (proactive agent tasks)
//! - Persistent routine state (survives page refresh via localStorage)

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

/// Routine trigger type.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum TriggerType {
    /// Cron schedule (e.g., "*/5 * * * *" = every 5 minutes).
    Cron,
    /// Event-driven (e.g., "channel.message", "workspace.file_changed").
    Event,
    /// Webhook (external HTTP trigger).
    Webhook,
    /// Interval (simple repeat, e.g., every 30 seconds).
    Interval,
    /// One-time delayed execution.
    Once,
}

/// A routine definition.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Routine {
    /// Unique routine ID.
    pub id: String,
    /// Human-readable name.
    pub name: String,
    /// Description of what this routine does.
    pub description: String,
    /// Trigger configuration.
    pub trigger: RoutineTrigger,
    /// Actions to perform (as agent instructions).
    pub instructions: String,
    /// Whether this routine is enabled.
    pub enabled: bool,
    /// Created timestamp.
    pub created_at: String,
    /// Last execution timestamp.
    pub last_run: Option<String>,
    /// Next scheduled execution.
    pub next_run: Option<String>,
    /// Execution count.
    pub run_count: u64,
    /// Max executions (None = unlimited).
    pub max_runs: Option<u64>,
}

/// Trigger configuration.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutineTrigger {
    pub trigger_type: TriggerType,
    /// Cron expression or event name.
    pub expression: String,
    /// Interval in seconds (for Interval type).
    pub interval_secs: Option<u64>,
    /// Delay in seconds (for Once type).
    pub delay_secs: Option<u64>,
}

/// Heartbeat configuration — proactive agent monitoring.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartbeatConfig {
    pub enabled: bool,
    /// Interval in seconds between heartbeats.
    pub interval_secs: u64,
    /// Tasks the agent should check on each heartbeat.
    pub checks: Vec<HeartbeatCheck>,
}

/// A heartbeat check — something the agent proactively monitors.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeartbeatCheck {
    pub id: String,
    pub name: String,
    /// Agent instructions for this check.
    pub instructions: String,
    /// Whether to notify user on findings.
    pub notify_on_findings: bool,
    pub enabled: bool,
}

/// Parsed cron expression.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CronExpression {
    pub minutes: Vec<u8>,     // 0-59
    pub hours: Vec<u8>,       // 0-23
    pub days_of_month: Vec<u8>, // 1-31
    pub months: Vec<u8>,      // 1-12
    pub days_of_week: Vec<u8>, // 0-6 (Sun=0)
}

impl CronExpression {
    /// Parse a standard 5-field cron expression.
    pub fn parse(expr: &str) -> Result<Self, String> {
        let parts: Vec<&str> = expr.trim().split_whitespace().collect();
        if parts.len() != 5 {
            return Err(format!("Expected 5 fields, got {}", parts.len()));
        }

        Ok(Self {
            minutes: Self::parse_field(parts[0], 0, 59)?,
            hours: Self::parse_field(parts[1], 0, 23)?,
            days_of_month: Self::parse_field(parts[2], 1, 31)?,
            months: Self::parse_field(parts[3], 1, 12)?,
            days_of_week: Self::parse_field(parts[4], 0, 6)?,
        })
    }

    fn parse_field(field: &str, min: u8, max: u8) -> Result<Vec<u8>, String> {
        if field == "*" {
            return Ok((min..=max).collect());
        }

        let mut values = Vec::new();

        for part in field.split(',') {
            if part.contains('/') {
                // Step: */5 or 1-10/2
                let step_parts: Vec<&str> = part.split('/').collect();
                let step: u8 = step_parts[1].parse().map_err(|_| format!("Invalid step: {}", step_parts[1]))?;
                let (start, end) = if step_parts[0] == "*" {
                    (min, max)
                } else if step_parts[0].contains('-') {
                    let range: Vec<&str> = step_parts[0].split('-').collect();
                    let s: u8 = range[0].parse().map_err(|_| "Invalid range start".to_string())?;
                    let e: u8 = range[1].parse().map_err(|_| "Invalid range end".to_string())?;
                    (s, e)
                } else {
                    let s: u8 = step_parts[0].parse().map_err(|_| "Invalid start".to_string())?;
                    (s, max)
                };
                let mut v = start;
                while v <= end {
                    values.push(v);
                    v += step;
                }
            } else if part.contains('-') {
                // Range: 1-5
                let range: Vec<&str> = part.split('-').collect();
                let start: u8 = range[0].parse().map_err(|_| "Invalid range start".to_string())?;
                let end: u8 = range[1].parse().map_err(|_| "Invalid range end".to_string())?;
                values.extend(start..=end);
            } else {
                // Single value
                let v: u8 = part.parse().map_err(|_| format!("Invalid value: {part}"))?;
                values.push(v);
            }
        }

        // Clamp and deduplicate
        values.sort();
        values.dedup();
        values.retain(|v| *v >= min && *v <= max);

        Ok(values)
    }

    /// Check if the cron matches the given minute, hour, day, month, weekday.
    pub fn matches(&self, minute: u8, hour: u8, day: u8, month: u8, weekday: u8) -> bool {
        self.minutes.contains(&minute)
            && self.hours.contains(&hour)
            && self.days_of_month.contains(&day)
            && self.months.contains(&month)
            && self.days_of_week.contains(&weekday)
    }
}

/// Routines Engine — manages all routines and heartbeats.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RoutinesEngine {
    routines: HashMap<String, Routine>,
    heartbeat: HeartbeatConfig,
    /// Event subscriptions: event_name → Vec<routine_id>.
    event_subscriptions: HashMap<String, Vec<String>>,
}

impl RoutinesEngine {
    pub fn new() -> Self {
        Self {
            routines: HashMap::new(),
            heartbeat: HeartbeatConfig {
                enabled: false,
                interval_secs: 300, // 5 minutes default
                checks: vec![],
            },
            event_subscriptions: HashMap::new(),
        }
    }

    /// Register a new routine.
    pub fn add_routine(&mut self, routine: Routine) -> Result<(), String> {
        // Validate cron expression if applicable
        if routine.trigger.trigger_type == TriggerType::Cron {
            CronExpression::parse(&routine.trigger.expression)?;
        }

        let id = routine.id.clone();

        // Subscribe to events if event-triggered
        if routine.trigger.trigger_type == TriggerType::Event {
            let event_name = routine.trigger.expression.clone();
            self.event_subscriptions
                .entry(event_name)
                .or_default()
                .push(id.clone());
        }

        self.routines.insert(id, routine);
        Ok(())
    }

    /// Remove a routine.
    pub fn remove_routine(&mut self, id: &str) -> bool {
        if let Some(routine) = self.routines.remove(id) {
            // Clean up event subscriptions
            if routine.trigger.trigger_type == TriggerType::Event {
                if let Some(subs) = self.event_subscriptions.get_mut(&routine.trigger.expression) {
                    subs.retain(|s| s != id);
                }
            }
            true
        } else {
            false
        }
    }

    /// Enable/disable a routine.
    pub fn set_enabled(&mut self, id: &str, enabled: bool) -> bool {
        if let Some(routine) = self.routines.get_mut(id) {
            routine.enabled = enabled;
            true
        } else {
            false
        }
    }

    /// Get routines that should fire for the given time (minute, hour, day, month, weekday).
    pub fn check_cron_triggers(&self, minute: u8, hour: u8, day: u8, month: u8, weekday: u8) -> Vec<&Routine> {
        self.routines.values()
            .filter(|r| {
                r.enabled
                    && r.trigger.trigger_type == TriggerType::Cron
                    && r.max_runs.map_or(true, |max| r.run_count < max)
            })
            .filter(|r| {
                CronExpression::parse(&r.trigger.expression)
                    .map(|cron| cron.matches(minute, hour, day, month, weekday))
                    .unwrap_or(false)
            })
            .collect()
    }

    /// Get routines subscribed to a specific event.
    pub fn get_event_routines(&self, event_name: &str) -> Vec<&Routine> {
        self.event_subscriptions.get(event_name)
            .map(|ids| {
                ids.iter()
                    .filter_map(|id| self.routines.get(id))
                    .filter(|r| r.enabled)
                    .collect()
            })
            .unwrap_or_default()
    }

    /// Mark a routine as executed.
    pub fn mark_executed(&mut self, id: &str, timestamp: &str) {
        if let Some(routine) = self.routines.get_mut(id) {
            routine.last_run = Some(timestamp.to_string());
            routine.run_count += 1;
        }
    }

    /// List all routines.
    pub fn list_routines(&self) -> Vec<&Routine> {
        self.routines.values().collect()
    }

    /// Get heartbeat config.
    pub fn heartbeat(&self) -> &HeartbeatConfig {
        &self.heartbeat
    }

    /// Set heartbeat config.
    pub fn set_heartbeat(&mut self, config: HeartbeatConfig) {
        self.heartbeat = config;
    }

    /// Export state as JSON.
    pub fn to_json(&self) -> String {
        serde_json::to_string(self).unwrap_or_default()
    }

    /// Import state from JSON.
    pub fn from_json(json: &str) -> Result<Self, String> {
        serde_json::from_str(json).map_err(|e| format!("Invalid routines state: {e}"))
    }
}

// ── WASM Bindings ────────────────────────────────────────────────

#[wasm_bindgen]
pub struct WasmRoutinesEngine {
    inner: RoutinesEngine,
}

#[wasm_bindgen]
impl WasmRoutinesEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: RoutinesEngine::new(),
        }
    }

    /// Add a routine from JSON.
    #[wasm_bindgen]
    pub fn add_routine(&mut self, routine_json: &str) -> Result<(), JsValue> {
        let routine: Routine = serde_json::from_str(routine_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid routine: {e}")))?;
        self.inner.add_routine(routine)
            .map_err(|e| JsValue::from_str(&e))
    }

    /// Remove a routine.
    #[wasm_bindgen]
    pub fn remove_routine(&mut self, id: &str) -> bool {
        self.inner.remove_routine(id)
    }

    /// Enable/disable a routine.
    #[wasm_bindgen]
    pub fn set_enabled(&mut self, id: &str, enabled: bool) -> bool {
        self.inner.set_enabled(id, enabled)
    }

    /// Check cron triggers for the given time.
    #[wasm_bindgen]
    pub fn check_cron_triggers(&self, minute: u8, hour: u8, day: u8, month: u8, weekday: u8) -> String {
        let routines = self.inner.check_cron_triggers(minute, hour, day, month, weekday);
        serde_json::to_string(&routines).unwrap_or_default()
    }

    /// Get events triggered by a specific event.
    #[wasm_bindgen]
    pub fn get_event_routines(&self, event_name: &str) -> String {
        let routines = self.inner.get_event_routines(event_name);
        serde_json::to_string(&routines).unwrap_or_default()
    }

    /// Mark a routine as executed.
    #[wasm_bindgen]
    pub fn mark_executed(&mut self, id: &str, timestamp: &str) {
        self.inner.mark_executed(id, timestamp);
    }

    /// List all routines.
    #[wasm_bindgen]
    pub fn list_routines(&self) -> String {
        let routines = self.inner.list_routines();
        serde_json::to_string(&routines).unwrap_or_default()
    }

    /// Set heartbeat config from JSON.
    #[wasm_bindgen]
    pub fn set_heartbeat(&mut self, config_json: &str) -> Result<(), JsValue> {
        let config: HeartbeatConfig = serde_json::from_str(config_json)
            .map_err(|e| JsValue::from_str(&format!("Invalid heartbeat config: {e}")))?;
        self.inner.set_heartbeat(config);
        Ok(())
    }

    /// Get heartbeat config.
    #[wasm_bindgen]
    pub fn get_heartbeat(&self) -> String {
        serde_json::to_string(self.inner.heartbeat()).unwrap_or_default()
    }

    /// Parse and validate a cron expression.
    #[wasm_bindgen]
    pub fn validate_cron(expression: &str) -> Result<String, JsValue> {
        let cron = CronExpression::parse(expression)
            .map_err(|e| JsValue::from_str(&format!("Invalid cron: {e}")))?;
        serde_json::to_string(&cron)
            .map_err(|e| JsValue::from_str(&format!("Serialize error: {e}")))
    }

    /// Export full state.
    #[wasm_bindgen]
    pub fn export_state(&self) -> String {
        self.inner.to_json()
    }

    /// Import state.
    #[wasm_bindgen]
    pub fn import_state(&mut self, json: &str) -> Result<(), JsValue> {
        self.inner = RoutinesEngine::from_json(json)
            .map_err(|e| JsValue::from_str(&e))?;
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_simple_cron() {
        let cron = CronExpression::parse("*/5 * * * *").unwrap();
        assert!(cron.minutes.contains(&0));
        assert!(cron.minutes.contains(&5));
        assert!(cron.minutes.contains(&10));
        assert!(!cron.minutes.contains(&3));
    }

    #[test]
    fn cron_range() {
        let cron = CronExpression::parse("1-5 9-17 * * 1-5").unwrap();
        assert_eq!(cron.minutes, vec![1, 2, 3, 4, 5]);
        assert_eq!(cron.hours, vec![9, 10, 11, 12, 13, 14, 15, 16, 17]);
        assert_eq!(cron.days_of_week, vec![1, 2, 3, 4, 5]);
    }

    #[test]
    fn cron_matches_time() {
        let cron = CronExpression::parse("30 9 * * *").unwrap();
        assert!(cron.matches(30, 9, 15, 6, 3));
        assert!(!cron.matches(31, 9, 15, 6, 3));
        assert!(!cron.matches(30, 10, 15, 6, 3));
    }

    #[test]
    fn add_and_list_routines() {
        let mut engine = RoutinesEngine::new();
        let routine = Routine {
            id: "test-1".into(),
            name: "Test Routine".into(),
            description: "A test".into(),
            trigger: RoutineTrigger {
                trigger_type: TriggerType::Cron,
                expression: "*/5 * * * *".into(),
                interval_secs: None,
                delay_secs: None,
            },
            instructions: "Check the weather".into(),
            enabled: true,
            created_at: "2024-01-01".into(),
            last_run: None,
            next_run: None,
            run_count: 0,
            max_runs: None,
        };
        engine.add_routine(routine).unwrap();
        assert_eq!(engine.list_routines().len(), 1);
    }
}
