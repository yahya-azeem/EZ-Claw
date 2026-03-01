//! Multi-step task planner for autonomous agent operations.
//!
//! Breaks complex tasks into subtask DAGs with dependencies,
//! tracks progress, and supports re-planning on failure.

use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;

/// Status of a task node.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum TaskStatus {
    Pending,
    InProgress,
    Completed,
    Failed,
    Skipped,
}

/// A single task in the plan DAG.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskNode {
    /// Unique task ID.
    pub id: String,
    /// Human-readable description.
    pub description: String,
    /// Tool to use (if applicable).
    pub tool_name: Option<String>,
    /// Tool arguments template (may reference prior task outputs).
    pub tool_args: Option<String>,
    /// IDs of tasks this depends on.
    pub depends_on: Vec<String>,
    /// Current status.
    pub status: TaskStatus,
    /// Output from execution.
    pub output: Option<String>,
    /// Error message if failed.
    pub error: Option<String>,
    /// Retry count.
    pub retries: u32,
    /// Max retries allowed.
    pub max_retries: u32,
}

impl TaskNode {
    pub fn new(id: &str, description: &str) -> Self {
        Self {
            id: id.to_string(),
            description: description.to_string(),
            tool_name: None,
            tool_args: None,
            depends_on: Vec::new(),
            status: TaskStatus::Pending,
            output: None,
            error: None,
            retries: 0,
            max_retries: 2,
        }
    }

    pub fn with_tool(mut self, name: &str, args: &str) -> Self {
        self.tool_name = Some(name.to_string());
        self.tool_args = Some(args.to_string());
        self
    }

    pub fn with_dependency(mut self, dep_id: &str) -> Self {
        self.depends_on.push(dep_id.to_string());
        self
    }

    /// Check if all dependencies are completed.
    pub fn dependencies_met(&self, tasks: &HashMap<String, TaskNode>) -> bool {
        self.depends_on
            .iter()
            .all(|dep| tasks.get(dep).map_or(false, |t| t.status == TaskStatus::Completed))
    }

    /// Check if this task can be retried.
    pub fn can_retry(&self) -> bool {
        self.status == TaskStatus::Failed && self.retries < self.max_retries
    }
}

/// A task plan — DAG of tasks to accomplish a goal.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TaskPlan {
    /// Plan ID.
    pub id: String,
    /// High-level goal description.
    pub goal: String,
    /// Tasks in the plan.
    pub tasks: HashMap<String, TaskNode>,
    /// Execution order (topologically sorted task IDs).
    pub execution_order: Vec<String>,
    /// Whether the plan is complete.
    pub complete: bool,
}

impl TaskPlan {
    pub fn new(goal: &str) -> Self {
        Self {
            id: uuid::Uuid::new_v4().to_string(),
            goal: goal.to_string(),
            tasks: HashMap::new(),
            execution_order: Vec::new(),
            complete: false,
        }
    }

    /// Add a task to the plan.
    pub fn add_task(&mut self, task: TaskNode) {
        self.execution_order.push(task.id.clone());
        self.tasks.insert(task.id.clone(), task);
    }

    /// Get the next executable task (pending + dependencies met).
    pub fn next_task(&self) -> Option<&TaskNode> {
        for id in &self.execution_order {
            if let Some(task) = self.tasks.get(id) {
                if task.status == TaskStatus::Pending && task.dependencies_met(&self.tasks) {
                    return Some(task);
                }
            }
        }
        None
    }

    /// Mark a task as in progress.
    pub fn start_task(&mut self, id: &str) {
        if let Some(task) = self.tasks.get_mut(id) {
            task.status = TaskStatus::InProgress;
        }
    }

    /// Mark a task as completed with output.
    pub fn complete_task(&mut self, id: &str, output: &str) {
        if let Some(task) = self.tasks.get_mut(id) {
            task.status = TaskStatus::Completed;
            task.output = Some(output.to_string());
        }
        self.check_complete();
    }

    /// Mark a task as failed.
    pub fn fail_task(&mut self, id: &str, error: &str) {
        if let Some(task) = self.tasks.get_mut(id) {
            task.status = TaskStatus::Failed;
            task.error = Some(error.to_string());
            task.retries += 1;
        }
    }

