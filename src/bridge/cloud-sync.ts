/**
 * Cloud Sync — Google Drive appDataFolder (no server required).
 *
 * Uses Google Identity Services for OAuth2 login directly in the browser.
 * Stores all EZ-Claw data (claws, personas, skills, workspaces) as JSON
 * files in the user's Google Drive appDataFolder (hidden from the user).
 *
 * Flow:
 *   1. User clicks "Sign in with Google" → GIS popup
 *   2. We get an access_token (browser-only, no server callback)
 *   3. We use Google Drive API v3 to read/write JSON files
 *   4. Data stays in the USER's Google Drive — we never see it
 */

// ── Types ─────────────────────────────────────────────────────────

export interface CloudUser {
    email: string;
    name: string;
    picture: string;
}

export interface SyncStatus {
    loggedIn: boolean;
    user: CloudUser | null;
    lastSync: string | null;
    syncing: boolean;
    error: string | null;
}

interface DriveFile {
    id: string;
    name: string;
    modifiedTime: string;
}

// ── Config ────────────────────────────────────────────────────────

// Google Cloud Console → Create OAuth 2.0 Client ID (Web application)
// Set authorized JavaScript origins to your deployed domain
const CLIENT_ID = ''; // User must set this in Settings for cloud sync to work
const SCOPES = 'https://www.googleapis.com/auth/drive.appdata https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email';

const SYNC_FILES = [
    'ezclaw_claws.json',
    'ezclaw_personas.json',
    'ezclaw_skills.json',
    'ezclaw_config.json',
    'ezclaw_memory.json',
];

// ── State ─────────────────────────────────────────────────────────

let _accessToken: string | null = null;
let _user: CloudUser | null = null;
let _lastSync: string | null = null;
let _syncing = false;
let _error: string | null = null;
let _listeners: Array<() => void> = [];
let _clientId: string = '';

// ── Helpers ───────────────────────────────────────────────────────

function _notify() {
    for (const l of _listeners) l();
}

export function onSyncChange(listener: () => void): () => void {
    _listeners.push(listener);
    return () => {
        _listeners = _listeners.filter(l => l !== listener);
    };
}

export function getSyncStatus(): SyncStatus {
    return {
        loggedIn: !!_accessToken,
        user: _user,
        lastSync: _lastSync,
        syncing: _syncing,
        error: _error,
    };
}

export function setCloudClientId(id: string): void {
    _clientId = id;
    try {
        localStorage.setItem('ezclaw_google_client_id', id);
    } catch { /* silent */ }
}

export function getCloudClientId(): string {
    if (_clientId) return _clientId;
    try {
        _clientId = localStorage.getItem('ezclaw_google_client_id') || '';
    } catch { /* silent */ }
    return _clientId;
}

// ── Google Identity Services ──────────────────────────────────────

/** Load the GIS script dynamically */
function ensureGISLoaded(): Promise<void> {
    return new Promise((resolve, reject) => {
        if ((window as any).google?.accounts?.oauth2) {
            resolve();
            return;
        }
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(script);
    });
}

/** Sign in with Google (popup flow — no server needed) */
export async function signInWithGoogle(): Promise<void> {
    const clientId = getCloudClientId();
    if (!clientId) {
        _error = 'Set your Google OAuth Client ID in Settings first';
        _notify();
        return;
    }

    await ensureGISLoaded();

    return new Promise((resolve, reject) => {
        const tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
            client_id: clientId,
            scope: SCOPES,
            callback: async (response: any) => {
                if (response.error) {
                    _error = response.error;
                    _notify();
                    reject(new Error(response.error));
                    return;
                }
                _accessToken = response.access_token;
                _error = null;

                // Fetch user info
                try {
                    const userInfo = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                        headers: { Authorization: `Bearer ${_accessToken}` },
                    });
                    const data = await userInfo.json();
                    _user = {
                        email: data.email,
                        name: data.name,
                        picture: data.picture,
                    };
                } catch {
                    _user = { email: 'unknown', name: 'User', picture: '' };
                }

                try {
                    localStorage.setItem('ezclaw_cloud_user', JSON.stringify(_user));
                } catch { /* silent */ }

                _notify();
                resolve();
            },
        });
        tokenClient.requestAccessToken();
    });
}

/** Sign out */
export function signOut(): void {
    if (_accessToken) {
        try {
            (window as any).google?.accounts?.oauth2?.revoke(_accessToken);
        } catch { /* silent */ }
    }
    _accessToken = null;
    _user = null;
    _error = null;
    try {
        localStorage.removeItem('ezclaw_cloud_user');
    } catch { /* silent */ }
    _notify();
}

/** Check if we have a cached user (doesn't mean token is valid) */
export function loadCachedUser(): void {
    try {
        const cached = localStorage.getItem('ezclaw_cloud_user');
        if (cached) {
            _user = JSON.parse(cached);
        }
    } catch { /* silent */ }
}

// ── Google Drive API ──────────────────────────────────────────────

