/**
 * Sandbox Manager — Three-tier sandboxed shell execution.
 *
 * Adapted from IronClaw's SandboxPolicy for browser environments:
 *
 * | Tier           | Filesystem       | Network            | Platform           |
 * |----------------|-----------------|--------------------|--------------------|  
 * | container2wasm | VFS + OPFS      | Proxied            | All (primary)      |
 * | WASI (BusyBox) | OPFS workspace  | Proxied+allowlist  | All (fallback)     |
 * | Native CLI     | Real host FS    | Full               | Requires companion |
 *
 * All tiers go through the WASM security pipeline before execution.
 */

import { WASIContainer, detectArchitecture, type CommandResult } from './wasi-container';
import {
    isContainerReady,
    executeCommand as c2wExecute,
    getContainerStatusForSession,
    C2WRuntime,
} from './container2wasm-runtime';

export type SandboxTier = 'container2wasm' | 'wasi' | 'native';

export interface SandboxConfig {
    tier: SandboxTier;
    enabled: boolean;
    /** For native CLI: WebSocket URL to companion app. */
    companionUrl?: string;
    /** Max execution time in ms. */
    timeoutMs: number;
    /** Max output size in bytes. */
    maxOutputBytes: number;
    /** Working directory. */
    cwd: string;
}

export interface ShellResult {
    exitCode: number;
    stdout: string;
    stderr: string;
    durationMs: number;
    timedOut: boolean;
    truncated: boolean;
}

export interface AuditEntry {
    id: string;
    command: string;
    tier: SandboxTier;
    result: ShellResult;
    timestamp: string;
}

const DEFAULT_CONFIG: SandboxConfig = {
    tier: 'container2wasm',
    enabled: false,
    timeoutMs: 30000,
    maxOutputBytes: 100_000,
    cwd: '/',
};

// ── WASI Sandbox (Default — works everywhere inc. iPhone) ─────────

/**
 * WASI sandbox uses a minimal WASM-compiled shell with OPFS filesystem.
 * Capability-based: only the explicitly granted filesystem paths are accessible.
 */
class WasiSandbox {
    private config: SandboxConfig;
    private container: WASIContainer | null = null;
    private containerPromise: Promise<WASIContainer> | null = null;

    constructor(config: SandboxConfig) {
        this.config = config;
    }

    private async getContainer(): Promise<WASIContainer> {
        if (this.container) return this.container;

        if (!this.containerPromise) {
            this.containerPromise = this.initContainer();
        }

        this.container = await this.containerPromise;
        return this.container;
    }

    private async initContainer(): Promise<WASIContainer> {
        const arch = await detectArchitecture();
        const container = new WASIContainer();

        try {
            const base = import.meta.env.BASE_URL || '/';
            const wasmPath = `${base}containers/alpine-${arch}.wasm`.replace(/\/+/g, '/');
            const loadedContainer = await WASIContainer.load(wasmPath);
            await loadedContainer.start();
            console.log('[WASI] Container loaded successfully');
            return loadedContainer;
        } catch (e) {
            console.warn('[WASI] Failed to load WASM, using fallback shell:', e);
            await container.start();
            return container;
        }
    }

