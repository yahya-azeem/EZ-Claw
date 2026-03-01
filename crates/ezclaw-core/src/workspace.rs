//! Virtual workspace filesystem — adapted from OpenClaw/IronClaw workspace.
//!
//! Provides an in-memory filesystem tree that syncs to browser OPFS
//! via the TypeScript bridge. Mirrors OpenClaw's `~/.openclaw/workspace`
//! and IronClaw's workspace filesystem concepts.
//!
//! Files stored here include:
//! - `SOUL.md` — agent personality (OpenClaw identity)
//! - `AGENTS.md` — workspace instructions  
//! - `TOOLS.md` — auto-generated tool descriptions
//! - `skills/` — user/agent-created skills
//! - `notes/` — agent working notes
//! - User project files

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

/// A node in the virtual filesystem tree.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum FSNode {
    File {
        content: String,
        size: usize,
        modified: String,
    },
    Directory {
        children: HashMap<String, FSNode>,
        modified: String,
    },
}

impl FSNode {
    fn new_file(content: &str) -> Self {
        FSNode::File {
            size: content.len(),
            content: content.to_string(),
            modified: String::new(),
        }
    }

    fn new_dir() -> Self {
        FSNode::Directory {
            children: HashMap::new(),
            modified: String::new(),
        }
    }

    #[allow(dead_code)]
    fn is_file(&self) -> bool {
        matches!(self, FSNode::File { .. })
    }

    fn is_dir(&self) -> bool {
        matches!(self, FSNode::Directory { .. })
    }
}

/// Virtual filesystem for the agent workspace.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VirtualFS {
    root: FSNode,
    /// Track modified paths for sync to OPFS.
    dirty_paths: Vec<String>,
}

impl Default for VirtualFS {
    fn default() -> Self {
        let mut fs = Self {
            root: FSNode::new_dir(),
            dirty_paths: Vec::new(),
        };
        // Initialize default workspace structure
        fs.mkdir("/skills").ok();
        fs.mkdir("/notes").ok();
        fs.write_file(
            "/SOUL.md",
            "# Agent Identity\n\n\
             You are EZ-Claw, a helpful and capable AI assistant.\n\
             You are thorough, honest, and security-conscious.\n\
             You run entirely in the user's browser — no data leaves without permission.\n",
        )
        .ok();
        fs.write_file(
            "/AGENTS.md",
            "# Workspace Instructions\n\n\
             This is your workspace. You can create files, notes, and skills here.\n\
             All data is stored locally on the user's device.\n",
        )
        .ok();
        fs.dirty_paths.clear(); // Don't mark defaults as dirty
        fs
    }
}

impl VirtualFS {
    pub fn new() -> Self {
        Self::default()
    }

    /// Navigate to a node by path.
    fn navigate(&self, path: &str) -> Option<&FSNode> {
        let parts = Self::split_path(path);
        let mut current = &self.root;

        for part in parts {
            match current {
                FSNode::Directory { children, .. } => {
                    current = children.get(part)?;
                }
                FSNode::File { .. } => return None,
            }
        }

        Some(current)
    }

    /// Navigate to a mutable node by path.
    #[allow(dead_code)]
    fn navigate_mut(&mut self, path: &str) -> Option<&mut FSNode> {
        let parts: Vec<String> = Self::split_path(path)
            .into_iter()
            .map(|s| s.to_string())
            .collect();
        let mut current = &mut self.root;

        for part in &parts {
            match current {
                FSNode::Directory { children, .. } => {
                    current = children.get_mut(part.as_str())?;
                }
                FSNode::File { .. } => return None,
            }
        }

        Some(current)
    }

    /// Split a path into components.
    fn split_path(path: &str) -> Vec<&str> {
        path.trim_matches('/')
            .split('/')
            .filter(|s| !s.is_empty())
            .collect()
    }

    /// Normalize a path (remove double slashes, resolve . and ..).
    fn normalize_path(path: &str) -> String {
        let parts = Self::split_path(path);
        let mut normalized = Vec::new();

        for part in parts {
            match part {
                "." => {}
                ".." => {
                    normalized.pop();
                }
                _ => normalized.push(part),
            }
        }

        format!("/{}", normalized.join("/"))
    }

    /// Read a file's content.
    pub fn read_file(&self, path: &str) -> Result<String, String> {
        let norm = Self::normalize_path(path);
        match self.navigate(&norm) {
            Some(FSNode::File { content, .. }) => Ok(content.clone()),
            Some(FSNode::Directory { .. }) => Err(format!("'{}' is a directory", norm)),
            None => Err(format!("File not found: {}", norm)),
        }
    }

