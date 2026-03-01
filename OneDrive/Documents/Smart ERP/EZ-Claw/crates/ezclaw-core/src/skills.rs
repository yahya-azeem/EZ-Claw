//! Skills Engine — adapted from IronClaw trust gating + OpenClaw skill format.
//!
//! Skills are composable knowledge packs that extend the agent's capabilities.
//! Each skill is a `SKILL.md` file (OpenClaw format) with IronClaw security:
//!
//! - **Trust Levels**: Trusted → Verified → Untrusted (affects sandbox policy)
//! - **Activation**: Keyword, pattern, or tag-based auto-matching
//! - **Precedence**: Bundled → Managed → Workspace
//! - **Attenuation**: Trust degrades over nested skill calls (IronClaw feature)
//!
//! ```text
//! SKILL.md Format (OpenClaw-compatible):
//! ---
//! name: skill_name
//! description: what this skill does
//! version: 1.0.0
//! tags: [tag1, tag2]
//! activation_keywords: [keyword1, keyword2]
//! trust: trusted | verified | untrusted
//! required_tools: [web_search, read_file]
//! ---
//! <system prompt content>
//! ```

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// ── Core Types ───────────────────────────────────────────────────

/// Trust level for skills (from IronClaw).
/// Higher trust = more sandbox permissions.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum TrustLevel {
    /// Full trust — bundled skills, no restrictions.
    Trusted,
    /// Verified — user installed, standard restrictions.
    Verified,
    /// Untrusted — from agent or external, maximum restrictions.
    Untrusted,
}

impl Default for TrustLevel {
    fn default() -> Self {
        TrustLevel::Untrusted
    }
}

/// Where a skill comes from (determines precedence).
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SkillSource {
    /// Built into EZ-Claw (highest precedence).
    Bundled,
    /// Installed by user from a registry.
    Managed,
    /// Created in workspace (agent-authored or user-written).
    Workspace,
}

impl Default for SkillSource {
    fn default() -> Self {
        SkillSource::Workspace
    }
}

/// Activation criteria — when to auto-activate a skill.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivationCriteria {
    /// Keywords that trigger activation.
    pub keywords: Vec<String>,
    /// Regex patterns for activation.
    pub patterns: Vec<String>,
    /// Tags for categorization and matching.
    pub tags: Vec<String>,
}

impl Default for ActivationCriteria {
    fn default() -> Self {
        Self {
            keywords: Vec::new(),
            patterns: Vec::new(),
            tags: Vec::new(),
        }
    }
}

/// A skill definition.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Skill {
    /// Unique skill name (kebab-case).
    pub name: String,
    /// Human-readable description.
    pub description: String,
    /// Semantic version.
    pub version: String,
    /// Trust level (IronClaw).
    pub trust: TrustLevel,
    /// Where this skill came from.
    pub source: SkillSource,
    /// Tools required by this skill.
    pub required_tools: Vec<String>,
    /// Activation criteria (IronClaw).
    pub activation: ActivationCriteria,
    /// System prompt content (the actual skill instructions).
    pub prompt: String,
    /// Whether this skill is currently enabled.
    pub enabled: bool,
}

impl Default for Skill {
    fn default() -> Self {
        Self {
            name: String::new(),
            description: String::new(),
            version: "1.0.0".into(),
            trust: TrustLevel::default(),
            source: SkillSource::default(),
            required_tools: Vec::new(),
            activation: ActivationCriteria::default(),
            prompt: String::new(),
            enabled: true,
        }
    }
}

// ── SKILL.md Parser ──────────────────────────────────────────────

