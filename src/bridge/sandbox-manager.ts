/**
 * Sandbox Manager — Three-tier sandboxed shell execution.
 *
 * Adapted from IronClaw's SandboxPolicy for browser environments:
 *
 * | Tier        | Filesystem       | Network            | Platform           |
 * |-------------|-----------------|--------------------|--------------------|
 * | WASI        | OPFS workspace  | Proxied+allowlist  | All (iPhone safe)  |
 * | CheerpX     | In-VM ext4      | Full (in-VM)       | Desktop only       |
 * | Native CLI  | Real host FS    | Full               | Requires companion |
 *
 * All tiers go through the WASM security pipeline before execution.
 */

import { WASIContainer, detectArchitecture, type CommandResult } from './wasi-container';

export type SandboxTier = 'wasi' | 'cheerpx' | 'native';

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

const DEFAULT_CONFIG: SandboxConfig = {
    tier: 'wasi',
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
            const wasmPath = `/containers/alpine-${arch}.wasm`;
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

    async execute(command: string): Promise<ShellResult> {
        const start = performance.now();

        try {
            const container = await this.getContainer();
            const result: CommandResult = await container.run(command);
            
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

// ── CheerpX Sandbox (Desktop only — full Linux VM in browser) ─────

/**
 * CheerpX provides a full x86 Linux environment in the browser.
 * No JIT on iOS, so desktop only.
 */
class CheerpXSandbox {
    private config: SandboxConfig;
    private vm: any = null;

    constructor(config: SandboxConfig) {
        this.config = config;
    }

    async initialize(): Promise<void> {
        try {
            // Load CheerpX runtime (would be loaded from CDN)
            // const CheerpX = await import('https://cxrtnc.leaningtech.com/1.0.6/cx.esm.js');
            // this.vm = await CheerpX.Linux.create({ mounts: [...] });
            console.log('[EZ-Claw] CheerpX sandbox initialized (placeholder)');
        } catch (err) {
            console.error('[EZ-Claw] CheerpX not available:', err);
            throw new Error('CheerpX not available on this platform');
        }
    }

    async execute(command: string): Promise<ShellResult> {
        const start = performance.now();

        if (!this.vm) {
            return {
                exitCode: 1,
                stdout: '',
                stderr: 'CheerpX VM not initialized. Run initialize() first.\n' +
                    'Note: CheerpX requires desktop browser (no iOS JIT support).\n',
                durationMs: performance.now() - start,
                timedOut: false,
                truncated: false,
            };
        }

        // Execute in CheerpX VM
        try {
            // this.vm.run(command) would be the real call
            return {
                exitCode: 0,
                stdout: `[CheerpX] Would execute: ${command}\n`,
                stderr: '',
                durationMs: performance.now() - start,
                timedOut: false,
                truncated: false,
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
                } catch { /* ignore */ }
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

// ── Sandbox Manager (Orchestrator) ────────────────────────────────

export class SandboxManager {
    private config: SandboxConfig;
    private wasi: WasiSandbox;
    private cheerpx: CheerpXSandbox;
    private native: NativeCLISandbox;
    private outputListeners: ((line: string) => void)[] = [];

    constructor(config: Partial<SandboxConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
        this.wasi = new WasiSandbox(this.config);
        this.cheerpx = new CheerpXSandbox(this.config);
        this.native = new NativeCLISandbox(this.config);
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

    private emit(line: string): void {
        for (const l of this.outputListeners) l(line);
    }

    /** Execute a command through the active sandbox tier. */
    async execute(command: string): Promise<ShellResult> {
        this.emit(`$ ${command}\n`);

        let result: ShellResult;

        switch (this.config.tier) {
            case 'wasi':
                result = await this.wasi.execute(command);
                break;
            case 'cheerpx':
                result = await this.cheerpx.execute(command);
                break;
            case 'native':
                result = await this.native.execute(command);
                break;
        }

        // Emit output to terminal listeners
        if (result.stdout) this.emit(result.stdout);
        if (result.stderr) this.emit(`\x1b[31m${result.stderr}\x1b[0m`); // Red for stderr

        return result;
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

    /** Initialize CheerpX VM. */
    async initCheerpX(): Promise<void> {
        await this.cheerpx.initialize();
    }

    /** Get sandbox status info. */
    getStatus(): { tier: SandboxTier; available: boolean; info: string } {
        switch (this.config.tier) {
            case 'wasi':
                return { tier: 'wasi', available: true, info: 'WASI sandbox (basic commands)' };
            case 'cheerpx':
                return { tier: 'cheerpx', available: false, info: 'CheerpX (desktop only, requires init)' };
            case 'native':
                return { tier: 'native', available: this.native.isConnected, info: this.native.isConnected ? 'Connected to companion' : 'Not connected' };
        }
    }

    /** Mount workspace directory to WASI container. */
    async mountWorkspace(handle: FileSystemDirectoryHandle): Promise<void> {
        if (this.config.tier === 'wasi') {
            await (this.wasi as any).mountWorkspace(handle);
        }
    }

    /** Get container info for WASI tier. */
    getContainerInfo(): any {
        if (this.config.tier === 'wasi') {
            return (this.wasi as any).getContainerInfo?.();
        }
        return null;
    }
}
