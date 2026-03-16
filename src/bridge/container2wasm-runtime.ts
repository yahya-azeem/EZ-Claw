/**
 * Container2WASM Runtime — runs real Linux containers in-browser.
 *
 * Loads container2wasm-generated WASM blobs (Alpine Linux by default)
 * and executes shell commands inside a full Linux userland running
 * on an emulated x86_64 CPU (Bochs) or AArch64 CPU.
 *
 * Uses browser_wasi_shim to provide WASI APIs in the browser.
 * The workspace layer's OPFS is mounted into the container at /workspace.
 */

import { getWorkspaceHandle } from '../layers/workspace-layer';

// ── Types ────────────────────────────────────────────────────────

export interface ContainerImage {
    id: string;
    name: string;
    os: string;
    arch: ContainerArch;
    wasmUrl: string;
    size?: string;
    description: string;
}

export type ContainerArch = 'x86_64' | 'aarch64' | 'riscv64';

export interface C2WCommandResult {
    stdout: string;
    stderr: string;
    exit_code: number;
    duration_ms: number;
}

export type C2WEvent =
    | 'c2w:loading'
    | 'c2w:ready'
    | 'c2w:error'
    | 'c2w:output'
    | 'c2w:swapped'
    | 'c2w:progress';

type Listener = (data?: any) => void;

export class C2WRuntime {
    private static instances = new Map<string, C2WRuntime>();

    /** Get or create a runtime for a specific session ID to ensure isolation. */
    static getInstance(sessionId: string = 'default'): C2WRuntime {
        let instance = this.instances.get(sessionId);
        if (!instance) {
            instance = new C2WRuntime();
            this.instances.set(sessionId, instance);
        }
        return instance;
    }

    private worker: Worker | null = null;
    private commandPromise: { resolve: (res: C2WCommandResult) => void; reject: (err: any) => void } | null = null;
    private wasmModule: WebAssembly.Module | null = null;
    private wasmInstance: WebAssembly.Instance | null = null;
    private containerReady = false;
    private activeImage: ContainerImage | null = null;
    private stdinBuffer: string[] = [];
    private stdoutBuffer: string = '';
    private stderrBuffer: string = '';
    private commandResolve: ((result: C2WCommandResult) => void) | null = null;
    private eventListeners = new Map<C2WEvent, Set<Listener>>();

    constructor() {}

    private initWorker() {
        if (this.worker) return;
        
        const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || './';
        const workerUrl = `${base}c2w-worker.js`.replace(/\/+/g, '/');
        
        console.log(`[EZ-Claw] Initializing C2W Worker at ${workerUrl}`);
        this.worker = new Worker(workerUrl, { type: 'module' });

        this.worker.onmessage = (e) => {
            const { type, payload } = e.data;
            switch (type) {
                case 'ready':
                    this.containerReady = true;
                    this.emit('c2w:ready', { image: this.activeImage });
                    break;
                case 'progress':
                    this.emit('c2w:progress', payload);
                    break;
                case 'output':
                    this.emit('c2w:output', payload);
                    break;
                case 'result':
                    if (this.commandPromise) {
                        this.commandPromise.resolve(payload);
                        this.commandPromise = null;
                    }
                    break;
                case 'error':
                    this.emit('c2w:error', { error: payload.message, image: this.activeImage });
                    if (this.commandPromise) {
                        this.commandPromise.reject(new Error(payload.message));
                        this.commandPromise = null;
                    }
                    break;
            }
        };

        this.worker.onerror = (e) => {
            console.error('[EZ-Claw] Worker error:', e);
            this.emit('c2w:error', { error: 'Worker failed to load or crashed', image: this.activeImage });
        };
    }

    private emit(event: C2WEvent, data?: any): void {
        this.eventListeners.get(event)?.forEach((fn) => fn(data));
    }

    onEvent(event: C2WEvent, fn: Listener): () => void {
        if (!this.eventListeners.has(event)) this.eventListeners.set(event, new Set());
        this.eventListeners.get(event)!.add(fn);
        return () => this.eventListeners.get(event)?.delete(fn);
    }

    // ── Container Lifecycle ──────────────────────────────────────────