    /// Retry a failed task (reset to pending).
    pub fn retry_task(&mut self, id: &str) -> bool {
        if let Some(task) = self.tasks.get_mut(id) {
            if task.can_retry() {
                task.status = TaskStatus::Pending;
                task.error = None;
                return true;
            }
        }
        false
    }

    /// Check if the plan is complete.
    fn check_complete(&mut self) {
        self.complete = self
            .tasks
            .values()
            .all(|t| t.status == TaskStatus::Completed || t.status == TaskStatus::Skipped);
    }

    /// Get progress percentage.
    pub fn progress(&self) -> f64 {
        if self.tasks.is_empty() {
            return 0.0;
        }
        let done = self
            .tasks
            .values()
            .filter(|t| t.status == TaskStatus::Completed || t.status == TaskStatus::Skipped)
            .count();
        (done as f64 / self.tasks.len() as f64) * 100.0
    }
}

// ── WASM Bindings ────────────────────────────────────────────────

#[wasm_bindgen]
pub struct WasmTaskPlan {
    inner: TaskPlan,
}

#[wasm_bindgen]
impl WasmTaskPlan {
    #[wasm_bindgen(constructor)]
    pub fn new(goal: &str) -> Self {
        Self {
            inner: TaskPlan::new(goal),
        }
    }

    /// Add a task from JSON.
    #[wasm_bindgen]
    pub fn add_task_json(&mut self, json: &str) -> Result<(), JsValue> {
        let task: TaskNode = serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("Invalid task: {}", e)))?;
        self.inner.add_task(task);
        Ok(())
    }

    /// Get next executable task as JSON (or empty string).
    #[wasm_bindgen]
    pub fn next_task(&self) -> String {
        match self.inner.next_task() {
            Some(t) => serde_json::to_string(t).unwrap_or_default(),
            None => String::new(),
        }
    }

    #[wasm_bindgen]
    pub fn start_task(&mut self, id: &str) {
        self.inner.start_task(id);
    }

    #[wasm_bindgen]
    pub fn complete_task(&mut self, id: &str, output: &str) {
        self.inner.complete_task(id, output);
    }

    #[wasm_bindgen]
    pub fn fail_task(&mut self, id: &str, error: &str) {
        self.inner.fail_task(id, error);
    }

    #[wasm_bindgen]
    pub fn retry_task(&mut self, id: &str) -> bool {
        self.inner.retry_task(id)
    }

    #[wasm_bindgen]
    pub fn progress(&self) -> f64 {
        self.inner.progress()
    }

    #[wasm_bindgen]
    pub fn is_complete(&self) -> bool {
        self.inner.complete
    }

    /// Export plan as JSON for persistence.
    #[wasm_bindgen]
    pub fn to_json(&self) -> String {
        serde_json::to_string(&self.inner).unwrap_or_default()
    }

    /// Import plan from JSON.
    #[wasm_bindgen]
    pub fn from_json(json: &str) -> Result<WasmTaskPlan, JsValue> {
        let inner: TaskPlan = serde_json::from_str(json)
            .map_err(|e| JsValue::from_str(&format!("Invalid plan: {}", e)))?;
        Ok(Self { inner })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn linear_plan_execution() {
        let mut plan = TaskPlan::new("Test goal");

        plan.add_task(TaskNode::new("1", "First task"));
        plan.add_task(TaskNode::new("2", "Second task").with_dependency("1"));
        plan.add_task(TaskNode::new("3", "Third task").with_dependency("2"));

        // Only first task is executable
        assert_eq!(plan.next_task().unwrap().id, "1");

        plan.start_task("1");
        plan.complete_task("1", "done");

        // Now second is available
        assert_eq!(plan.next_task().unwrap().id, "2");

        plan.start_task("2");
        plan.complete_task("2", "done");
        plan.start_task("3");
        plan.complete_task("3", "done");

        assert!(plan.complete);
        assert!((plan.progress() - 100.0).abs() < f64::EPSILON);
    }

    #[test]
    fn retry_on_failure() {
        let mut plan = TaskPlan::new("Test");
        plan.add_task(TaskNode::new("1", "Flaky task"));

        plan.start_task("1");
        plan.fail_task("1", "Network error");

        assert!(plan.retry_task("1")); // First retry
        assert_eq!(plan.next_task().unwrap().id, "1");
    }
}