    async execute(command: string, timeoutMs: number): Promise<ShellResult> {
        const start = performance.now();

        try {
            const container = await this.getContainer();

            // Enforce timeout
            const resultPromise = container.run(command);
            const timeoutPromise = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('TIMEOUT')), timeoutMs)
            );

            let result: CommandResult;
            try {
                result = await Promise.race([resultPromise, timeoutPromise]);
            } catch (e: any) {
                if (e.message === 'TIMEOUT') {
                    return {
                        exitCode: 124,
                        stdout: '',
                        stderr: `Command timed out after ${timeoutMs}ms`,
                        durationMs: timeoutMs,
                        timedOut: true,
                        truncated: false,
                    };
                }
                throw e;
            }

            return {
                exitCode: result.exit_code,
                stdout: result.stdout.slice(0, this.config.maxOutputBytes),
                stderr: result.stderr.slice(0, this.config.maxOutputBytes),
                durationMs: performance.now() - start,
                timedOut: false,
                truncated: result.stdout.length > this.config.maxOutputBytes,
            };
        } catch (err: any) {
            return {
                exitCode: 1,
                stdout: '',
                stderr: err.message,
                durationMs: performance.now() - start,
                timedOut: false,
                truncated: false,
            };
        }
    }

    async mountWorkspace(handle: FileSystemDirectoryHandle): Promise<void> {
        const container = await this.getContainer();
        await container.mount('/workspace', handle);
    }

    getContainerInfo() {
        return this.container?.getInfo();
    }
}

// ── Native CLI Sandbox (Requires companion app) ──────────────────

/**
 * Native CLI connects to a local ezclaw-node companion via WebSocket.
 * Executes on the real host filesystem with full OS access.
 */
class NativeCLISandbox {
    private config: SandboxConfig;
    private ws: WebSocket | null = null;
    private pendingCommands: Map<string, {
        resolve: (result: ShellResult) => void;
        timeout: number;
    }> = new Map();

    constructor(config: SandboxConfig) {
        this.config = config;
    }

    async connect(): Promise<void> {
        const url = this.config.companionUrl || 'ws://localhost:9229';

        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(url);

            this.ws.onopen = () => {
                console.log('[EZ-Claw] Connected to native CLI companion');
                resolve();
            };

            this.ws.onerror = () => reject(new Error('Failed to connect to native CLI companion'));

            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    const pending = this.pendingCommands.get(data.id);
                    if (pending) {
                        clearTimeout(pending.timeout);
                        this.pendingCommands.delete(data.id);
                        pending.resolve({
                            exitCode: data.exitCode || 0,
                            stdout: (data.stdout || '').slice(0, this.config.maxOutputBytes),
                            stderr: (data.stderr || '').slice(0, this.config.maxOutputBytes),
                            durationMs: data.durationMs || 0,
                            timedOut: false,
                            truncated: (data.stdout || '').length > this.config.maxOutputBytes,
                        });
                    }
                } catch { /* ignore malformed messages */ }
            };

            this.ws.onclose = () => {
                // Reject all pending commands
                for (const [id, pending] of this.pendingCommands) {
                    clearTimeout(pending.timeout);
                    pending.resolve({
                        exitCode: 1,
                        stdout: '',
                        stderr: 'Connection to native CLI companion lost',
                        durationMs: 0,
                        timedOut: false,
                        truncated: false,
                    });
                }
                this.pendingCommands.clear();
            };
        });
    }

    disconnect(): void {
        this.ws?.close();
        this.ws = null;
    }

    async execute(command: string): Promise<ShellResult> {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            return {
                exitCode: 1,
                stdout: '',
                stderr: 'Not connected to native CLI companion.\n' +
                    'Install: npm i -g ezclaw-node && ezclaw-node\n',
                durationMs: 0,
                timedOut: false,
                truncated: false,
            };
        }

        const id = crypto.randomUUID();

        return new Promise((resolve) => {
            const timeout = window.setTimeout(() => {
                this.pendingCommands.delete(id);
                resolve({
                    exitCode: 124,
                    stdout: '',
                    stderr: `Command timed out after ${this.config.timeoutMs}ms`,
                    durationMs: this.config.timeoutMs,
                    timedOut: true,
                    truncated: false,
                });
            }, this.config.timeoutMs);

            this.pendingCommands.set(id, { resolve, timeout });

            this.ws!.send(JSON.stringify({
                id,
                type: 'exec',
                command,
                cwd: this.config.cwd,
                timeoutMs: this.config.timeoutMs,
            }));
        });
    }

    get isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }
}

