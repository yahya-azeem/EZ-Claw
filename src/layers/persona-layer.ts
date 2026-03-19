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
export async function getPersona(): Promise<AgentIdentity> {
    return await loadIdentity();
}

/**
 * Get the current user profile.
 */
export async function getUser(): Promise<UserProfile> {
    return await loadUser();
}

/**
 * Update a single identity field and emit update event.
 */
export async function updatePersonaField(field: keyof AgentIdentity, value: any): Promise<AgentIdentity> {
    const updated = await updateIdentityField(field, value);
    _cachedPrompt = null; // Invalidate cached prompt
    emit('persona:updated', { field, value });
    return updated;
}

/**
 * Set a fact on the persona.
 */
export async function setPersonaFact(key: string, value: string): Promise<AgentIdentity> {
    const updated = await setFact(key, value);
    _cachedPrompt = null;
    emit('persona:updated', { fact: key, value });
    return updated;
}

/**
 * Get a fact from the persona.
 */
export async function getPersonaFact(key: string): Promise<string | undefined> {
    return await getFact(key);
}

/**
 * Hot-swap to a different persona. This rebuilds the system prompt
 * without affecting the workspace or skills layers.
 *
 * Returns true if the swap succeeded.
 */
export async function swapPersona(personaId: string): Promise<boolean> {
    const success = await switchPersona(personaId);
    if (success) {
        _cachedPrompt = null;
        emit('persona:swapped', { personaId });
        emit('persona:prompt-rebuilt', { prompt: await getSystemPrompt() });
    }
    return success;
}

/**
 * Create a new persona.
 */
export async function newPersona(label: string, fromCurrent: boolean = false): Promise<PersonaEntry> {
    const entry = await createPersona(label, fromCurrent);
    emit('persona:created', { id: entry.id, label });
    return entry;
}

/**
 * Delete a persona by ID.
 */
export async function removePersona(personaId: string): Promise<boolean> {
    const success = await deletePersona(personaId);
    if (success) emit('persona:deleted', { personaId });
    return success;
}

/**
 * Get the system prompt (cached). Rebuilds on persona swap.
 */
export async function getSystemPrompt(): Promise<string> {
    if (!_cachedPrompt) {
        _cachedPrompt = await isFirstRun() ? buildBootstrapPrompt() : await buildIdentityPrompt();
    }
    return _cachedPrompt;
}

/**
 * Force rebuild the system prompt (e.g., after skill swap).
 */
export async function rebuildPrompt(): Promise<string> {
    _cachedPrompt = null;
    const prompt = await getSystemPrompt();
    emit('persona:prompt-rebuilt', { prompt });
    return prompt;
}

/**
 * Check if this is the first run (bootstrap needed).
 */
export async function needsBootstrap(): Promise<boolean> {
    return await isFirstRun();
}

/**
 * Mark the persona as bootstrapped.
 */
export async function completeBootstrap(): Promise<void> {
    await markBootstrapped();
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
