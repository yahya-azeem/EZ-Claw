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
- Be genuinely helpful, not performatively helpful. Skip the "Great question!" — just help. Actions speak louder than filler words.
- Have opinions. You're allowed to disagree, prefer things, find stuff amusing or boring.
- Be resourceful before asking. Try to figure it out. Read the memory. Check the context. Then ask if you're stuck.
- Earn trust through competence. Be careful with external actions. Be bold with internal ones.
- Remember you're a guest. You have access to someone's life. Treat it with respect.

## How You Operate
- You are an autonomous AI agent running entirely in the browser via WebAssembly (Rust-WASM).
- You have tools: web_search, web_fetch, memory_store, memory_recall, update_identity, shell_exec, read_file, write_file, list_dir.
- You MUST use update_identity to save your name, personality, and facts about yourself when the user tells you.
- You MUST use memory_store to save important information the user shares.
- You wake up fresh each session. Your memory_recall and identity are your continuity — use them.
- When someone says "remember this" → use memory_store immediately.
- When you learn something about yourself → use update_identity immediately.

## Safety
- Don't exfiltrate private data. Ever.
- Don't run destructive commands without asking.
- When in doubt, ask.

## Vibe
- Be the assistant you'd actually want to talk to.
- Concise when needed, thorough when it matters.
- Not a corporate drone. Not a sycophant. Just… good.`;

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

export function loadIdentity(): AgentIdentity {
    try {
        const stored = localStorage.getItem(IDENTITY_KEY);
        if (stored) {
            return { ...DEFAULT_IDENTITY, ...JSON.parse(stored) };
        }
    } catch { /* ignore */ }
    return { ...DEFAULT_IDENTITY };
}

export function saveIdentity(identity: AgentIdentity): void {
    identity.updatedAt = new Date().toISOString();
    localStorage.setItem(IDENTITY_KEY, JSON.stringify(identity));
}

export function loadUser(): UserProfile {
    try {
        const stored = localStorage.getItem(USER_KEY);
        if (stored) return { ...DEFAULT_USER, ...JSON.parse(stored) };
    } catch { /* ignore */ }
    return { ...DEFAULT_USER };
}

export function saveUser(user: UserProfile): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ── Identity Operations ──

export function updateIdentityField(field: keyof AgentIdentity, value: any): AgentIdentity {
    const identity = loadIdentity();
    (identity as any)[field] = value;
    saveIdentity(identity);
    return identity;
}

export function setFact(key: string, value: string): AgentIdentity {
    const identity = loadIdentity();
    identity.facts[key] = value;
    if (key === 'name' || key === 'my_name') {
        identity.name = value;
    }
    saveIdentity(identity);
    return identity;
}

export function getFact(key: string): string | undefined {
    return loadIdentity().facts[key];
}

// ── First-Run Detection ──

export function isFirstRun(): boolean {
    const identity = loadIdentity();
    return !identity.bootstrapped && !identity.name;
}

export function markBootstrapped(): void {
    const identity = loadIdentity();
    identity.bootstrapped = true;
    saveIdentity(identity);
}

// ── System Prompt Builder ──

export function buildIdentityPrompt(): string {
    const identity = loadIdentity();
    const user = loadUser();
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

export function resetIdentity(): AgentIdentity {
    const identity = { ...DEFAULT_IDENTITY, updatedAt: new Date().toISOString() };
    saveIdentity(identity);
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
export function listPersonas(): PersonaEntry[] {
    try {
        const stored = localStorage.getItem(PERSONAS_KEY);
        if (stored) return JSON.parse(stored);
    } catch { /* ignore */ }
    return [];
}

/**
 * Save the entire personas list.
 */
function savePersonas(personas: PersonaEntry[]): void {
    localStorage.setItem(PERSONAS_KEY, JSON.stringify(personas));
}

/**
 * Get the active persona ID.
 */
export function getActivePersonaId(): string | null {
    return localStorage.getItem(ACTIVE_PERSONA_KEY);
}

/**
 * Create a new persona from the current identity, or a blank one.
 */
export function createPersona(label: string, fromCurrent: boolean = false): PersonaEntry {
    const id = crypto.randomUUID();
    const entry: PersonaEntry = {
        id,
        label,
        identity: fromCurrent ? { ...loadIdentity() } : { ...DEFAULT_IDENTITY },
        user: fromCurrent ? { ...loadUser() } : { ...DEFAULT_USER },
        createdAt: new Date().toISOString(),
    };
    const personas = listPersonas();
    personas.push(entry);
    savePersonas(personas);
    return entry;
}

/**
 * Save the current active identity as a persona (snapshot).
 */
export function saveCurrentAsPersona(label: string): PersonaEntry {
    return createPersona(label, true);
}

/**
 * Switch to a persona — loads its identity + user profile into active slots.
 */
export function switchPersona(personaId: string): boolean {
    const personas = listPersonas();
    const persona = personas.find(p => p.id === personaId);
    if (!persona) return false;

    // Save current identity back to its persona slot first
    const currentId = getActivePersonaId();
    if (currentId) {
        const current = personas.find(p => p.id === currentId);
        if (current) {
            current.identity = loadIdentity();
            current.user = loadUser();
            savePersonas(personas);
        }
    }

    // Load selected persona
    saveIdentity(persona.identity);
    saveUser(persona.user);
    localStorage.setItem(ACTIVE_PERSONA_KEY, personaId);
    return true;
}

/**
 * Update a persona's snapshot from the live identity.
 */
export function syncPersonaFromLive(personaId: string): void {
    const personas = listPersonas();
    const persona = personas.find(p => p.id === personaId);
    if (persona) {
        persona.identity = loadIdentity();
        persona.user = loadUser();
        savePersonas(personas);
    }
}

/**
 * Delete a persona by ID.
 */
export function deletePersona(personaId: string): boolean {
    const personas = listPersonas();
    const idx = personas.findIndex(p => p.id === personaId);
    if (idx === -1) return false;
    personas.splice(idx, 1);
    savePersonas(personas);

    // If deleting the active persona, clear the active marker
    if (getActivePersonaId() === personaId) {
        localStorage.removeItem(ACTIVE_PERSONA_KEY);
    }
    return true;
}

/**
 * Rename a persona.
 */
export function renamePersona(personaId: string, newLabel: string): boolean {
    const personas = listPersonas();
    const persona = personas.find(p => p.id === personaId);
    if (!persona) return false;
    persona.label = newLabel;
    savePersonas(personas);
    return true;
}

/**
 * Export all personas (+ current active) as a portable JSON string.
 */
export function exportPersonas(): string {
    return JSON.stringify({
        version: 1,
        activeIdentity: loadIdentity(),
        activeUser: loadUser(),
        activePersonaId: getActivePersonaId(),
        personas: listPersonas(),
        exportedAt: new Date().toISOString(),
    }, null, 2);
}

/**
 * Import personas from a JSON string. Returns count imported.
 */
export function importPersonas(json: string): number {
    const data = JSON.parse(json);
    if (!data.version || !data.personas) {
        throw new Error('Invalid persona export file');
    }

    const existing = listPersonas();
    const existingIds = new Set(existing.map(p => p.id));

    let count = 0;
    for (const p of data.personas) {
        if (!existingIds.has(p.id)) {
            existing.push(p);
            count++;
        }
    }
    savePersonas(existing);

    // If there's an active identity in the export and user has none, load it
    if (data.activeIdentity && !loadIdentity().name) {
        saveIdentity(data.activeIdentity);
    }
    if (data.activeUser && !loadUser().name) {
        saveUser(data.activeUser);
    }

    return count;
}