export class SandboxManager {
    private static instances = new Map<string, SandboxManager>();

    /** Get or create a SandboxManager for a specific session. */
    static getInstance(sessionId: string = 'default'): SandboxManager {
        let instance = this.instances.get(sessionId);
        if (!instance) {
            const rt = C2WRuntime.getInstance(sessionId);
            instance = new SandboxManager({ tier: 'container2wasm', enabled: true }, rt, sessionId);
            this.instances.set(sessionId, instance);
        }
        return instance;
    }

    private config: SandboxConfig;
    private wasi: WasiSandbox;
    private native: NativeCLISandbox;
    private c2w: C2WRuntime | null = null;
    private sessionId: string;
    private outputListeners: ((line: string) => void)[] = [];
    private commandHistory: AuditEntry[] = [];
    private readonly MAX_HISTORY = 500;

    constructor(config: Partial<SandboxConfig> = {}, c2w?: C2WRuntime, sessionId: string = 'default') {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.wasi = new WasiSandbox(this.config);
        this.native = new NativeCLISandbox(this.config);
        this.c2w = c2w || null;
        this.sessionId = sessionId;

        // Forward output from isolated C2W runtime
        if (this.c2w) {
            this.c2w.onEvent('c2w:output', (evt: any) => {
                if (evt.data) this.emit(evt.data);
            });
        }
    }

    /** Set the active sandbox tier. */
    setTier(tier: SandboxTier): void {
        this.config.tier = tier;
    }

    /** Get current config. */
    getConfig(): SandboxConfig {
        return { ...this.config };
    }

    /** Add a listener for output lines (for Terminal.svelte). */
    onOutput(listener: (line: string) => void): void {
        this.outputListeners.push(listener);
    }

    /** Remove an output listener. */
    offOutput(listener: (line: string) => void): void {
        this.outputListeners = this.outputListeners.filter(l => l !== listener);
    }

    private emit(line: string): void {
        for (const l of this.outputListeners) l(line);
    }

    /** Execute a command through the active sandbox tier with timeout enforcement. */
    async execute(command: string): Promise<ShellResult> {
        this.emit(`$ ${command}\n`);

        let result: ShellResult;

        switch (this.config.tier) {
            case 'container2wasm': {
                const runtimeReady = this.c2w ? this.c2w.isReady() : isContainerReady();
                if (runtimeReady) {
                    const start = performance.now();
                    try {
                        const c2wResult = await (this.c2w
                            ? this.c2w.execute(command, this.config.timeoutMs)
                            : c2wExecute(command, this.config.timeoutMs));
                        result = {
                            exitCode: c2wResult.exit_code,
                            stdout: c2wResult.stdout.slice(0, this.config.maxOutputBytes),
                            stderr: c2wResult.stderr.slice(0, this.config.maxOutputBytes),
                            durationMs: c2wResult.duration_ms,
                            timedOut: c2wResult.exit_code === 124,
                            truncated: c2wResult.stdout.length > this.config.maxOutputBytes,
                        };
                    } catch (e: any) {
                        result = {
                            exitCode: 1,
                            stdout: '',
                            stderr: e.message,
                            durationMs: performance.now() - start,
                            timedOut: false,
                            truncated: false,
                        };
                    }
                } else {
                    // Fallback to WASI BusyBox
                    result = await this.wasi.execute(command, this.config.timeoutMs);
                }
                break;
            }
            case 'wasi':
                result = await this.wasi.execute(command, this.config.timeoutMs);
                break;
            case 'native':
                result = await this.native.execute(command);
                break;
            default:
                result = {
                    exitCode: 1,
                    stdout: '',
                    stderr: `Unknown sandbox tier: ${this.config.tier}`,
                    durationMs: 0,
                    timedOut: false,
                    truncated: false,
                };
        }

        // Emit output to terminal listeners
        if (result.stdout) this.emit(result.stdout);
        if (result.stderr) this.emit(`\x1b[31m${result.stderr}\x1b[0m`); // Red for stderr

        // Record in audit log
        this.recordAudit(command, result);

        return result;
    }

