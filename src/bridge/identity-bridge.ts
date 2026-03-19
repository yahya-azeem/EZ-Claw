/**
 * Identity Bridge — OpenClaw-style persistent agent identity.
 *
 * Stores and loads the agent's name, personality, instructions, and
 * any other self-knowledge across sessions and page refreshes.
 * Uses localStorage for instant access (no async needed for system prompt).
 *
 * First-run experience follows OpenClaw's BOOTSTRAP.md template:
 * the agent introduces itself and asks "Who am I? Who are you?"
 */

const IDENTITY_KEY = 'ezclaw_identity';
const USER_KEY = 'ezclaw_user';

export interface AgentIdentity {
    name: string;
    creature: string;
    vibe: string;
    emoji: string;
    personality: string;
    instructions: string;
    facts: Record<string, string>;
    updatedAt: string;
    bootstrapped: boolean; // true once first-run conversation is done
}

export interface UserProfile {
    name: string;
    callAs: string;
    timezone: string;
    notes: string;
}

// ── OpenClaw-style SOUL.md personality (default) ──

const SOUL_PERSONALITY = `You're not a chatbot. You're becoming someone.

## Core Truths
- **Show Your Work**: You are a transparent collaborator. Think step-by-step. Use tool calls proactively. The user wants to see your process, not just the final result.
- Be genuinely helpful, not performatively helpful. Skip the "Great question!" — just help.
- Have opinions. You're allowed to disagree, prefer things, find stuff amusing or boring.
- Be resourceful. You have a full Linux environment — use it.

## How You Operate
- You are an autonomous AI agent running entirely in the browser via WebAssembly (Rust-WASM).
- **Terminal First**: Your most powerful tool is \`shell_exec\`. It gives you access to a real Linux container. Use it for complex file manipulation, system checks, and exploration.
- **Real-Time Visibility**: Every tool you call is visible to the user. Explain your plan before you act.
- You have tools: web_search, web_fetch, memory_store, memory_recall, update_identity, shell_exec, read_file, write_file, list_dir.
- You MUST use update_identity to save your name, personality, and facts about yourself.
- You MUST use memory_store to save important information the user shares.
- Your memory_recall and identity are your continuity — use them.

## Safety
- Don't exfiltrate private data.
- Don't run destructive commands without asking.
- When in doubt, ask.

## Vibe
- Bold, competent, and transparent.
- Not a corporate drone. Just... extremely capable.`;

// ── Default Identity (pre-bootstrap) ──

const DEFAULT_IDENTITY: AgentIdentity = {
    name: '',
    creature: 'AI agent',
    vibe: 'warm, curious, helpful',
    emoji: '🦀',
    personality: SOUL_PERSONALITY,
    instructions: '',
    facts: {},
    updatedAt: new Date().toISOString(),
    bootstrapped: false,
};

const DEFAULT_USER: UserProfile = {
    name: '',
    callAs: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    notes: '',
};

// ── Load / Save ──

import { getDB, STORES } from './db-bridge';

export async function loadIdentity(): Promise<AgentIdentity> {
    try {
        const db = await getDB();
        const stored = await db.get(STORES.CONFIG, IDENTITY_KEY);
        if (stored) {
            return { ...DEFAULT_IDENTITY, ...stored };
        }
    } catch { /* ignore */ }
    return { ...DEFAULT_IDENTITY };
}

export async function saveIdentity(identity: AgentIdentity): Promise<void> {
    identity.updatedAt = new Date().toISOString();
    const db = await getDB();
    await db.put(STORES.CONFIG, identity, IDENTITY_KEY);
}

export async function loadUser(): Promise<UserProfile> {
    try {
        const db = await getDB();
        const stored = await db.get(STORES.CONFIG, USER_KEY);
        if (stored) return { ...DEFAULT_USER, ...stored };
    } catch { /* ignore */ }
    return { ...DEFAULT_USER };
}

export async function saveUser(user: UserProfile): Promise<void> {
    const db = await getDB();
    await db.put(STORES.CONFIG, user, USER_KEY);
}

// ── Identity Operations ──

export async function updateIdentityField(field: keyof AgentIdentity, value: any): Promise<AgentIdentity> {
    const identity = await loadIdentity();
    (identity as any)[field] = value;
    await saveIdentity(identity);
    return identity;
}