/// Parse a SKILL.md file (OpenClaw format with YAML frontmatter).
pub fn parse_skill_md(content: &str) -> Result<Skill, String> {
    let content = content.trim();

    // Check for YAML frontmatter
    if !content.starts_with("---") {
        return Err("SKILL.md must start with YAML frontmatter (---)".into());
    }

    let rest = &content[3..];
    let end = rest.find("---").ok_or("Missing closing --- for frontmatter")?;
    let frontmatter = &rest[..end].trim();
    let prompt = rest[end + 3..].trim().to_string();

    // Parse YAML-like frontmatter (simple key: value pairs)
    let mut skill = Skill::default();
    skill.prompt = prompt;

    for line in frontmatter.lines() {
        let line = line.trim();
        if line.is_empty() || line.starts_with('#') {
            continue;
        }

        if let Some((key, value)) = line.split_once(':') {
            let key = key.trim();
            let value = value.trim();

            match key {
                "name" => skill.name = value.to_string(),
                "description" => skill.description = value.to_string(),
                "version" => skill.version = value.to_string(),
                "trust" => {
                    skill.trust = match value.to_lowercase().as_str() {
                        "trusted" => TrustLevel::Trusted,
                        "verified" => TrustLevel::Verified,
                        _ => TrustLevel::Untrusted,
                    };
                }
                "tags" => {
                    skill.activation.tags = parse_yaml_array(value);
                }
                "activation_keywords" => {
                    skill.activation.keywords = parse_yaml_array(value);
                }
                "activation_patterns" => {
                    skill.activation.patterns = parse_yaml_array(value);
                }
                "required_tools" => {
                    skill.required_tools = parse_yaml_array(value);
                }
                "enabled" => {
                    skill.enabled = value != "false";
                }
                _ => {} // Ignore unknown keys
            }
        }
    }

    if skill.name.is_empty() {
        return Err("Skill must have a 'name' field".into());
    }

    Ok(skill)
}

/// Simple YAML array parser: [item1, item2, item3]
fn parse_yaml_array(value: &str) -> Vec<String> {
    let value = value.trim();
    if value.starts_with('[') && value.ends_with(']') {
        value[1..value.len() - 1]
            .split(',')
            .map(|s| s.trim().trim_matches('"').trim_matches('\'').to_string())
            .filter(|s| !s.is_empty())
            .collect()
    } else {
        vec![value.to_string()]
    }
}

/// Serialize a skill back to SKILL.md format.
pub fn skill_to_md(skill: &Skill) -> String {
    let tags = if skill.activation.tags.is_empty() {
        "[]".into()
    } else {
        format!("[{}]", skill.activation.tags.join(", "))
    };

    let keywords = if skill.activation.keywords.is_empty() {
        "[]".into()
    } else {
        format!("[{}]", skill.activation.keywords.join(", "))
    };

    let tools = if skill.required_tools.is_empty() {
        "[]".into()
    } else {
        format!("[{}]", skill.required_tools.join(", "))
    };

    let trust = match skill.trust {
        TrustLevel::Trusted => "trusted",
        TrustLevel::Verified => "verified",
        TrustLevel::Untrusted => "untrusted",
    };

    format!(
        "---\nname: {}\ndescription: {}\nversion: {}\ntrust: {}\ntags: {}\nactivation_keywords: {}\nrequired_tools: {}\n---\n{}",
        skill.name, skill.description, skill.version, trust, tags, keywords, tools, skill.prompt
    )
}

// ── Skill Registry ───────────────────────────────────────────────

/// The skill registry — manages all loaded skills.
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct SkillRegistry {
    skills: Vec<Skill>,
    /// IronClaw trust attenuation depth (nesting level).
    attenuation_depth: u32,
}

impl SkillRegistry {
    pub fn new() -> Self {
        Self::default()
    }

    /// Register a skill from SKILL.md content.
    pub fn register_from_md(&mut self, content: &str, source: SkillSource) -> Result<String, String> {
        let mut skill = parse_skill_md(content)?;
        skill.source = source;

        // Check for duplicates
        if let Some(existing) = self.skills.iter().position(|s| s.name == skill.name) {
            // Higher precedence replaces lower
            let existing_source = &self.skills[existing].source;
            if source_precedence(&skill.source) >= source_precedence(existing_source) {
                self.skills[existing] = skill.clone();
                return Ok(format!("Updated skill: {}", skill.name));
            } else {
                return Err(format!(
                    "Skill '{}' already exists with higher precedence",
                    skill.name
                ));
            }
        }

        let name = skill.name.clone();
        self.skills.push(skill);
        Ok(format!("Registered skill: {}", name))
    }

