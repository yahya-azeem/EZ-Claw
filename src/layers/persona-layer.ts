/**
 * Persona Layer — hot-swappable identity/persona management.
 *
 * Wraps identity-bridge.ts and adds event-driven hot-swapping:
 * switching persona rebuilds the agent's system prompt instantly
 * without touching the workspace or skills state.
 *
 * Layer hierarchy:
 *   1. Persona Layer (this) — hot-swappable
 *   2. Skills Layer          — hot-swappable
 *   3. Workspace Layer       — persistent across swaps
 */

import {
    loadIdentity,
    saveIdentity,
    loadUser,
    saveUser,
    buildIdentityPrompt,
    buildBootstrapPrompt,
    isFirstRun,
    markBootstrapped,
    updateIdentityField,
    setFact,
    getFact,
    listPersonas,
    createPersona,
    switchPersona,
    deletePersona,
    renamePersona,
    exportPersonas,
    importPersonas,
    getActivePersonaId,
    saveCurrentAsPersona,
    syncPersonaFromLive,
    type AgentIdentity,
    type UserProfile,
    type PersonaEntry,
} from '../bridge/identity-bridge';

// ── Events ───────────────────────────────────────────────────────

export type PersonaEvent =
    | 'persona:swapped'
    | 'persona:created'
    | 'persona:deleted'
    | 'persona:updated'
    | 'persona:prompt-rebuilt';

type Listener = (data?: any) => void;

const listeners = new Map<PersonaEvent, Set<Listener>>();

function emit(event: PersonaEvent, data?: any): void {
    listeners.get(event)?.forEach((fn) => fn(data));
}

export function onPersonaEvent(event: PersonaEvent, fn: Listener): () => void {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)!.add(fn);
    return () => listeners.get(event)?.delete(fn);
}

// ── Persona Layer API ────────────────────────────────────────────

let _cachedPrompt: string | null = null;

/**
 * Get the current identity (read-through to identity-bridge).
 */
export function getPersona(): AgentIdentity {
    return loadIdentity();
}

/**
 * Get the current user profile.
 */
export function getUser(): UserProfile {
    return loadUser();
}

/**
 * Update a single identity field and emit update event.
 */
export function updatePersonaField(field: keyof AgentIdentity, value: any): AgentIdentity {
    const updated = updateIdentityField(field, value);
    _cachedPrompt = null; // Invalidate cached prompt
    emit('persona:updated', { field, value });
    return updated;
}

/**
 * Set a fact on the persona.
 */
export function setPersonaFact(key: string, value: string): AgentIdentity {
    const updated = setFact(key, value);
    _cachedPrompt = null;
    emit('persona:updated', { fact: key, value });
    return updated;
}

/**
 * Get a fact from the persona.
 */
export function getPersonaFact(key: string): string | undefined {
    return getFact(key);
}

/**
 * Hot-swap to a different persona. This rebuilds the system prompt
 * without affecting the workspace or skills layers.
 *
 * Returns true if the swap succeeded.
 */
export function swapPersona(personaId: string): boolean {
    const success = switchPersona(personaId);
    if (success) {
        _cachedPrompt = null;
        emit('persona:swapped', { personaId });
        emit('persona:prompt-rebuilt', { prompt: getSystemPrompt() });
    }
    return success;
}

/**
 * Create a new persona.
 */
export function newPersona(label: string, fromCurrent: boolean = false): PersonaEntry {
    const entry = createPersona(label, fromCurrent);
    emit('persona:created', { id: entry.id, label });
    return entry;
}

/**
 * Delete a persona by ID.
 */
export function removePersona(personaId: string): boolean {
    const success = deletePersona(personaId);
    if (success) emit('persona:deleted', { personaId });
    return success;
}

/**
 * Get the system prompt (cached). Rebuilds on persona swap.
 */
export function getSystemPrompt(): string {
    if (!_cachedPrompt) {
        _cachedPrompt = isFirstRun() ? buildBootstrapPrompt() : buildIdentityPrompt();
    }
    return _cachedPrompt;
}

/**
 * Force rebuild the system prompt (e.g., after skill swap).
 */
export function rebuildPrompt(): string {
    _cachedPrompt = null;
    const prompt = getSystemPrompt();
    emit('persona:prompt-rebuilt', { prompt });
    return prompt;
}

/**
 * Check if this is the first run (bootstrap needed).
 */
export function needsBootstrap(): boolean {
    return isFirstRun();
}

/**
 * Mark the persona as bootstrapped.
 */
export function completeBootstrap(): void {
    markBootstrapped();
    _cachedPrompt = null;
}

// Re-exports for convenience
export {
    listPersonas,
    getActivePersonaId,
    renamePersona,
    exportPersonas,
    importPersonas,
    saveCurrentAsPersona,
    syncPersonaFromLive,
    saveIdentity,
    saveUser,
    type AgentIdentity,
    type UserProfile,
    type PersonaEntry,
};