    /// Write content to a file (creates parent dirs if needed).
    pub fn write_file(&mut self, path: &str, content: &str) -> Result<(), String> {
        let norm = Self::normalize_path(path);
        let parts: Vec<String> = Self::split_path(&norm)
            .iter()
            .map(|s| s.to_string())
            .collect();

        if parts.is_empty() {
            return Err("Invalid path".to_string());
        }

        // Ensure parent directories exist
        let parent_parts = &parts[..parts.len() - 1];
        let mut current = &mut self.root;

        for part in parent_parts {
            match current {
                FSNode::Directory { children, .. } => {
                    current = children.entry(part.clone()).or_insert_with(FSNode::new_dir);
                }
                FSNode::File { .. } => {
                    return Err(format!("Parent '{}' is a file", part));
                }
            }
        }

        // Write the file
        let filename = parts.last().unwrap();
        match current {
            FSNode::Directory { children, .. } => {
                children.insert(filename.clone(), FSNode::new_file(content));
                self.dirty_paths.push(norm);
                Ok(())
            }
            FSNode::File { .. } => Err("Cannot create file inside a file".to_string()),
        }
    }

    /// Create a directory (and parents).
    pub fn mkdir(&mut self, path: &str) -> Result<(), String> {
        let norm = Self::normalize_path(path);
        let parts: Vec<String> = Self::split_path(&norm)
            .iter()
            .map(|s| s.to_string())
            .collect();

        let mut current = &mut self.root;

        for part in &parts {
            match current {
                FSNode::Directory { children, .. } => {
                    current = children.entry(part.clone()).or_insert_with(FSNode::new_dir);
                }
                FSNode::File { .. } => {
                    return Err(format!("'{}' exists as a file", part));
                }
            }
        }

        self.dirty_paths.push(norm);
        Ok(())
    }

    /// Delete a file or directory.
    pub fn delete(&mut self, path: &str) -> Result<(), String> {
        let norm = Self::normalize_path(path);
        let parts: Vec<String> = Self::split_path(&norm)
            .iter()
            .map(|s| s.to_string())
            .collect();

        if parts.is_empty() {
            return Err("Cannot delete root".to_string());
        }

        let parent_parts = &parts[..parts.len() - 1];
        let target_name = parts.last().unwrap();

        let mut current = &mut self.root;
        for part in parent_parts {
            match current {
                FSNode::Directory { children, .. } => {
                    current = children
                        .get_mut(part.as_str())
                        .ok_or_else(|| format!("Path not found: {}", part))?;
                }
                _ => return Err("Invalid path".to_string()),
            }
        }

        match current {
            FSNode::Directory { children, .. } => {
                if children.remove(target_name.as_str()).is_some() {
                    self.dirty_paths.push(norm);
                    Ok(())
                } else {
                    Err(format!("Not found: {}", target_name))
                }
            }
            _ => Err("Invalid path".to_string()),
        }
    }

    /// List directory contents.
    pub fn list_dir(&self, path: &str) -> Result<Vec<DirEntry>, String> {
        let norm = Self::normalize_path(path);
        match self.navigate(&norm) {
            Some(FSNode::Directory { children, .. }) => {
                let mut entries: Vec<DirEntry> = children
                    .iter()
                    .map(|(name, node)| DirEntry {
                        name: name.clone(),
                        is_dir: node.is_dir(),
                        size: match node {
                            FSNode::File { size, .. } => *size,
                            FSNode::Directory { children, .. } => children.len(),
                        },
                    })
                    .collect();
                entries.sort_by(|a, b| {
                    // Dirs first, then alphabetical
                    b.is_dir.cmp(&a.is_dir).then(a.name.cmp(&b.name))
                });
                Ok(entries)
            }
            Some(FSNode::File { .. }) => Err(format!("'{}' is a file", norm)),
            None => Err(format!("Directory not found: {}", norm)),
        }
    }

    /// Check if a path exists.
    pub fn exists(&self, path: &str) -> bool {
        self.navigate(&Self::normalize_path(path)).is_some()
    }

    /// Get dirty paths (modified since last sync) and clear.
    pub fn take_dirty_paths(&mut self) -> Vec<String> {
        std::mem::take(&mut self.dirty_paths)
    }

    /// Export entire filesystem as JSON.
    pub fn export(&self) -> String {
        serde_json::to_string(&self.root).unwrap_or_default()
    }

