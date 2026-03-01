//! Memory module — adapted from ZeroClaw's `memory/` module.
//!
//! Preserves ZeroClaw's exact MemoryEntry and MemoryCategory types from
//! memory/traits.rs. Includes vector operations (cosine_similarity,
//! hybrid_merge) directly from memory/vector.rs. The async Memory trait
//! is replaced with synchronous SQL generation for sql.js in the browser.

use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;

// ── Core types (from ZeroClaw memory/traits.rs) ──────────────────

/// A single memory entry (from ZeroClaw).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MemoryEntry {
    pub id: String,
    pub key: String,
    pub content: String,
    pub category: MemoryCategory,
    pub timestamp: String,
    pub session_id: Option<String>,
    pub score: Option<f64>,
}

/// Memory categories for organization (from ZeroClaw).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "snake_case")]
pub enum MemoryCategory {
    /// Long-term facts, preferences, decisions.
    Core,
    /// Daily session logs.
    Daily,
    /// Conversation context.
    Conversation,
    /// User-defined custom category.
    Custom(String),
}

impl std::fmt::Display for MemoryCategory {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Core => write!(f, "core"),
            Self::Daily => write!(f, "daily"),
            Self::Conversation => write!(f, "conversation"),
            Self::Custom(name) => write!(f, "{name}"),
        }
    }
}

// ── Vector operations (from ZeroClaw memory/vector.rs) ───────────

/// Cosine similarity between two vectors. Returns 0.0–1.0.
/// Taken directly from ZeroClaw's memory/vector.rs.
pub fn cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    if a.len() != b.len() || a.is_empty() {
        return 0.0;
    }

    let mut dot = 0.0_f64;
    let mut norm_a = 0.0_f64;
    let mut norm_b = 0.0_f64;

    for (x, y) in a.iter().zip(b.iter()) {
        let x = f64::from(*x);
        let y = f64::from(*y);
        dot += x * y;
        norm_a += x * x;
        norm_b += y * y;
    }

    let denom = norm_a.sqrt() * norm_b.sqrt();
    if !denom.is_finite() || denom < f64::EPSILON {
        return 0.0;
    }

    let raw = dot / denom;
    if !raw.is_finite() {
        return 0.0;
    }

    // Clamp to [0, 1] — embeddings are typically positive
    #[allow(clippy::cast_possible_truncation)]
    let sim = raw.clamp(0.0, 1.0) as f32;
    sim
}

/// Serialize f32 vector to bytes (little-endian, from ZeroClaw).
pub fn vec_to_bytes(v: &[f32]) -> Vec<u8> {
    let mut bytes = Vec::with_capacity(v.len() * 4);
    for &f in v {
        bytes.extend_from_slice(&f.to_le_bytes());
    }
    bytes
}

/// Deserialize bytes to f32 vector (little-endian, from ZeroClaw).
pub fn bytes_to_vec(bytes: &[u8]) -> Vec<f32> {
    bytes
        .chunks_exact(4)
        .map(|chunk| {
            let arr: [u8; 4] = chunk.try_into().unwrap_or([0; 4]);
            f32::from_le_bytes(arr)
        })
        .collect()
}

/// A scored result for hybrid merging (from ZeroClaw).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScoredResult {
    pub id: String,
    pub vector_score: Option<f32>,
    pub keyword_score: Option<f32>,
    pub final_score: f32,
}

/// Hybrid merge: combine vector and keyword results with weighted fusion.
/// Taken directly from ZeroClaw's memory/vector.rs.
pub fn hybrid_merge(
    vector_results: &[(String, f32)],
    keyword_results: &[(String, f32)],
    vector_weight: f32,
    keyword_weight: f32,
    limit: usize,
) -> Vec<ScoredResult> {
    use std::collections::HashMap;

    let mut map: HashMap<String, ScoredResult> = HashMap::new();

    for (id, score) in vector_results {
        map.entry(id.clone())
            .and_modify(|r| r.vector_score = Some(*score))
            .or_insert_with(|| ScoredResult {
                id: id.clone(),
                vector_score: Some(*score),
                keyword_score: None,
                final_score: 0.0,
            });
    }

    let max_kw = keyword_results
        .iter()
        .map(|(_, s)| *s)
        .fold(0.0_f32, f32::max);
    let max_kw = if max_kw < f32::EPSILON { 1.0 } else { max_kw };

    for (id, score) in keyword_results {
        let normalized = score / max_kw;
        map.entry(id.clone())
            .and_modify(|r| r.keyword_score = Some(normalized))
            .or_insert_with(|| ScoredResult {
                id: id.clone(),
                vector_score: None,
                keyword_score: Some(normalized),
                final_score: 0.0,
            });
    }

    let mut results: Vec<ScoredResult> = map
        .into_values()
        .map(|mut r| {
            let vs = r.vector_score.unwrap_or(0.0);
            let ks = r.keyword_score.unwrap_or(0.0);
            r.final_score = vector_weight * vs + keyword_weight * ks;
            r
        })
        .collect();

    results.sort_by(|a, b| {
        b.final_score
            .partial_cmp(&a.final_score)
            .unwrap_or(std::cmp::Ordering::Equal)
    });
    results.truncate(limit);
    results
}

