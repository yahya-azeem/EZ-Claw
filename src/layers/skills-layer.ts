/**
 * Skills Layer — hot-swappable tool & skill management.
 *
 * Manages tool descriptions, learned skills, and agent notes.
 * Skills can be swapped independently of the persona and workspace.
 *
 * A "skill set" is a named collection of:
 *   - Custom tool definitions (for the LLM tool registry)
 *   - Learned behaviors / instructions (injected into system prompt)
 *   - Agent notes (freeform memory aids)
 *
 * Layer hierarchy:
 *   1. Persona Layer         — hot-swappable
 *   2. Skills Layer (this)   — hot-swappable
 *   3. Workspace Layer       — persistent across swaps
 */

// ── Types ────────────────────────────────────────────────────────
import { getDB, STORES } from '../bridge/db-bridge';

export interface SkillDef {
    /** Unique skill ID */
    id: string;
    /** Human-readable name */
    name: string;
    /** What this skill does (shown to agent) */
    description: string;
    /** Instructions injected into system prompt */
    instructions: string;
    /** Custom tool definitions (OpenAI function-calling format) */
    tools: ToolDef[];
    /** Agent notes / memory aids */
    notes: string[];
    /** When this skill was created/updated */
    updatedAt: string;
}

export interface ToolDef {
    type: 'function';
    function: {
        name: string;
        description: string;
        parameters: Record<string, any>;
    };
}

export interface SkillSet {
    id: string;
    label: string;
    skills: SkillDef[];
    createdAt: string;
}

// ── Events ───────────────────────────────────────────────────────

export type SkillEvent =
    | 'skills:swapped'
    | 'skills:added'
    | 'skills:removed'
    | 'skills:updated'
    | 'skills:tools-rebuilt';

type Listener = (data?: any) => void;

const eventListeners = new Map<SkillEvent, Set<Listener>>();

function emit(event: SkillEvent, data?: any): void {
    eventListeners.get(event)?.forEach((fn) => fn(data));
}

export function onSkillEvent(event: SkillEvent, fn: Listener): () => void {
    if (!eventListeners.has(event)) eventListeners.set(event, new Set());
    eventListeners.get(event)!.add(fn);
    return () => eventListeners.get(event)?.delete(fn);
}

// ── Storage ──────────────────────────────────────────────────────

const SKILLS_KEY = 'ezclaw:skills';
const ACTIVE_SKILLSET_KEY = 'ezclaw:active_skillset';
const SKILLSETS_KEY = 'ezclaw:skillsets';

let activeSkills: SkillDef[] = [];

async function loadActiveSkills(): Promise<SkillDef[]> {
    try {
        const db = await getDB();
        const raw = await db.get(STORES.CONFIG, SKILLS_KEY);
        if (raw) {
            activeSkills = raw;
            return activeSkills;
        }
    } catch { /* ignore */ }
    activeSkills = getDefaultSkills();
    await saveActiveSkills();
    return activeSkills;
}

async function saveActiveSkills(): Promise<void> {
    const db = await getDB();
    await db.put(STORES.CONFIG, activeSkills, SKILLS_KEY);
}

function getDefaultSkills(): SkillDef[] {
    return [
        {
            id: 'shell-ops',
            name: 'Shell Operations',
            description: 'Execute shell commands in the container',
            instructions: 'You can run shell commands using run_shell_command. The container runs Alpine Linux with apk for package management. The workspace is mounted at /workspace.',
            tools: [],
            notes: [],
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'file-ops',
            name: 'File Operations',
            description: 'Read, write, and manage files in the workspace',
            instructions: 'Use read_file, write_file, and list_dir to manage workspace files. For complex file operations like creating .docx files, use the shell (e.g., `apk add libreoffice` then use cli tools).',
            tools: [],
            notes: [],
            updatedAt: new Date().toISOString(),
        },
        {
            id: 'web-research',
            name: 'Web Research',
            description: 'Search the web and fetch URL content',
            instructions: 'Use web_search for finding information and web_fetch for reading web pages.',
            tools: [],
            notes: [],
            updatedAt: new Date().toISOString(),
        },
    ];
}

// ── Skills Layer API ─────────────────────────────────────────────

/**
 * Initialize the skills layer — loads active skills from localStorage.
 */
export async function initSkills(): Promise<SkillDef[]> {
    return await loadActiveSkills();
}

/**
 * Get all active skills.
 */
export function getSkills(): SkillDef[] {
    return activeSkills;
}

/**
 * Add a new skill to the active set.
 */