    /// Register a skill directly.
    pub fn register(&mut self, skill: Skill) {
        if let Some(existing) = self.skills.iter().position(|s| s.name == skill.name) {
            self.skills[existing] = skill;
        } else {
            self.skills.push(skill);
        }
    }

    /// Remove a skill by name.
    pub fn unregister(&mut self, name: &str) -> bool {
        let before = self.skills.len();
        self.skills.retain(|s| s.name != name);
        self.skills.len() < before
    }

    /// Find skills matching a user message (activation matching).
    pub fn find_matching(&self, message: &str) -> Vec<&Skill> {
        let msg_lower = message.to_lowercase();
        let mut matches: Vec<(&Skill, u32)> = Vec::new();

        for skill in &self.skills {
            if !skill.enabled {
                continue;
            }

            let mut score = 0u32;

            // Keyword matching
            for keyword in &skill.activation.keywords {
                if msg_lower.contains(&keyword.to_lowercase()) {
                    score += 10;
                }
            }

            // Tag matching (lower weight)
            for tag in &skill.activation.tags {
                if msg_lower.contains(&tag.to_lowercase()) {
                    score += 5;
                }
            }

            if score > 0 {
                matches.push((skill, score));
            }
        }

        // Sort by score (highest first), then by source precedence
        matches.sort_by(|a, b| {
            b.1.cmp(&a.1)
                .then_with(|| {
                    source_precedence(&b.0.source).cmp(&source_precedence(&a.0.source))
                })
        });

        matches.into_iter().map(|(s, _)| s).collect()
    }

    /// Get effective trust level with IronClaw attenuation.
    /// Trust degrades each level of nesting: Trusted → Verified → Untrusted.
    pub fn attenuated_trust(&self, base_trust: TrustLevel) -> TrustLevel {
        match self.attenuation_depth {
            0 => base_trust,
            1 => match base_trust {
                TrustLevel::Trusted => TrustLevel::Verified,
                _ => TrustLevel::Untrusted,
            },
            _ => TrustLevel::Untrusted,
        }
    }

    /// Push attenuation depth (entering nested skill).
    pub fn enter_nested(&mut self) {
        self.attenuation_depth += 1;
    }

    /// Pop attenuation depth (leaving nested skill).
    pub fn leave_nested(&mut self) {
        self.attenuation_depth = self.attenuation_depth.saturating_sub(1);
    }

    /// Get all skills.
    pub fn all(&self) -> &[Skill] {
        &self.skills
    }

    /// Get enabled skills.
    pub fn enabled(&self) -> Vec<&Skill> {
        self.skills.iter().filter(|s| s.enabled).collect()
    }

    /// Build combined system prompt from matched skills.
    pub fn build_skill_prompt(&self, matched: &[&Skill]) -> String {
        if matched.is_empty() {
            return String::new();
        }

        let mut prompt = String::from("\n<active_skills>\n");
        for skill in matched {
            prompt.push_str(&format!(
                "\n## Skill: {} (trust: {:?})\n{}\n",
                skill.name, skill.trust, skill.prompt
            ));
        }
        prompt.push_str("</active_skills>\n");
        prompt
    }

    /// Export registry as JSON.
    pub fn export(&self) -> String {
        serde_json::to_string(&self.skills).unwrap_or_default()
    }

    /// Import registry from JSON.
    pub fn import(&mut self, json: &str) -> Result<usize, String> {
        let skills: Vec<Skill> = serde_json::from_str(json)
            .map_err(|e| format!("Invalid skills JSON: {}", e))?;
        let count = skills.len();
        self.skills = skills;
        Ok(count)
    }
}