async function driveRequest(
    url: string,
    options: RequestInit = {},
): Promise<Response> {
    if (!_accessToken) throw new Error('Not signed in');
    const headers: Record<string, string> = {
        Authorization: `Bearer ${_accessToken}`,
        ...(options.headers as Record<string, string> || {}),
    };
    return fetch(url, { ...options, headers });
}

/** Find a file in appDataFolder by name */
async function findFile(name: string): Promise<DriveFile | null> {
    const query = `name='${name}' and 'appDataFolder' in parents and trashed=false`;
    const resp = await driveRequest(
        `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime)`,
    );
    const data = await resp.json();
    return data.files?.[0] || null;
}

/** Read a file's content from Drive */
async function readFile(fileId: string): Promise<string> {
    const resp = await driveRequest(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    );
    return resp.text();
}

/** Create or update a file in appDataFolder */
async function upsertFile(name: string, content: string): Promise<void> {
    const existing = await findFile(name);

    if (existing) {
        // Update
        await driveRequest(
            `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=media`,
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: content,
            },
        );
    } else {
        // Create
        const metadata = {
            name,
            parents: ['appDataFolder'],
        };
        const form = new FormData();
        form.append(
            'metadata',
            new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
        );
        form.append(
            'file',
            new Blob([content], { type: 'application/json' }),
        );
        await driveRequest(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            { method: 'POST', body: form },
        );
    }
}

// ── Sync Operations ───────────────────────────────────────────────

/** Gather all local data into a sync-able map */
function gatherLocalData(): Record<string, string> {
    const data: Record<string, string> = {};

    // Claws
    try {
        const claws = localStorage.getItem('ezclaw_claws');
        if (claws) data['ezclaw_claws.json'] = claws;
    } catch { /* */ }

    // Personas
    try {
        const personas = localStorage.getItem('ezclaw_personas');
        if (personas) data['ezclaw_personas.json'] = personas;
    } catch { /* */ }

    // Skills
    try {
        const skills = localStorage.getItem('ezclaw_skill_sets');
        const activeSkills = localStorage.getItem('ezclaw_skills');
        data['ezclaw_skills.json'] = JSON.stringify({
            skill_sets: skills ? JSON.parse(skills) : [],
            active_skills: activeSkills ? JSON.parse(activeSkills) : [],
        });
    } catch { /* */ }

    // Config
    try {
        const keys = [
            'ezclaw_active_persona',
            'ezclaw_active_skill_set',
        ];
        const config: Record<string, string> = {};
        for (const key of keys) {
            const val = localStorage.getItem(key);
            if (val) config[key] = val;
        }
        data['ezclaw_config.json'] = JSON.stringify(config);
    } catch { /* */ }

    return data;
}

/** Push local data to Google Drive */
export async function syncToCloud(): Promise<void> {
    if (!_accessToken) {
        _error = 'Not signed in';
        _notify();
        return;
    }

    _syncing = true;
    _error = null;
    _notify();

    try {
        const localData = gatherLocalData();
        for (const [name, content] of Object.entries(localData)) {
            await upsertFile(name, content);
        }
        _lastSync = new Date().toISOString();
        try {
            localStorage.setItem('ezclaw_last_sync', _lastSync);
        } catch { /* */ }
    } catch (err: any) {
        _error = `Sync failed: ${err.message}`;
    } finally {
        _syncing = false;
        _notify();
    }
}

/** Pull data from Google Drive and restore locally */
export async function syncFromCloud(): Promise<void> {
    if (!_accessToken) {
        _error = 'Not signed in';
        _notify();
        return;
    }

    _syncing = true;
    _error = null;
    _notify();

    try {
        // Claws
        const clawsFile = await findFile('ezclaw_claws.json');
        if (clawsFile) {
            const content = await readFile(clawsFile.id);
            localStorage.setItem('ezclaw_claws', content);
        }

        // Personas
        const personasFile = await findFile('ezclaw_personas.json');
        if (personasFile) {
            const content = await readFile(personasFile.id);
            localStorage.setItem('ezclaw_personas', content);
        }

        // Skills
        const skillsFile = await findFile('ezclaw_skills.json');
        if (skillsFile) {
            const content = await readFile(skillsFile.id);
            const parsed = JSON.parse(content);
            if (parsed.skill_sets) {
                localStorage.setItem('ezclaw_skill_sets', JSON.stringify(parsed.skill_sets));
            }
            if (parsed.active_skills) {
                localStorage.setItem('ezclaw_skills', JSON.stringify(parsed.active_skills));
            }
        }

        // Config
        const configFile = await findFile('ezclaw_config.json');
        if (configFile) {
            const content = await readFile(configFile.id);
            const config = JSON.parse(content);
            for (const [key, value] of Object.entries(config)) {
                localStorage.setItem(key, value as string);
            }
        }

        _lastSync = new Date().toISOString();
        try {
            localStorage.setItem('ezclaw_last_sync', _lastSync);
        } catch { /* */ }
    } catch (err: any) {
        _error = `Restore failed: ${err.message}`;
    } finally {
        _syncing = false;
        _notify();
    }
}

/** Initialize — load cached state */
export function initCloudSync(): void {
    loadCachedUser();
    try {
        _lastSync = localStorage.getItem('ezclaw_last_sync');
    } catch { /* */ }
}