export async function addSkill(skill: Omit<SkillDef, 'id' | 'updatedAt'>): Promise<SkillDef> {
    const newSkill: SkillDef = {
        ...skill,
        id: crypto.randomUUID(),
        updatedAt: new Date().toISOString(),
    };
    activeSkills.push(newSkill);
    await saveActiveSkills();
    emit('skills:added', { skill: newSkill });
    emit('skills:tools-rebuilt');
    return newSkill;
}

/**
 * Remove a skill by ID.
 */
export async function removeSkill(skillId: string): Promise<boolean> {
    const idx = activeSkills.findIndex((s) => s.id === skillId);
    if (idx === -1) return false;
    activeSkills.splice(idx, 1);
    await saveActiveSkills();
    emit('skills:removed', { skillId });
    emit('skills:tools-rebuilt');
    return true;
}

/**
 * Update an existing skill.
 */
export async function updateSkill(skillId: string, updates: Partial<SkillDef>): Promise<SkillDef | null> {
    const skill = activeSkills.find((s) => s.id === skillId);
    if (!skill) return null;
    Object.assign(skill, updates, { updatedAt: new Date().toISOString() });
    await saveActiveSkills();
    emit('skills:updated', { skill });
    return skill;
}

/**
 * Get the combined instructions from all active skills.
 * This is injected into the system prompt.
 */
export function getSkillInstructions(): string {
    if (activeSkills.length === 0) return '';

    const sections = activeSkills.map((s) => {
        let section = `### ${s.name}\n${s.instructions}`;
        if (s.notes.length > 0) {
            section += '\n\nNotes:\n' + s.notes.map((n) => `- ${n}`).join('\n');
        }
        return section;
    });

    return '## Active Skills\n\n' + sections.join('\n\n');
}

/**
 * Get all custom tool definitions from active skills.
 * These are registered with the LLM tool registry.
 */
export function getSkillTools(): ToolDef[] {
    return activeSkills.flatMap((s) => s.tools);
}

// ── Skill Set Management (for hot-swapping) ──────────────────────

/**
 * Save the current skills as a named skill set.
 */
export async function saveSkillSet(label: string): Promise<SkillSet> {
    const sets = await listSkillSets();
    const newSet: SkillSet = {
        id: crypto.randomUUID(),
        label,
        skills: JSON.parse(JSON.stringify(activeSkills)),
        createdAt: new Date().toISOString(),
    };
    sets.push(newSet);
    const db = await getDB();
    await db.put(STORES.CONFIG, sets, SKILLSETS_KEY);
    return newSet;
}

/**
 * List all saved skill sets.
 */
export async function listSkillSets(): Promise<SkillSet[]> {
    try {
        const db = await getDB();
        const stored = await db.get(STORES.CONFIG, SKILLSETS_KEY);
        return stored || [];
    } catch {
        return [];
    }
}

/**
 * Hot-swap to a different skill set.
 * This replaces all active skills and rebuilds the tool registry.
 * The workspace and persona are NOT affected.
 */
export async function swapSkillSet(setId: string): Promise<boolean> {
    const sets = await listSkillSets();
    const target = sets.find((s) => s.id === setId);
    if (!target) return false;

    activeSkills = JSON.parse(JSON.stringify(target.skills));
    await saveActiveSkills();
    
    const db = await getDB();
    await db.put(STORES.CONFIG, setId, ACTIVE_SKILLSET_KEY);

    emit('skills:swapped', { setId, label: target.label });
    emit('skills:tools-rebuilt');
    return true;
}

/**
 * Delete a skill set.
 */
export async function deleteSkillSet(setId: string): Promise<boolean> {
    const sets = await listSkillSets();
    const filtered = sets.filter((s) => s.id !== setId);
    if (filtered.length === sets.length) return false;
    
    const db = await getDB();
    await db.put(STORES.CONFIG, filtered, SKILLSETS_KEY);
    return true;
}

/**
 * Get the active skill set ID (if any).
 */
export async function getActiveSkillSetId(): Promise<string | null> {
    const db = await getDB();
    const id = await db.get(STORES.CONFIG, ACTIVE_SKILLSET_KEY);
    return id || null;
}

/**
 * Export skills as JSON.
 */
export function exportSkills(): string {
    return JSON.stringify({
        activeSkills,
        skillSets: listSkillSets(),
    }, null, 2);
}

/**
 * Import skills from JSON.
 */
export function importSkills(json: string): number {
    try {
        const data = JSON.parse(json);
        let count = 0;
        if (data.activeSkills) {
            activeSkills = data.activeSkills;
            saveActiveSkills();
            count += activeSkills.length;
        }
        if (data.skillSets) {
            localStorage.setItem(SKILLSETS_KEY, JSON.stringify(data.skillSets));
            count += data.skillSets.length;
        }
        emit('skills:swapped', { imported: true });
        emit('skills:tools-rebuilt');
        return count;
    } catch {
        return 0;
    }
}