fn source_precedence(source: &SkillSource) -> u32 {
    match source {
        SkillSource::Bundled => 3,
        SkillSource::Managed => 2,
        SkillSource::Workspace => 1,
    }
}

// ── Built-in Skills ──────────────────────────────────────────────

/// Get built-in skills bundled with EZ-Claw.
pub fn builtin_skills() -> Vec<Skill> {
    vec![
        Skill {
            name: "web-research".into(),
            description: "Search the web and summarize findings".into(),
            version: "1.0.0".into(),
            trust: TrustLevel::Trusted,
            source: SkillSource::Bundled,
            required_tools: vec!["web_search".into(), "web_fetch".into()],
            activation: ActivationCriteria {
                keywords: vec!["search".into(), "find".into(), "look up".into(), "research".into()],
                patterns: Vec::new(),
                tags: vec!["search".into(), "web".into(), "research".into()],
            },
            prompt: "When the user asks you to search or research something:\n\
                1. Use web_search to find relevant results\n\
                2. Use web_fetch to read promising pages\n\
                3. Synthesize the information into a clear, cited summary\n\
                4. Include source URLs for verification".into(),
            enabled: true,
        },
        Skill {
            name: "code-assistant".into(),
            description: "Write, review, and debug code".into(),
            version: "1.0.0".into(),
            trust: TrustLevel::Trusted,
            source: SkillSource::Bundled,
            required_tools: vec!["read_file".into(), "write_file".into(), "list_dir".into()],
            activation: ActivationCriteria {
                keywords: vec!["code".into(), "program".into(), "debug".into(), "function".into(), "class".into()],
                patterns: Vec::new(),
                tags: vec!["coding".into(), "programming".into(), "development".into()],
            },
            prompt: "When helping with code:\n\
                1. Read existing files for context when needed\n\
                2. Write clean, well-documented code\n\
                3. Follow the project's existing style and conventions\n\
                4. Explain your changes and reasoning".into(),
            enabled: true,
        },
        Skill {
            name: "note-taker".into(),
            description: "Take and organize notes in the workspace".into(),
            version: "1.0.0".into(),
            trust: TrustLevel::Trusted,
            source: SkillSource::Bundled,
            required_tools: vec!["write_file".into(), "read_file".into(), "list_dir".into(), "memory_store".into()],
            activation: ActivationCriteria {
                keywords: vec!["note".into(), "remember".into(), "save".into(), "write down".into()],
                patterns: Vec::new(),
                tags: vec!["notes".into(), "memory".into(), "organization".into()],
            },
            prompt: "When the user asks you to take notes or remember something:\n\
                1. Store important facts using memory_store\n\
                2. Create organized note files in /notes/ directory\n\
                3. Use clear, searchable titles and categories\n\
                4. Confirm what was saved".into(),
            enabled: true,
        },
    ]
}

// ── WASM Bindings ────────────────────────────────────────────────

#[wasm_bindgen]
pub struct WasmSkillRegistry {
    inner: SkillRegistry,
}