    async loadContainer(imageId?: string): Promise<void> {
        const images = getContainerImages();
        const image = imageId
            ? images.find((i) => i.id === imageId)
            : images[0];

        if (!image) throw new Error(`Container image not found: ${imageId}`);

        this.activeImage = image;
        this.emit('c2w:loading', { image });
        this.containerReady = false;

        this.initWorker();
        this.worker!.postMessage({ type: 'load', payload: { image } });

        // Wait for the worker to signal ready or error
        return new Promise<void>((resolve, reject) => {
            const offReady = this.onEvent('c2w:ready', () => {
                offReady();
                offError();
                resolve();
            });
            const offError = this.onEvent('c2w:error', (data: any) => {
                offReady();
                offError();
                reject(new Error(data?.error || 'Container failed to load'));
            });
        });
    }

    async swapContainer(imageId: string): Promise<void> {
        this.stopContainer();
        await this.loadContainer(imageId);
        this.emit('c2w:swapped', { imageId });
    }

    stopContainer(): void {
        if (this.worker) {
            this.worker.terminate();
            this.worker = null;
        }
        this.containerReady = false;
        this.activeImage = null;
        this.stdinBuffer = [];
        this.stdoutBuffer = '';
        this.stderrBuffer = '';
        this.commandResolve = null;
        this.commandPromise = null;
    }

    isReady(): boolean { return this.containerReady; }
    getActiveImage(): ContainerImage | null { return this.activeImage; }

    // ── Command Execution ────────────────────────────────────────────

    async execute(command: string, timeoutMs: number = 30000): Promise<C2WCommandResult> {
        if (!this.containerReady || !this.worker) {
            throw new Error('Container not ready. Call loadContainer() first.');
        }

        return new Promise<C2WCommandResult>((resolve, reject) => {
            this.commandPromise = { resolve, reject };
            this.worker!.postMessage({ type: 'execute', payload: { command, timeoutMs } });
        });
    }

    // ── WASI Shim ────────────────────────────────────────────────────