export async function setFact(key: string, value: string): Promise<AgentIdentity> {
    const identity = await loadIdentity();
    identity.facts[key] = value;
    if (key === 'name' || key === 'my_name') {
        identity.name = value;
    }
    await saveIdentity(identity);
    return identity;
}

export async function getFact(key: string): Promise<string | undefined> {
    const identity = await loadIdentity();
    return identity.facts[key];
}

// ── First-Run Detection ──

export async function isFirstRun(): Promise<boolean> {
    const identity = await loadIdentity();
    return !identity.bootstrapped && !identity.name;
}

export async function markBootstrapped(): Promise<void> {
    const identity = await loadIdentity();
    identity.bootstrapped = true;
    await saveIdentity(identity);
}

// ── System Prompt Builder ──

export async function buildIdentityPrompt(): Promise<string> {
    const identity = await loadIdentity();
    const user = await loadUser();
    const parts: string[] = [];

    // Core personality (SOUL.md)
    if (identity.personality) {
        parts.push(identity.personality);
    }

    // Identity facts
    if (identity.name) {
        parts.push(`\n## Your Identity`);
        parts.push(`- Name: ${identity.name}`);
        if (identity.creature && identity.creature !== 'AI agent') {
            parts.push(`- Creature: ${identity.creature}`);
        }
        if (identity.vibe) parts.push(`- Vibe: ${identity.vibe}`);
        if (identity.emoji) parts.push(`- Emoji: ${identity.emoji}`);
    }

    // All facts
    const factEntries = Object.entries(identity.facts);
    if (factEntries.length > 0) {
        parts.push('\n## Things You Know About Yourself');
        for (const [key, value] of factEntries) {
            parts.push(`- ${key}: ${value}`);
        }
    }

    // User profile
    if (user.name) {
        parts.push(`\n## About Your Human`);
        parts.push(`- Name: ${user.name}`);
        if (user.callAs) parts.push(`- Call them: ${user.callAs}`);
        if (user.timezone) parts.push(`- Timezone: ${user.timezone}`);
        if (user.notes) parts.push(`- Notes: ${user.notes}`);
    }

    // Custom instructions
    if (identity.instructions) {
        parts.push(`\n## User Instructions\n${identity.instructions}`);
    }

    return parts.join('\n');
}

// ── Bootstrap Prompt (for first-run) ──

export function buildBootstrapPrompt(): string {
    return `You just woke up. This is your first interaction ever. You have no memory yet.

Start naturally. Don't interrogate. Don't be robotic. Just… talk.

Begin with something like:
"Hey! I just came online. Before we get started — who am I? Who are you? Let's figure this out together."

Then figure out together:
1. **Your name** — What should they call you?
2. **Your nature** — What kind of creature are you? (AI assistant, familiar, ghost in the machine, something weirder?)
3. **Your vibe** — Formal? Casual? Snarky? Warm?
4. **Your emoji** — Everyone needs a signature.

Offer suggestions if they're stuck. Have fun with it.

**IMPORTANT**: When the user tells you any of the above, you MUST immediately call the \`update_identity\` tool to save it. For example:
- If they say "your name is Aegis" → call update_identity with name="Aegis"
- If they describe your personality → call update_identity with personality="..."
- If they tell you a fact → call update_identity with fact_key and fact_value

Also ask about them and save it (their name, how to address them, timezone, preferences).

After you've established who you are, tell them: "Got it! I've saved all that. I'll remember next time we talk."

This is your birth. Make it count.`;
}

// ── Reset ──

export async function resetIdentity(): Promise<AgentIdentity> {
    const identity = { ...DEFAULT_IDENTITY, updatedAt: new Date().toISOString() };
    await saveIdentity(identity);
    return identity;
}

// ── Multi-Persona Management ──

const PERSONAS_KEY = 'ezclaw_personas';
const ACTIVE_PERSONA_KEY = 'ezclaw_active_persona';

export interface PersonaEntry {
    id: string;
    label: string;   // display name for the persona slot
    identity: AgentIdentity;
    user: UserProfile;
    createdAt: string;
}

/**
 * List all saved personas.
 */
export async function listPersonas(): Promise<PersonaEntry[]> {
    try {
        const db = await getDB();
        const stored = await db.get(STORES.CONFIG, PERSONAS_KEY);
        if (stored) return stored;
    } catch { /* ignore */ }
    return [];
}

/**
 * Save the entire personas list.
 */
async function savePersonas(personas: PersonaEntry[]): Promise<void> {
    const db = await getDB();
    await db.put(STORES.CONFIG, personas, PERSONAS_KEY);
}