#[wasm_bindgen]
impl WasmSkillRegistry {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        let mut registry = SkillRegistry::new();
        // Load built-in skills
        for skill in builtin_skills() {
            registry.register(skill);
        }
        Self { inner: registry }
    }

    /// Register a skill from SKILL.md content. Returns result message.
    #[wasm_bindgen]
    pub fn register_skill(&mut self, content: &str, source: &str) -> Result<String, JsValue> {
        let source = match source {
            "bundled" => SkillSource::Bundled,
            "managed" => SkillSource::Managed,
            _ => SkillSource::Workspace,
        };
        self.inner
            .register_from_md(content, source)
            .map_err(|e| JsValue::from_str(&e))
    }

    /// Remove a skill by name.
    #[wasm_bindgen]
    pub fn unregister_skill(&mut self, name: &str) -> bool {
        self.inner.unregister(name)
    }

    /// Find matching skills for a message. Returns JSON array of skill names.
    #[wasm_bindgen]
    pub fn find_matching(&self, message: &str) -> String {
        let matched = self.inner.find_matching(message);
        let names: Vec<&str> = matched.iter().map(|s| s.name.as_str()).collect();
        serde_json::to_string(&names).unwrap_or_default()
    }

    /// Build combined prompt from matched skills. Returns prompt string.
    #[wasm_bindgen]
    pub fn build_prompt(&self, message: &str) -> String {
        let matched = self.inner.find_matching(message);
        self.inner.build_skill_prompt(&matched)
    }

    /// List all skills as JSON.
    #[wasm_bindgen]
    pub fn list_skills(&self) -> String {
        self.inner.export()
    }

    /// Enable/disable a skill.
    #[wasm_bindgen]
    pub fn set_enabled(&mut self, name: &str, enabled: bool) -> bool {
        if let Some(skill) = self.inner.skills.iter_mut().find(|s| s.name == name) {
            skill.enabled = enabled;
            true
        } else {
            false
        }
    }

    /// Get skill count.
    #[wasm_bindgen]
    pub fn count(&self) -> usize {
        self.inner.skills.len()
    }

    /// Export all skills as JSON for persistence.
    #[wasm_bindgen]
    pub fn export(&self) -> String {
        self.inner.export()
    }

    /// Import skills from JSON.
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

    const TEST_SKILL_MD: &str = r#"---
name: test-skill
description: A test skill
version: 1.0.0
trust: verified
tags: [testing, debug]
activation_keywords: [test, check]
required_tools: [read_file]
---
You are a testing assistant. Help debug and test code."#;

    #[test]
    fn parse_skill_md_basic() {
        let skill = parse_skill_md(TEST_SKILL_MD).unwrap();
        assert_eq!(skill.name, "test-skill");
        assert_eq!(skill.trust, TrustLevel::Verified);
        assert_eq!(skill.activation.tags, vec!["testing", "debug"]);
        assert_eq!(skill.activation.keywords, vec!["test", "check"]);
        assert_eq!(skill.required_tools, vec!["read_file"]);
        assert!(skill.prompt.contains("testing assistant"));
    }

    #[test]
    fn skill_md_roundtrip() {
        let skill = parse_skill_md(TEST_SKILL_MD).unwrap();
        let md = skill_to_md(&skill);
        let parsed_back = parse_skill_md(&md).unwrap();
        assert_eq!(skill.name, parsed_back.name);
        assert_eq!(skill.trust, parsed_back.trust);
    }

    #[test]
    fn registry_activation_matching() {
        let mut registry = SkillRegistry::new();
        for skill in builtin_skills() {
            registry.register(skill);
        }

        let matches = registry.find_matching("Search the web for Rust tutorials");
        assert!(!matches.is_empty());
        assert_eq!(matches[0].name, "web-research");
    }

    #[test]
    fn trust_attenuation() {
        let mut registry = SkillRegistry::new();
        assert_eq!(registry.attenuated_trust(TrustLevel::Trusted), TrustLevel::Trusted);

        registry.enter_nested();
        assert_eq!(registry.attenuated_trust(TrustLevel::Trusted), TrustLevel::Verified);

        registry.enter_nested();
        assert_eq!(registry.attenuated_trust(TrustLevel::Trusted), TrustLevel::Untrusted);

        registry.leave_nested();
        assert_eq!(registry.attenuated_trust(TrustLevel::Trusted), TrustLevel::Verified);
    }

    #[test]
    fn source_precedence_ordering() {
        let mut registry = SkillRegistry::new();

        let mut workspace_skill = parse_skill_md(TEST_SKILL_MD).unwrap();
        workspace_skill.source = SkillSource::Workspace;
        workspace_skill.prompt = "workspace version".into();
        registry.register(workspace_skill);

        // Bundled should override workspace
        let result = registry.register_from_md(TEST_SKILL_MD, SkillSource::Bundled);
        assert!(result.is_ok());
        assert_eq!(registry.all()[0].source, SkillSource::Bundled);
    }
}
