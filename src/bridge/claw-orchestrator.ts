/**
 * Claw Orchestrator — manages autonomous Claw agents.
 *
 * Each Claw is a named AI agent with its own:
 *   - Persona (identity layer)
 *   - Skills (tool layer)
 *   - Workspace (file layer — never wiped)
 *   - AbortController (for cancelling in-flight requests)
 *
 * Supports:
 *   - Concurrent autonomous execution
 *   - PANIC freeze (halt all claws instantly)
 *   - Kill (terminate one claw)
 *   - Wipeout (erase all personas + skills, keep workspaces)
 *   - Resume (unfreeze and continue)
 */

import {
    swapPersona,
    getActivePersonaId,
    listPersonas,
    type PersonaEntry,
} from '../layers/persona-layer';
import {
    swapSkillSet,
    getActiveSkillSetId,
    listSkillSets,
    deleteSkillSet,
    getSkills,
    type SkillSet,
} from '../layers/skills-layer';

// ── Types ─────────────────────────────────────────────────────────

export type ClawStatus = 'running' | 'frozen' | 'killed';

export interface ClawData {
    id: string;
    clawName: string;
    emoji: string;
    personaId: string | null;
    skillSetId: string | null;
    status: ClawStatus;
    /** Messages are per-claw (separate task, separate history) */
    messages: Array<{ role: string; content: string }>;
    createdAt: string;
    updatedAt: string;
    model: string;
    provider: string;
}

// ── State ─────────────────────────────────────────────────────────

let _claws: Map<string, ClawData> = new Map();
let _abortControllers: Map<string, AbortController> = new Map();
let _listeners: Array<() => void> = [];
let _panicActive = false;

const WIPEOUT_PHRASE = 'WIPEOUT CONFIRM';

// ── Helpers ───────────────────────────────────────────────────────

function _notify(): void {
    for (const listener of _listeners) listener();
}

function _persist(): void {
    try {
        const data = Array.from(_claws.values());
        localStorage.setItem('ezclaw_claws', JSON.stringify(data));
    } catch { /* quota exceeded — silent */ }
    _notify();
}

function _load(): void {
    try {
        const raw = localStorage.getItem('ezclaw_claws');
        if (raw) {
            const arr: ClawData[] = JSON.parse(raw);
            _claws = new Map(arr.map(c => [c.id, c]));
        }
    } catch { /* corrupt data — start fresh */ }
}

// ── Lifecycle ─────────────────────────────────────────────────────

export function initOrchestrator(): void {
    _load();
}

export function onClawsChange(listener: () => void): () => void {
    _listeners.push(listener);
    return () => {
        _listeners = _listeners.filter(l => l !== listener);
    };
}

// ── CRUD ──────────────────────────────────────────────────────────

const DEFAULT_EMOJIS = ['🦀', '🐙', '🦑', '🦞', '🦐', '🐍', '🦅', '🐺', '🦊', '🐲'];

function _pickEmoji(): string {
    return DEFAULT_EMOJIS[_claws.size % DEFAULT_EMOJIS.length];
}

export function createClaw(
    name: string,
    model: string,
    provider: string,
    emoji?: string,
): ClawData {
    const id = crypto.randomUUID();
    const claw: ClawData = {
        id,
        clawName: name || `Claw ${_claws.size + 1}`,
        emoji: emoji || _pickEmoji(),
        personaId: getActivePersonaId(),
        skillSetId: getActiveSkillSetId(),
        status: 'running',
        messages: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        model,
        provider,
    };
    _claws.set(id, claw);
    _abortControllers.set(id, new AbortController());
    _persist();
    return claw;
}

export function cloneClaw(
    fromId: string,
    newName: string,
    model: string,
    provider: string,
): ClawData | null {
    const source = _claws.get(fromId);
    if (!source) return null;

    const id = crypto.randomUUID();
    const claw: ClawData = {
        id,
        clawName: newName || `${source.clawName} (clone)`,
        emoji: source.emoji,
        personaId: source.personaId,
        skillSetId: source.skillSetId,
        status: 'running',
        messages: [], // Separate agent, separate task — NO message copying
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        model: model || source.model,
        provider: provider || source.provider,
    };
    _claws.set(id, claw);
    _abortControllers.set(id, new AbortController());
    _persist();
    return claw;
}

export function getClaw(id: string): ClawData | undefined {
    return _claws.get(id);
}

export function getAllClaws(): ClawData[] {
    return Array.from(_claws.values())
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
}

export function updateClaw(id: string, updates: Partial<ClawData>): void {
    const claw = _claws.get(id);
    if (!claw) return;
    Object.assign(claw, updates, { updatedAt: new Date().toISOString() });
    _claws.set(id, claw);
    _persist();
}