// ── SQL generation for sql.js (WASM-adapted) ─────────────────────
// (ZeroClaw uses native rusqlite; we generate SQL for sql.js in browser)

/// SQL to create the memories table (mirrors ZeroClaw's SQLite schema).
#[wasm_bindgen]
pub fn memory_create_table_sql() -> String {
    "CREATE TABLE IF NOT EXISTS memories (
        id TEXT PRIMARY KEY,
        key TEXT NOT NULL UNIQUE,
        content TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'core',
        timestamp TEXT NOT NULL,
        session_id TEXT,
        embedding BLOB
    );
    CREATE INDEX IF NOT EXISTS idx_memories_key ON memories(key);
    CREATE INDEX IF NOT EXISTS idx_memories_category ON memories(category);
    CREATE INDEX IF NOT EXISTS idx_memories_session ON memories(session_id);
    CREATE INDEX IF NOT EXISTS idx_memories_timestamp ON memories(timestamp);"
        .into()
}

/// SQL to store a memory entry.
#[wasm_bindgen]
pub fn memory_store_sql(
    id: &str,
    key: &str,
    content: &str,
    category: &str,
    timestamp: &str,
    session_id: &str,
) -> String {
    // Using parameterized queries via format for sql.js
    // The TypeScript bridge should use sql.js prepared statements
    format!(
        "INSERT OR REPLACE INTO memories (id, key, content, category, timestamp, session_id) \
         VALUES ('{id}', '{key}', '{content}', '{category}', '{timestamp}', \
         {session});",
        id = escape_sql(id),
        key = escape_sql(key),
        content = escape_sql(content),
        category = escape_sql(category),
        timestamp = escape_sql(timestamp),
        session = if session_id.is_empty() {
            "NULL".to_string()
        } else {
            format!("'{}'", escape_sql(session_id))
        },
    )
}

/// SQL to recall memories matching a query (keyword search).
#[wasm_bindgen]
pub fn memory_recall_sql(query: &str, limit: u32, session_id: &str) -> String {
    let terms: Vec<&str> = query.split_whitespace().collect();
    let mut conditions = Vec::new();

    for term in &terms {
        let escaped = escape_sql(term);
        conditions.push(format!(
            "(content LIKE '%{escaped}%' OR key LIKE '%{escaped}%')"
        ));
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" OR "))
    };

    let session_clause = if session_id.is_empty() {
        String::new()
    } else {
        let escaped_session = escape_sql(session_id);
        if where_clause.is_empty() {
            format!("WHERE session_id = '{escaped_session}'")
        } else {
            format!(" AND session_id = '{escaped_session}'")
        }
    };

    format!(
        "SELECT id, key, content, category, timestamp, session_id FROM memories \
         {where_clause}{session_clause} ORDER BY timestamp DESC LIMIT {limit};"
    )
}

/// SQL to retrieve a specific memory by key.
#[wasm_bindgen]
pub fn memory_get_sql(key: &str) -> String {
    format!(
        "SELECT id, key, content, category, timestamp, session_id \
         FROM memories WHERE key = '{}' LIMIT 1;",
        escape_sql(key)
    )
}

/// SQL to list memories filtered by category and/or session.
#[wasm_bindgen]
pub fn memory_list_sql(category: &str, session_id: &str) -> String {
    let mut conditions = Vec::new();
    if !category.is_empty() {
        conditions.push(format!("category = '{}'", escape_sql(category)));
    }
    if !session_id.is_empty() {
        conditions.push(format!("session_id = '{}'", escape_sql(session_id)));
    }

    let where_clause = if conditions.is_empty() {
        String::new()
    } else {
        format!("WHERE {}", conditions.join(" AND "))
    };

    format!(
        "SELECT id, key, content, category, timestamp, session_id \
         FROM memories {where_clause} ORDER BY timestamp DESC;"
    )
}

/// SQL to delete a memory by key.
#[wasm_bindgen]
pub fn memory_forget_sql(key: &str) -> String {
    format!("DELETE FROM memories WHERE key = '{}';", escape_sql(key))
}

/// SQL to count total memories.
#[wasm_bindgen]
pub fn memory_count_sql() -> String {
    "SELECT COUNT(*) FROM memories;".into()
}