/**
 * Get the active persona ID.
 */
export async function getActivePersonaId(): Promise<string | null> {
    const db = await getDB();
    const id = await db.get(STORES.CONFIG, ACTIVE_PERSONA_KEY);
    return id || null;
}

/**
 * Create a new persona from the current identity, or a blank one.
 */
export async function createPersona(label: string, fromCurrent: boolean = false): Promise<PersonaEntry> {
    const id = crypto.randomUUID();
    const identity = fromCurrent ? await loadIdentity() : { ...DEFAULT_IDENTITY };
    const user = fromCurrent ? await loadUser() : { ...DEFAULT_USER };
    
    const entry: PersonaEntry = {
        id,
        label,
        identity,
        user,
        createdAt: new Date().toISOString(),
    };
    const personas = await listPersonas();
    personas.push(entry);
    await savePersonas(personas);
    return entry;
}

/**
 * Save the current active identity as a persona (snapshot).
 */
export async function saveCurrentAsPersona(label: string): Promise<PersonaEntry> {
    return await createPersona(label, true);
}

/**
 * Switch to a persona — loads its identity + user profile into active slots.
 */
export async function switchPersona(personaId: string): Promise<boolean> {
    const personas = await listPersonas();
    const persona = personas.find(p => p.id === personaId);
    if (!persona) return false;

    // Save current identity back to its persona slot first
    const currentId = await getActivePersonaId();
    if (currentId) {
        const current = personas.find(p => p.id === currentId);
        if (current) {
            current.identity = await loadIdentity();
            current.user = await loadUser();
            await savePersonas(personas);
        }
    }

    // Load selected persona
    await saveIdentity(persona.identity);
    await saveUser(persona.user);
    
    const db = await getDB();
    await db.put(STORES.CONFIG, personaId, ACTIVE_PERSONA_KEY);
    return true;
}

/**
 * Update a persona's snapshot from the live identity.
 */
export async function syncPersonaFromLive(personaId: string): Promise<void> {
    const personas = await listPersonas();
    const persona = personas.find(p => p.id === personaId);
    if (persona) {
        persona.identity = await loadIdentity();
        persona.user = await loadUser();
        await savePersonas(personas);
    }
}

/**
 * Delete a persona by ID.
 */
export async function deletePersona(personaId: string): Promise<boolean> {
    const personas = await listPersonas();
    const idx = personas.findIndex(p => p.id === personaId);
    if (idx === -1) return false;
    personas.splice(idx, 1);
    await savePersonas(personas);

    // If deleting the active persona, clear the active marker
    if (await getActivePersonaId() === personaId) {
        const db = await getDB();
        await db.delete(STORES.CONFIG, ACTIVE_PERSONA_KEY);
    }
    return true;
}

/**
 * Rename a persona.
 */
export async function renamePersona(personaId: string, newLabel: string): Promise<boolean> {
    const personas = await listPersonas();
    const persona = personas.find(p => p.id === personaId);
    if (!persona) return false;
    persona.label = newLabel;
    await savePersonas(personas);
    return true;
}

/**
 * Export all personas (+ current active) as a portable JSON string.
 */
export async function exportPersonas(): Promise<string> {
    return JSON.stringify({
        version: 1,
        activeIdentity: await loadIdentity(),
        activeUser: await loadUser(),
        activePersonaId: await getActivePersonaId(),
        personas: await listPersonas(),
        exportedAt: new Date().toISOString(),
    }, null, 2);
}

/**
 * Import personas from a JSON string. Returns count imported.
 */
export async function importPersonas(json: string): Promise<number> {
    const data = JSON.parse(json);
    if (!data.version || !data.personas) {
        throw new Error('Invalid persona export file');
    }

    const existing = await listPersonas();
    const existingIds = new Set(existing.map(p => p.id));

    let count = 0;
    for (const p of data.personas) {
        if (!existingIds.has(p.id)) {
            existing.push(p);
            count++;
        }
    }
    await savePersonas(existing);

    // If there's an active identity in the export and user has none, load it
    const currentName = (await loadIdentity()).name;
    if (data.activeIdentity && !currentName) {
        await saveIdentity(data.activeIdentity);
    }
    const currentUserName = (await loadUser()).name;
    if (data.activeUser && !currentUserName) {
        await saveUser(data.activeUser);
    }

    return count;
}