export function deleteClaw(id: string): void {
    _claws.delete(id);
    const ac = _abortControllers.get(id);
    if (ac) ac.abort();
    _abortControllers.delete(id);
    _persist();
}

// ── Concurrency ───────────────────────────────────────────────────

/** Get abort signal for a claw's fetch requests. */
export function getClawSignal(id: string): AbortSignal {
    let ac = _abortControllers.get(id);
    if (!ac) {
        ac = new AbortController();
        _abortControllers.set(id, ac);
    }
    return ac.signal;
}

/** Check if a claw can proceed (not frozen/killed). */
export function canClawProceed(id: string): boolean {
    const claw = _claws.get(id);
    return !!claw && claw.status === 'running';
}

// ── Layer Activation ──────────────────────────────────────────────

/** Activate a claw's persona and skills layers. */
export function activateClawLayers(id: string): void {
    const claw = _claws.get(id);
    if (!claw) return;

    if (claw.personaId) {
        swapPersona(claw.personaId);
    }
    if (claw.skillSetId) {
        swapSkillSet(claw.skillSetId);
    }
}

// ── PANIC CONTROLS ────────────────────────────────────────────────

/** 🛑 PANIC — instantly freeze ALL claws. Aborts all in-flight requests. */
export function panicFreezeAll(): void {
    _panicActive = true;
    for (const [id, claw] of _claws) {
        if (claw.status === 'running') {
            claw.status = 'frozen';
            _claws.set(id, claw);
        }
        // Abort in-flight requests
        const ac = _abortControllers.get(id);
        if (ac) ac.abort();
        // Replace with fresh controller for potential resume
        _abortControllers.set(id, new AbortController());
    }
    _persist();
}

export function isPanicActive(): boolean {
    return _panicActive;
}

/** Kill a single claw — permanent termination. */
export function killClaw(id: string): void {
    const claw = _claws.get(id);
    if (!claw) return;
    claw.status = 'killed';
    _claws.set(id, claw);
    const ac = _abortControllers.get(id);
    if (ac) ac.abort();
    _persist();
}

/** Resume all frozen claws. */
export function resumeAll(): void {
    _panicActive = false;
    for (const [id, claw] of _claws) {
        if (claw.status === 'frozen') {
            claw.status = 'running';
            _claws.set(id, claw);
            // Fresh abort controller
            _abortControllers.set(id, new AbortController());
        }
    }
    _persist();
}

/** Resume a single claw. */
export function resumeClaw(id: string): void {
    const claw = _claws.get(id);
    if (!claw || claw.status !== 'frozen') return;
    claw.status = 'running';
    _claws.set(id, claw);
    _abortControllers.set(id, new AbortController());

    // Check if any claws are still frozen
    const anyFrozen = Array.from(_claws.values()).some(c => c.status === 'frozen');
    if (!anyFrozen) _panicActive = false;

    _persist();
}

/**
 * WIPEOUT — erase ALL personas and skill sets (NOT workspaces).
 * Requires the confirmation phrase to be provided 3 times.
 * Returns true if wipeout was successful.
 */
export function wipeoutAll(confirmations: string[]): boolean {
    // Verify 3 correct confirmations
    if (
        confirmations.length !== 3 ||
        !confirmations.every(c => c === WIPEOUT_PHRASE)
    ) {
        return false;
    }

    // Erase all personas (leave default)
    const personas = listPersonas();
    for (const p of personas) {
        // We can't delete personas via the current layer API,
        // but we can clear localStorage entries
        try {
            localStorage.removeItem(`ezclaw_persona_${p.id}`);
        } catch { /* silent */ }
    }

    // Erase all skill sets
    const skillSets = listSkillSets();
    for (const ss of skillSets) {
        deleteSkillSet(ss.id);
    }

    // Clear persona/skill bindings from all claws
    for (const [id, claw] of _claws) {
        claw.personaId = null;
        claw.skillSetId = null;
        _claws.set(id, claw);
    }

    // Clear persona list from localStorage
    try {
        localStorage.removeItem('ezclaw_personas');
        localStorage.removeItem('ezclaw_active_persona');
        localStorage.removeItem('ezclaw_skills');
        localStorage.removeItem('ezclaw_skill_sets');
        localStorage.removeItem('ezclaw_active_skill_set');
    } catch { /* silent */ }

    _persist();
    return true;
}

/** Get the wipeout confirmation phrase (for UI display). */
export function getWipeoutPhrase(): string {
    return WIPEOUT_PHRASE;
}

/** Get counts for the sidebar footer. */
export function getClawCounts(): { total: number; running: number; frozen: number; killed: number } {
    let running = 0, frozen = 0, killed = 0;
    for (const claw of _claws.values()) {
        switch (claw.status) {
            case 'running': running++; break;
            case 'frozen': frozen++; break;
            case 'killed': killed++; break;
        }
    }
    return { total: _claws.size, running, frozen, killed };
}
