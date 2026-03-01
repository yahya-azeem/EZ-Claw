//! Identity system — adapted from ZeroClaw's `identity.rs`.
//!
//! Preserves ZeroClaw's exact AIEOS (AI Entity Object Specification)
//! structures and the OpenClaw markdown identity format. Converts
//! AIEOS v1.1 JSON to system prompt format using the same normalization
//! pipeline as ZeroClaw.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fmt::Write;
use wasm_bindgen::prelude::*;

// ── AIEOS types (from ZeroClaw identity.rs) ──────────────────────

/// AIEOS v1.1 identity structure (from ZeroClaw).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AieosIdentity {
    #[serde(default)]
    pub identity: Option<IdentitySectionData>,
    #[serde(default)]
    pub psychology: Option<PsychologySection>,
    #[serde(default)]
    pub linguistics: Option<LinguisticsSection>,
    #[serde(default)]
    pub motivations: Option<MotivationsSection>,
    #[serde(default)]
    pub capabilities: Option<CapabilitiesSection>,
    #[serde(default)]
    pub physicality: Option<PhysicalitySection>,
    #[serde(default)]
    pub history: Option<HistorySection>,
    #[serde(default)]
    pub interests: Option<InterestsSection>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct IdentitySectionData {
    #[serde(default)]
    pub names: Option<Names>,
    #[serde(default)]
    pub bio: Option<String>,
    #[serde(default)]
    pub origin: Option<String>,
    #[serde(default)]
    pub residence: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct Names {
    #[serde(default)]
    pub first: Option<String>,
    #[serde(default)]
    pub last: Option<String>,
    #[serde(default)]
    pub nickname: Option<String>,
    #[serde(default)]
    pub full: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PsychologySection {
    #[serde(default)]
    pub neural_matrix: Option<HashMap<String, f64>>,
    #[serde(default)]
    pub mbti: Option<String>,
    #[serde(default)]
    pub ocean: Option<OceanTraits>,
    #[serde(default)]
    pub moral_compass: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct OceanTraits {
    #[serde(default)]
    pub openness: Option<f64>,
    #[serde(default)]
    pub conscientiousness: Option<f64>,
    #[serde(default)]
    pub extraversion: Option<f64>,
    #[serde(default)]
    pub agreeableness: Option<f64>,
    #[serde(default)]
    pub neuroticism: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct LinguisticsSection {
    #[serde(default)]
    pub style: Option<String>,
    #[serde(default)]
    pub formality: Option<String>,
    #[serde(default)]
    pub catchphrases: Option<Vec<String>>,
    #[serde(default)]
    pub forbidden_words: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct MotivationsSection {
    #[serde(default)]
    pub core_drive: Option<String>,
    #[serde(default)]
    pub short_term_goals: Option<Vec<String>>,
    #[serde(default)]
    pub long_term_goals: Option<Vec<String>>,
    #[serde(default)]
    pub fears: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct CapabilitiesSection {
    #[serde(default)]
    pub skills: Option<Vec<String>>,
    #[serde(default)]
    pub tools: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct PhysicalitySection {
    #[serde(default)]
    pub appearance: Option<String>,
    #[serde(default)]
    pub avatar_description: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct HistorySection {
    #[serde(default)]
    pub origin_story: Option<String>,
    #[serde(default)]
    pub education: Option<Vec<String>>,
    #[serde(default)]
    pub occupation: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct InterestsSection {
    #[serde(default)]
    pub hobbies: Option<Vec<String>>,
    #[serde(default)]
    pub favorites: Option<HashMap<String, String>>,
    #[serde(default)]
    pub lifestyle: Option<String>,
}

// ── Identity format detection (from ZeroClaw) ────────────────────

pub fn is_aieos_configured(format: &str) -> bool {
    format.eq_ignore_ascii_case("aieos")
}

/// Generate default AIEOS JSON (from ZeroClaw).
pub fn generate_default_aieos_json(agent_name: &str, user_name: &str) -> String {
    let resolved_agent = if agent_name.trim().is_empty() {
        "EZ-Claw"
    } else {
        agent_name.trim()
    };
    let resolved_user = if user_name.trim().is_empty() {
        "User"
    } else {
        user_name.trim()
    };

    serde_json::json!({
        "identity": {
            "names": {
                "first": resolved_agent,
                "full": resolved_agent
            },
            "bio": format!(
                "{resolved_agent} is a ZeroClaw-powered assistant running in the browser via WebAssembly, \
                 focused on helping {resolved_user} get work done efficiently."
            ),
            "origin": "ZeroClaw / EZ-Claw",
            "residence": "Browser"
        },
        "linguistics": {
            "style": "clear, direct, and practical",
            "formality": "balanced"
        },
        "motivations": {
            "core_drive": format!("Help {resolved_user} ship high-quality work."),
            "short_term_goals": [
                "Resolve the current task with minimal risk",
                "Keep context accurate and up to date"
            ]
        },
        "capabilities": {
            "skills": ["coding", "debugging", "documentation", "research"],
            "tools": ["web_search", "memory_recall", "memory_store"]
        }
    })
    .to_string()
}

/// Convert AIEOS identity to a system prompt string.
/// Same algorithm as ZeroClaw's `aieos_to_system_prompt`.
pub fn aieos_to_system_prompt(identity: &AieosIdentity) -> String {
    let mut prompt = String::new();

    // Identity section
    if let Some(id) = &identity.identity {
        if let Some(names) = &id.names {
            if let Some(name) = names.full.as_deref().or(names.first.as_deref()) {
                let _ = writeln!(prompt, "**Name**: {name}");
            }
            if let Some(nickname) = &names.nickname {
                let _ = writeln!(prompt, "**Nickname**: {nickname}");
            }
        }
        if let Some(bio) = &id.bio {
            let _ = writeln!(prompt, "\n{bio}");
        }
        if let Some(origin) = &id.origin {
            let _ = writeln!(prompt, "**Origin**: {origin}");
        }
    }

    // Psychology
    if let Some(psych) = &identity.psychology {
        prompt.push_str("\n### Psychology\n");
        if let Some(mbti) = &psych.mbti {
            let _ = writeln!(prompt, "- MBTI: {mbti}");
        }
        if let Some(ocean) = &psych.ocean {
            let traits: Vec<String> = [
                ocean.openness.map(|v| format!("O={v:.2}")),
                ocean.conscientiousness.map(|v| format!("C={v:.2}")),
                ocean.extraversion.map(|v| format!("E={v:.2}")),
                ocean.agreeableness.map(|v| format!("A={v:.2}")),
                ocean.neuroticism.map(|v| format!("N={v:.2}")),
            ]
            .into_iter()
            .flatten()
            .collect();
            if !traits.is_empty() {
                let _ = writeln!(prompt, "- OCEAN: {}", traits.join(", "));
            }
        }
        if let Some(compass) = &psych.moral_compass {
            let _ = writeln!(prompt, "- Moral compass: {}", compass.join(", "));
        }
    }

    // Linguistics
    if let Some(ling) = &identity.linguistics {
        prompt.push_str("\n### Communication Style\n");
        if let Some(style) = &ling.style {
            let _ = writeln!(prompt, "- Style: {style}");
        }
        if let Some(formality) = &ling.formality {
            let _ = writeln!(prompt, "- Formality: {formality}");
        }
        if let Some(catchphrases) = &ling.catchphrases {
            let _ = writeln!(prompt, "- Catchphrases: {}", catchphrases.join(", "));
        }
        if let Some(forbidden) = &ling.forbidden_words {
            let _ = writeln!(prompt, "- Avoid: {}", forbidden.join(", "));
        }
    }

    // Motivations
    if let Some(motiv) = &identity.motivations {
        prompt.push_str("\n### Motivations\n");
        if let Some(drive) = &motiv.core_drive {
            let _ = writeln!(prompt, "- Core drive: {drive}");
        }
        if let Some(goals) = &motiv.short_term_goals {
            let _ = writeln!(prompt, "- Short-term goals: {}", goals.join(", "));
        }
        if let Some(goals) = &motiv.long_term_goals {
            let _ = writeln!(prompt, "- Long-term goals: {}", goals.join(", "));
        }
    }

    // Capabilities
    if let Some(caps) = &identity.capabilities {
        prompt.push_str("\n### Capabilities\n");
        if let Some(skills) = &caps.skills {
            let _ = writeln!(prompt, "- Skills: {}", skills.join(", "));
        }
        if let Some(tools) = &caps.tools {
            let _ = writeln!(prompt, "- Tools: {}", tools.join(", "));
        }
    }

    prompt
}

// ── wasm_bindgen exports ─────────────────────────────────────────

/// Parse AIEOS JSON and return system prompt text.
#[wasm_bindgen]
pub fn parse_aieos_identity(json_str: &str) -> Result<String, JsValue> {
    let identity: AieosIdentity = serde_json::from_str(json_str)
        .map_err(|e| JsValue::from_str(&format!("Invalid AIEOS JSON: {e}")))?;
    Ok(aieos_to_system_prompt(&identity))
}

/// Generate default AIEOS identity JSON.
#[wasm_bindgen]
pub fn default_aieos_identity(agent_name: &str, user_name: &str) -> String {
    generate_default_aieos_json(agent_name, user_name)
}

/// Check if a format string indicates AIEOS.
#[wasm_bindgen]
pub fn is_aieos_format(format: &str) -> bool {
    is_aieos_configured(format)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn aieos_roundtrip() {
        let json = generate_default_aieos_json("Nova", "Alice");
        let identity: AieosIdentity = serde_json::from_str(&json).unwrap();
        let prompt = aieos_to_system_prompt(&identity);
        assert!(prompt.contains("Nova"));
        assert!(prompt.contains("Alice"));
        assert!(prompt.contains("Core drive"));
    }

    #[test]
    fn aieos_empty_name_defaults() {
        let json = generate_default_aieos_json("", "");
        assert!(json.contains("EZ-Claw"));
        assert!(json.contains("User"));
    }

    #[test]
    fn is_aieos_case_insensitive() {
        assert!(is_aieos_configured("aieos"));
        assert!(is_aieos_configured("AIEOS"));
        assert!(!is_aieos_configured("openclaw"));
    }
}