    private createWASIImports(image: ContainerImage): Record<string, Function> {
        const textEncoder = new TextEncoder();
        const textDecoder = new TextDecoder();
        const envVars = [
            'HOME=/root', 'USER=root', 'PWD=/workspace', 'TERM=xterm-256color',
            `EZCLAW_OS=${image.os}`, `EZCLAW_ARCH=${image.arch}`, 'LANG=C.UTF-8',
            'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
        ];
        const args = ['/bin/sh'];

        const getMemory = () => this.wasmInstance!.exports.memory as WebAssembly.Memory;
        const getView = () => new DataView(getMemory().buffer);

        return {
            proc_exit: (code: number) => {
                if (this.commandResolve) {
                    this.commandResolve({
                        stdout: this.stdoutBuffer, stderr: this.stderrBuffer,
                        exit_code: code, duration_ms: 0
                    });
                    this.commandResolve = null;
                }
            },
            args_get: (argv: number, argv_buf: number) => {
                const view = getView();
                const mem = new Uint8Array(getMemory().buffer);
                let bufOffset = argv_buf;
                for (let i = 0; i < args.length; i++) {
                    view.setUint32(argv + i * 4, bufOffset, true);
                    const encoded = textEncoder.encode(args[i] + '\0');
                    mem.set(encoded, bufOffset);
                    bufOffset += encoded.length;
                }
                return 0;
            },
            args_sizes_get: (argc: number, argv_buf_size: number) => {
                const view = getView();
                view.setUint32(argc, args.length, true);
                const totalSize = args.reduce((sum, a) => sum + textEncoder.encode(a + '\0').length, 0);
                view.setUint32(argv_buf_size, totalSize, true);
                return 0;
            },
            environ_get: (environ: number, environ_buf: number) => {
                const view = getView();
                const mem = new Uint8Array(getMemory().buffer);
                let bufOffset = environ_buf;
                for (let i = 0; i < envVars.length; i++) {
                    view.setUint32(environ + i * 4, bufOffset, true);
                    const encoded = textEncoder.encode(envVars[i] + '\0');
                    mem.set(encoded, bufOffset);
                    bufOffset += encoded.length;
                }
                return 0;
            },
            environ_sizes_get: (count: number, buf_size: number) => {
                const view = getView();
                view.setUint32(count, envVars.length, true);
                const totalSize = envVars.reduce((sum, e) => sum + textEncoder.encode(e + '\0').length, 0);
                view.setUint32(buf_size, totalSize, true);
                return 0;
            },
            fd_write: (fd: number, iovs: number, iovsLen: number, nwritten: number) => {
                const view = getView();
                const mem = new Uint8Array(getMemory().buffer);
                let totalWritten = 0;
                for (let i = 0; i < iovsLen; i++) {
                    const ptr = view.getUint32(iovs + i * 8, true);
                    const len = view.getUint32(iovs + i * 8 + 4, true);
                    const data = textDecoder.decode(mem.slice(ptr, ptr + len));
                    if (fd === 1) {
                        this.stdoutBuffer += data;
                        this.emit('c2w:output', { stream: 'stdout', data });
                    } else if (fd === 2) {
                        this.stderrBuffer += data;
                        this.emit('c2w:output', { stream: 'stderr', data });
                    }
                    totalWritten += len;
                }
                view.setUint32(nwritten, totalWritten, true);
                return 0;
            },
            fd_read: (fd: number, iovs: number, iovsLen: number, nread: number) => {
                if (fd !== 0) return 8; // EBADF
                const view = getView();
                const mem = new Uint8Array(getMemory().buffer);
                if (this.stdinBuffer.length === 0) {
                    view.setUint32(nread, 0, true);
                    return 0;
                }
                const inputData = this.stdinBuffer.shift()!;
                const inputBytes = textEncoder.encode(inputData);
                let totalRead = 0;
                for (let i = 0; i < iovsLen && totalRead < inputBytes.length; i++) {
                    const ptr = view.getUint32(iovs + i * 8, true);
                    const len = view.getUint32(iovs + i * 8 + 4, true);
                    const chunk = inputBytes.slice(totalRead, totalRead + len);
                    mem.set(chunk, ptr);
                    totalRead += chunk.length;
                }
                view.setUint32(nread, totalRead, true);
                return 0;
            },
            fd_close: (_fd: number) => 0,
            fd_seek: (_fd: number, _offset: bigint, _whence: number, _newOffset: number) => 0,
            fd_fdstat_get: (_fd: number, _buf: number) => {
                const view = getView();
                view.setUint8(_buf, 2); // CHARACTER_DEVICE
                view.setUint16(_buf + 2, 0, true);
                view.setBigUint64(_buf + 8, BigInt(0), true);
                view.setBigUint64(_buf + 16, BigInt(0), true);
                return 0;
            },
            fd_fdstat_set_flags: (_fd: number, _flags: number) => 0,
            fd_fdstat_set_rights: (_fd: number, _base: bigint, _inh: bigint) => 0,
            fd_prestat_get: (_fd: number, _buf: number) => 8, // EBADF
            fd_prestat_dir_name: (_fd: number, _path: number, _path_len: number) => 8,
            clock_time_get: (_id: number, _prec: bigint, time: number) => {
                getView().setBigUint64(time, BigInt(Date.now()) * BigInt(1_000_000), true);
                return 0;
            },
            clock_res_get: (_id: number, res: number) => {
                getView().setBigUint64(res, BigInt(1_000_000), true);
                return 0;
            },
            random_get: (buf: number, len: number) => {
                const mem = new Uint8Array(getMemory().buffer);
                const random = new Uint8Array(len);
                crypto.getRandomValues(random);
                mem.set(random, buf);
                return 0;
            },
            poll_oneoff: (_inPtr: number, _outPtr: number, _n: number, resPtr: number) => {
                getView().setUint32(resPtr, 0, true);
                return 0;
            },
            path_open: () => 44, // ENOENT
            path_create_directory: () => 0,
            path_remove_directory: () => 0,
            path_unlink_file: () => 0,
            path_rename: () => 0,
            path_filestat_get: () => 0,
            path_readlink: () => 44,
            fd_readdir: () => 0,
            fd_filestat_get: () => 0,
            fd_filestat_set_size: () => 0,
            fd_filestat_set_times: () => 0,
            fd_allocate: () => 0,
            fd_advise: () => 0,
            fd_datasync: () => 0,
            fd_sync: () => 0,
            fd_tell: () => 0,
            fd_pread: () => 0,
            fd_pwrite: () => 0,
            fd_renumber: () => 0,
            path_filestat_set_times: () => 0,
            path_link: () => 0,
            path_symlink: () => 0,
            sched_yield: () => 0,
            sock_accept: () => 58, // ENOTSOCK
            sock_recv: () => 58,
            sock_send: () => 58,
            sock_shutdown: () => 58,
            sock_open: () => 58,
            sock_connect: () => 58,
            sock_listen: () => 58,
            sock_bind: () => 58,
            sock_getlocaladdr: () => 58,
            sock_getpeeraddr: () => 58,
            sock_setsockopt: () => 58,
            sock_getsockopt: () => 58,
        };
    }
}