/// Compute TF-IDF relevance score for search ranking.
/// Used for keyword search scoring in the browser.
#[wasm_bindgen]
pub fn compute_tfidf_score(query: &str, document: &str) -> f64 {
    let query_terms: Vec<&str> = query.split_whitespace().collect();
    let doc_lower = document.to_lowercase();
    let doc_words: Vec<&str> = doc_lower.split_whitespace().collect();

    if query_terms.is_empty() || doc_words.is_empty() {
        return 0.0;
    }

    let mut score = 0.0;
    for term in &query_terms {
        let term_lower = term.to_lowercase();
        let tf = doc_words
            .iter()
            .filter(|w| w.contains(term_lower.as_str()))
            .count() as f64
            / doc_words.len() as f64;
        if tf > 0.0 {
            score += tf * (1.0 + (1.0 / tf).ln());
        }
    }
    score
}

// ── wasm_bindgen exports for vector ops ──────────────────────────

/// Cosine similarity exposed to WASM.
#[wasm_bindgen]
pub fn wasm_cosine_similarity(a: &[f32], b: &[f32]) -> f32 {
    cosine_similarity(a, b)
}

/// Hybrid merge exposed to WASM (JSON in/out).
#[wasm_bindgen]
pub fn wasm_hybrid_merge(
    vector_results_json: &str,
    keyword_results_json: &str,
    vector_weight: f32,
    keyword_weight: f32,
    limit: u32,
) -> Result<String, JsValue> {
    let vector_results: Vec<(String, f32)> =
        serde_json::from_str(vector_results_json).unwrap_or_default();
    let keyword_results: Vec<(String, f32)> =
        serde_json::from_str(keyword_results_json).unwrap_or_default();

    let results = hybrid_merge(
        &vector_results,
        &keyword_results,
        vector_weight,
        keyword_weight,
        limit as usize,
    );

    serde_json::to_string(&results)
        .map_err(|e| JsValue::from_str(&format!("Serialize error: {e}")))
}

/// Basic SQL escaping (prevents SQL injection in generated queries).
fn escape_sql(s: &str) -> String {
    s.replace('\'', "''")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn memory_category_display() {
        assert_eq!(MemoryCategory::Core.to_string(), "core");
        assert_eq!(MemoryCategory::Daily.to_string(), "daily");
        assert_eq!(MemoryCategory::Conversation.to_string(), "conversation");
        assert_eq!(
            MemoryCategory::Custom("project_notes".into()).to_string(),
            "project_notes"
        );
    }

    #[test]
    fn memory_category_serde_roundtrip() {
        let core = serde_json::to_string(&MemoryCategory::Core).unwrap();
        assert_eq!(core, "\"core\"");
        let parsed: MemoryCategory = serde_json::from_str(&core).unwrap();
        assert_eq!(parsed, MemoryCategory::Core);
    }

    #[test]
    fn cosine_identical_vectors() {
        let v = vec![1.0, 2.0, 3.0];
        let sim = cosine_similarity(&v, &v);
        assert!((sim - 1.0).abs() < 0.001);
    }

    #[test]
    fn cosine_orthogonal_vectors() {
        let a = vec![1.0, 0.0, 0.0];
        let b = vec![0.0, 1.0, 0.0];
        assert!(cosine_similarity(&a, &b).abs() < 0.001);
    }

    #[test]
    fn cosine_empty_returns_zero() {
        assert_eq!(cosine_similarity(&[], &[]), 0.0);
    }

    #[test]
    fn hybrid_merge_deduplicates() {
        let vec_results = vec![("a".into(), 0.9)];
        let kw_results = vec![("a".into(), 10.0)];
        let merged = hybrid_merge(&vec_results, &kw_results, 0.7, 0.3, 10);
        assert_eq!(merged.len(), 1);
        assert!(merged[0].vector_score.is_some());
        assert!(merged[0].keyword_score.is_some());
    }

    #[test]
    fn hybrid_merge_respects_limit() {
        let vec_results: Vec<(String, f32)> = (0..20)
            .map(|i| (format!("item_{i}"), 1.0 - i as f32 * 0.05))
            .collect();
        let merged = hybrid_merge(&vec_results, &[], 1.0, 0.0, 5);
        assert_eq!(merged.len(), 5);
    }

    #[test]
    fn tfidf_basic_scoring() {
        let score = compute_tfidf_score("rust programming", "Rust is a systems programming language");
        assert!(score > 0.0);
    }

    #[test]
    fn tfidf_empty_query() {
        let score = compute_tfidf_score("", "some content");
        assert_eq!(score, 0.0);
    }

    #[test]
    fn sql_escaping_prevents_injection() {
        let escaped = escape_sql("O'Brien");
        assert_eq!(escaped, "O''Brien");
    }

    #[test]
    fn vec_bytes_roundtrip() {
        let original = vec![1.0_f32, -2.5, 3.14, 0.0];
        let bytes = vec_to_bytes(&original);
        let restored = bytes_to_vec(&bytes);
        assert_eq!(original, restored);
    }
}