    /** Record a command execution in the audit log. */
    private recordAudit(command: string, result: ShellResult): void {
        const entry: AuditEntry = {
            id: crypto.randomUUID(),
            command,
            tier: this.config.tier,
            result,
            timestamp: new Date().toISOString(),
        };
        this.commandHistory.push(entry);
        if (this.commandHistory.length > this.MAX_HISTORY) {
            this.commandHistory = this.commandHistory.slice(-this.MAX_HISTORY);
        }
    }

    /** Get command execution history (audit log). */
    getHistory(): AuditEntry[] {
        return [...this.commandHistory];
    }

    /** Clear command history. */
    clearHistory(): void {
        this.commandHistory = [];
    }

    /** Connect native CLI companion. */
    async connectNative(url?: string): Promise<void> {
        if (url) this.config.companionUrl = url;
        await this.native.connect();
    }

    /** Disconnect native CLI. */
    disconnectNative(): void {
        this.native.disconnect();
    }

    /** Check if native CLI is connected. */
    get isNativeConnected(): boolean {
        return this.native.isConnected;
    }

    /**
     * Boot the container2wasm Linux container.
     * Downloads the WASM image (~60MB) and starts the emulated Linux kernel.
     * Must be called before container2wasm tier commands will work.
     */
    async bootContainer(imageId?: string): Promise<void> {
        if (!this.c2w) {
            this.c2w = C2WRuntime.getInstance(this.sessionId);
            // Forward output events
            this.c2w.onEvent('c2w:output', (evt: any) => {
                if (evt?.data) this.emit(evt.data);
            });
        }
        if (this.c2w.isReady()) return; // Already booted
        await this.c2w.loadContainer(imageId);
    }

    /** Check if the container2wasm runtime is booted and ready. */
    get isContainerBooted(): boolean {
        return this.c2w?.isReady() ?? false;
    }

    /**
     * Subscribe to C2WRuntime events (c2w:loading, c2w:ready, c2w:progress, c2w:error).
     * Returns an unsubscribe function.
     */
    onC2WEvent(event: import('./container2wasm-runtime').C2WEvent, fn: (data?: any) => void): () => void {
        if (!this.c2w) {
            this.c2w = C2WRuntime.getInstance(this.sessionId);
            // Forward output events
            this.c2w.onEvent('c2w:output', (evt: any) => {
                if (evt?.data) this.emit(evt.data);
            });
        }
        return this.c2w.onEvent(event, fn);
    }

    /** Get sandbox status info. */
    getStatus(): { tier: SandboxTier; available: boolean; info: string } {
        switch (this.config.tier) {
            case 'container2wasm': {
                const status = getContainerStatusForSession(this.sessionId);
                if (status.ready) {
                    return { tier: 'container2wasm', available: true, info: `${status.os} Linux (${status.arch}) via container2wasm` };
                }
                return { tier: 'container2wasm', available: true, info: 'BusyBox fallback (container not loaded)' };
            }
            case 'wasi':
                return { tier: 'wasi', available: true, info: 'WASI sandbox (BusyBox shell + OPFS workspace)' };
            case 'native':
                return { tier: 'native', available: this.native.isConnected, info: this.native.isConnected ? 'Connected to companion' : 'Not connected' };
            default:
                return { tier: this.config.tier, available: false, info: 'Unknown tier' };
        }
    }

    /** Mount workspace directory to WASI container. */
    async mountWorkspace(handle: FileSystemDirectoryHandle): Promise<void> {
        await this.wasi.mountWorkspace(handle);
    }

    /** Get container info for WASI tier. */
    getContainerInfo(): any {
        if (this.config.tier === 'wasi') {
            return this.wasi.getContainerInfo();
        }
        return null;
    }
}