    /// Import filesystem from JSON.
    pub fn import(&mut self, json: &str) -> Result<(), String> {
        self.root = serde_json::from_str(json).map_err(|e| format!("Invalid FS JSON: {}", e))?;
        Ok(())
    }
}

/// Directory listing entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DirEntry {
    pub name: String,
    pub is_dir: bool,
    pub size: usize,
}

// ── WASM Bindings ────────────────────────────────────────────────

#[wasm_bindgen]
pub struct WasmWorkspace {
    inner: VirtualFS,
}

#[wasm_bindgen]
impl WasmWorkspace {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            inner: VirtualFS::default(),
        }
    }

    #[wasm_bindgen]
    pub fn read_file(&self, path: &str) -> Result<String, JsValue> {
        self.inner
            .read_file(path)
            .map_err(|e| JsValue::from_str(&e))
    }

    #[wasm_bindgen]
    pub fn write_file(&mut self, path: &str, content: &str) -> Result<(), JsValue> {
        self.inner
            .write_file(path, content)
            .map_err(|e| JsValue::from_str(&e))
    }

    #[wasm_bindgen]
    pub fn mkdir(&mut self, path: &str) -> Result<(), JsValue> {
        self.inner.mkdir(path).map_err(|e| JsValue::from_str(&e))
    }

    #[wasm_bindgen]
    pub fn delete(&mut self, path: &str) -> Result<(), JsValue> {
        self.inner.delete(path).map_err(|e| JsValue::from_str(&e))
    }

    #[wasm_bindgen]
    pub fn list_dir(&self, path: &str) -> String {
        match self.inner.list_dir(path) {
            Ok(entries) => serde_json::to_string(&entries).unwrap_or_default(),
            Err(e) => format!("{{\"error\": \"{}\"}}", e),
        }
    }

    #[wasm_bindgen]
    pub fn exists(&self, path: &str) -> bool {
        self.inner.exists(path)
    }

    /// Get modified paths since last sync.
    #[wasm_bindgen]
    pub fn take_dirty_paths(&mut self) -> String {
        let paths = self.inner.take_dirty_paths();
        serde_json::to_string(&paths).unwrap_or_default()
    }

    /// Export full FS.
    #[wasm_bindgen]
    pub fn export(&self) -> String {
        self.inner.export()
    }

    /// Import full FS.
    #[wasm_bindgen]
    pub fn import(&mut self, json: &str) -> Result<(), JsValue> {
        self.inner.import(json).map_err(|e| JsValue::from_str(&e))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn default_workspace_has_structure() {
        let fs = VirtualFS::default();
        assert!(fs.exists("/SOUL.md"));
        assert!(fs.exists("/AGENTS.md"));
        assert!(fs.exists("/skills"));
        assert!(fs.exists("/notes"));
    }

    #[test]
    fn read_write_file() {
        let mut fs = VirtualFS::new();
        fs.write_file("/test.txt", "hello").unwrap();
        assert_eq!(fs.read_file("/test.txt").unwrap(), "hello");
    }

    #[test]
    fn nested_write_creates_parents() {
        let mut fs = VirtualFS::new();
        fs.write_file("/a/b/c/file.txt", "deep").unwrap();
        assert!(fs.exists("/a/b/c/file.txt"));
    }

    #[test]
    fn list_dir_works() {
        let fs = VirtualFS::default();
        let entries = fs.list_dir("/").unwrap();
        assert!(!entries.is_empty());
        // Dirs should come first
        assert!(entries[0].is_dir);
    }

    #[test]
    fn delete_file() {
        let mut fs = VirtualFS::new();
        fs.write_file("/temp.txt", "data").unwrap();
        assert!(fs.exists("/temp.txt"));
        fs.delete("/temp.txt").unwrap();
        assert!(!fs.exists("/temp.txt"));
    }

    #[test]
    fn path_traversal_blocked() {
        let fs = VirtualFS::new();
        // "../" should resolve to root, not escape
        let norm = VirtualFS::normalize_path("/../../../etc/passwd");
        assert_eq!(norm, "/etc/passwd"); // Resolved within FS, not host
        assert!(fs.read_file(&norm).is_err()); // File doesn't exist in VFS
    }

    #[test]
    fn dirty_tracking() {
        let mut fs = VirtualFS::new();
        fs.write_file("/new.txt", "data").unwrap();
        let dirty = fs.take_dirty_paths();
        assert!(!dirty.is_empty());
        // After take, should be empty
        assert!(fs.take_dirty_paths().is_empty());
    }
}