// ── Architecture Detection ───────────────────────────────────────

/**
 * Detect the client's architecture for optimal WASM blob selection.
 */
export function detectArch(): ContainerArch {
    const ua = navigator.userAgent.toLowerCase();
    const platform = (navigator as any).userAgentData?.platform?.toLowerCase() || '';
    const isARM = (
        /arm|aarch64/i.test(ua) ||
        /android/i.test(ua) ||
        /iphone|ipad|ipod/i.test(ua) ||
        platform.includes('arm') ||
        (platform === 'macos' && navigator.maxTouchPoints > 1)
    );
    return isARM ? 'aarch64' : 'x86_64';
}

// ── Container Image Registry ─────────────────────────────────────

const CONTAINER_IMAGES_KEY = 'ezclaw:container_images';
const ACTIVE_IMAGE_KEY = 'ezclaw:active_container';

export function getDefaultImages(): ContainerImage[] {
    const arch = detectArch();
    const archFile = arch === 'x86_64' ? 'amd64' : arch === 'aarch64' ? 'arm64' : arch;
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || './';
    return [
        {
            id: 'alpine-default',
            name: 'Alpine Linux',
            os: 'alpine',
            arch,
            wasmUrl: `${base}containers/alpine-${archFile}.wasm`,
            size: '~60MB',
            description: 'Lightweight Linux with apk package manager. Default container.',
        },
    ];
}

export function getContainerImages(): ContainerImage[] {
    try {
        const custom = JSON.parse(localStorage.getItem(CONTAINER_IMAGES_KEY) || '[]');
        return [...getDefaultImages(), ...custom];
    } catch {
        return getDefaultImages();
    }
}

export function registerImage(image: Omit<ContainerImage, 'id'>): ContainerImage {
    const newImage = { ...image, id: crypto.randomUUID() };
    const custom = JSON.parse(localStorage.getItem(CONTAINER_IMAGES_KEY) || '[]');
    custom.push(newImage);
    localStorage.setItem(CONTAINER_IMAGES_KEY, JSON.stringify(custom));
    return newImage;
}

export function removeImage(imageId: string): boolean {
    const custom = JSON.parse(localStorage.getItem(CONTAINER_IMAGES_KEY) || '[]');
    const filtered = custom.filter((i: any) => i.id !== imageId);
    if (filtered.length === custom.length) return false;
    localStorage.setItem(CONTAINER_IMAGES_KEY, JSON.stringify(filtered));
    return true;
}

// ── Default Singleton Instance ───────────────────────────────────

const defaultRuntime = new C2WRuntime();

export function onC2WEvent(event: C2WEvent, fn: Listener): () => void {
    return defaultRuntime.onEvent(event, fn);
}

export async function loadContainer(imageId?: string): Promise<void> {
    return defaultRuntime.loadContainer(imageId);
}

export async function swapContainer(imageId: string): Promise<void> {
    return defaultRuntime.swapContainer(imageId);
}

export function stopContainer(): void {
    defaultRuntime.stopContainer();
}

export function isContainerReady(): boolean {
    return defaultRuntime.isReady();
}

export function getActiveContainer(): ContainerImage | null {
    return defaultRuntime.getActiveImage();
}

export async function executeCommand(command: string, timeoutMs: number = 30000): Promise<C2WCommandResult> {
    return defaultRuntime.execute(command, timeoutMs);
}

export function getContainerOS(): string {
    return defaultRuntime.getActiveImage()?.os || 'none';
}

export function getContainerArch(): ContainerArch {
    return defaultRuntime.getActiveImage()?.arch || detectArch();
}

export function getContainerStatusForSession(sessionId: string | null): {
    ready: boolean;
    image: string | null;
    os: string;
    arch: ContainerArch;
} {
    const rt = C2WRuntime.getInstance(sessionId || "default");
    return {
        ready: rt.isReady(),
        image: rt.getActiveImage()?.name || null,
        os: rt.getActiveImage()?.os || 'none',
        arch: rt.getActiveImage()?.arch || detectArch(),
    };
}
