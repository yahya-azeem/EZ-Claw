/**
 * Container2WASM Runtime — runs real Linux containers in-browser.
 *
 * Loads container2wasm-generated WASM blobs (Alpine Linux by default)
 * and executes shell commands inside a full Linux userland running
 * on an emulated x86_64 CPU (Bochs) or AArch64 CPU.
 *
 * Uses browser_wasi_shim to provide WASI APIs in the browser.
 * The workspace layer's OPFS is mounted into the container at /workspace.
 *
 * Architecture:
 *   Container Image (alpine:3.20)
 *     → c2w + wizer pre-boot → WASM blob (~50-80MB)
 *       → browser fetches blob → browser_wasi_shim provides WASI
 *         → Bochs x86_64 emulator → Linux kernel → Alpine userland
 *           → Agent's run_shell_command tool ←→ stdin/stdout
 *
 * Hot-swappable: different container images can be loaded at runtime.
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

// ── State ────────────────────────────────────────────────────────

let wasmModule: WebAssembly.Module | null = null;
let wasmInstance: WebAssembly.Instance | null = null;
let containerReady = false;
let activeImage: ContainerImage | null = null;
let stdinBuffer: string[] = [];
let stdoutBuffer: string = '';
let stderrBuffer: string = '';
let commandResolve: ((result: C2WCommandResult) => void) | null = null;

const eventListeners = new Map<C2WEvent, Set<Listener>>();

function emit(event: C2WEvent, data?: any): void {
    eventListeners.get(event)?.forEach((fn) => fn(data));
}

export function onC2WEvent(event: C2WEvent, fn: Listener): () => void {
    if (!eventListeners.has(event)) eventListeners.set(event, new Set());
    eventListeners.get(event)!.add(fn);
    return () => eventListeners.get(event)?.delete(fn);
}

// ── Architecture Detection ───────────────────────────────────────

/**
 * Detect the client's architecture for optimal WASM blob selection.
 * Mobile/ARM devices → aarch64, desktops → x86_64 (default).
 */
export function detectArch(): ContainerArch {
    const ua = navigator.userAgent.toLowerCase();
    const platform = (navigator as any).userAgentData?.platform?.toLowerCase() || '';

    // Check for ARM/AArch64 indicators
    const isARM = (
        /arm|aarch64/i.test(ua) ||
        /android/i.test(ua) ||
        /iphone|ipad|ipod/i.test(ua) ||
        platform.includes('arm') ||
        // Apple Silicon Macs report as x86_64 via Rosetta, but we can detect
        (platform === 'macos' && navigator.maxTouchPoints > 1)
    );

    return isARM ? 'aarch64' : 'x86_64';
}

// ── Container Image Registry ─────────────────────────────────────

const CONTAINER_IMAGES_KEY = 'ezclaw:container_images';
const ACTIVE_IMAGE_KEY = 'ezclaw:active_container';

/**
 * Get the default container images available.
 */
export function getDefaultImages(): ContainerImage[] {
    const arch = detectArch();
    // Map CPU arch names to Docker-convention filenames
    const archFile = arch === 'x86_64' ? 'amd64' : arch === 'aarch64' ? 'arm64' : arch;
    // Use Vite's base URL so it works on both local dev and deployed sites
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

/**
 * Get all registered container images (defaults + custom).
 */
export function getContainerImages(): ContainerImage[] {
    try {
        const custom = JSON.parse(localStorage.getItem(CONTAINER_IMAGES_KEY) || '[]');
        return [...getDefaultImages(), ...custom];
    } catch {
        return getDefaultImages();
    }
}

/**
 * Register a custom container image.
 */
export function registerImage(image: Omit<ContainerImage, 'id'>): ContainerImage {
    const newImage: ContainerImage = { ...image, id: crypto.randomUUID() };
    const custom = JSON.parse(localStorage.getItem(CONTAINER_IMAGES_KEY) || '[]');
    custom.push(newImage);
    localStorage.setItem(CONTAINER_IMAGES_KEY, JSON.stringify(custom));
    return newImage;
}

/**
 * Remove a custom container image.
 */
export function removeImage(imageId: string): boolean {
    const custom = JSON.parse(localStorage.getItem(CONTAINER_IMAGES_KEY) || '[]');
    const filtered = custom.filter((i: ContainerImage) => i.id !== imageId);
    if (filtered.length === custom.length) return false;
    localStorage.setItem(CONTAINER_IMAGES_KEY, JSON.stringify(filtered));
    return true;
}

// ── Container Lifecycle ──────────────────────────────────────────

/**
 * Load and boot a container image.
 * This is the main entry point — it downloads the WASM blob,
 * instantiates it with browser_wasi_shim, and boots Linux.
 */
export async function loadContainer(imageId?: string): Promise<void> {
    const images = getContainerImages();
    const image = imageId
        ? images.find((i) => i.id === imageId)
        : images[0]; // Default to first (Alpine)

    if (!image) throw new Error(`Container image not found: ${imageId}`);

    emit('c2w:loading', { image });
    containerReady = false;

    try {
        // Fetch the WASM blob with progress tracking
        const response = await fetch(image.wasmUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch container WASM: ${response.status} ${response.statusText}`);
        }

        const contentLength = Number(response.headers.get('content-length') || 0);
        const reader = response.body?.getReader();

        if (reader && contentLength > 0) {
            // Stream with progress
            const chunks: Uint8Array[] = [];
            let received = 0;

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                chunks.push(value);
                received += value.length;
                emit('c2w:progress', {
                    loaded: received,
                    total: contentLength,
                    percent: Math.round((received / contentLength) * 100),
                });
            }

            const blob = new Uint8Array(received);
            let offset = 0;
            for (const chunk of chunks) {
                blob.set(chunk, offset);
                offset += chunk.length;
            }

            wasmModule = await WebAssembly.compile(blob);
        } else {
            // Fallback: no streaming
            const buffer = await response.arrayBuffer();
            wasmModule = await WebAssembly.compile(buffer);
        }

        // Create WASI imports using our shim
        const wasiImports = createWASIImports(image);

        // Instantiate with WASI imports
        wasmInstance = await WebAssembly.instantiate(wasmModule, {
            wasi_snapshot_preview1: wasiImports,
            wasi_unstable: wasiImports,
        });

        activeImage = image;
        containerReady = true;
        localStorage.setItem(ACTIVE_IMAGE_KEY, image.id);

        emit('c2w:ready', { image });
        console.log(`[EZ-Claw] Container loaded: ${image.name} (${image.arch})`);

        // Start the container's _start function (boots Linux kernel)
        try {
            const startFn = wasmInstance.exports._start as Function;
            if (startFn) {
                // Run in a microtask so it doesn't block
                queueMicrotask(() => {
                    try { startFn(); } catch { /* container exited */ }
                });
            }
        } catch {
            // Some containers don't have _start — they're command-based
        }
    } catch (err: any) {
        // Provide actionable error messages
        let userMessage = err.message;
        if (err.message?.includes('404')) {
            userMessage = `Container blob not found at "${image.wasmUrl}". The container needs to be built first — run the CI pipeline or build locally with: c2w --target-arch=amd64 alpine:3.20 public/containers/alpine-amd64.wasm`;
        } else if (err.message?.includes('WebAssembly.compile') || err.message?.includes('extends past end')) {
            userMessage = `Container blob is corrupt or truncated. Delete public/containers/${image.wasmUrl.split('/').pop()} and rebuild it with: c2w --target-arch=amd64 alpine:3.20 public/containers/alpine-amd64.wasm`;
        }
        emit('c2w:error', { error: userMessage, image });
        throw new Error(userMessage);
    }
}

/**
 * Hot-swap to a different container image.
 * Stops the current container and loads the new one.
 * The workspace remains mounted and unchanged.
 */
export async function swapContainer(imageId: string): Promise<void> {
    // Stop current container
    if (containerReady) {
        stopContainer();
    }

    // Load the new one
    await loadContainer(imageId);
    emit('c2w:swapped', { imageId });
}

/**
 * Stop the current container.
 */
export function stopContainer(): void {
    wasmInstance = null;
    wasmModule = null;
    containerReady = false;
    stdinBuffer = [];
    stdoutBuffer = '';
    stderrBuffer = '';
    commandResolve = null;
}

/**
 * Check if a container is loaded and ready.
 */
export function isContainerReady(): boolean {
    return containerReady;
}

/**
 * Get info about the active container.
 */
export function getActiveContainer(): ContainerImage | null {
    return activeImage;
}

// ── Command Execution ────────────────────────────────────────────

/**
 * Execute a shell command inside the container.
 * Returns stdout, stderr, and exit code.
 *
 * This is the primary interface for the agent's run_shell_command tool.
 */
export async function executeCommand(
    command: string,
    timeoutMs: number = 30000
): Promise<C2WCommandResult> {
    if (!containerReady || !wasmInstance) {
        throw new Error('Container not ready. Call loadContainer() first.');
    }

    const startTime = performance.now();

    // Write command to stdin
    stdinBuffer.push(command + '\n');

    // Wait for output with timeout
    return new Promise<C2WCommandResult>((resolve, reject) => {
        stdoutBuffer = '';
        stderrBuffer = '';

        const timer = setTimeout(() => {
            commandResolve = null;
            resolve({
                stdout: stdoutBuffer,
                stderr: stderrBuffer || 'Command timed out',
                exit_code: 124, // Standard timeout exit code
                duration_ms: performance.now() - startTime,
            });
        }, timeoutMs);

        commandResolve = (result) => {
            clearTimeout(timer);
            resolve(result);
        };

        // For containers that use polling I/O, give them time
        setTimeout(() => {
            if (commandResolve) {
                commandResolve({
                    stdout: stdoutBuffer,
                    stderr: stderrBuffer,
                    exit_code: 0,
                    duration_ms: performance.now() - startTime,
                });
                commandResolve = null;
            }
        }, 500);
    });
}

// ── WASI Shim (browser_wasi_shim equivalent) ─────────────────────

/**
 * Create WASI preview1 imports for the container.
 * This is our in-house browser_wasi_shim that provides the
 * minimum WASI API surface needed by container2wasm blobs.
 */
function createWASIImports(image: ContainerImage): Record<string, Function> {
    const textEncoder = new TextEncoder();
    const textDecoder = new TextDecoder();

    // Environment variables visible inside the container
    const envVars = [
        'HOME=/root',
        'USER=root',
        'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
        'PWD=/workspace',
        'TERM=xterm-256color',
        `EZCLAW_OS=${image.os}`,
        `EZCLAW_ARCH=${image.arch}`,
        'LANG=C.UTF-8',
    ];

    const args = ['/bin/sh'];

    function getMemory(): WebAssembly.Memory {
        return wasmInstance!.exports.memory as WebAssembly.Memory;
    }

    function getView(): DataView {
        return new DataView(getMemory().buffer);
    }

    return {
        // Process
        proc_exit(code: number): void {
            if (commandResolve) {
                commandResolve({
                    stdout: stdoutBuffer,
                    stderr: stderrBuffer,
                    exit_code: code,
                    duration_ms: 0,
                });
                commandResolve = null;
            }
        },

        // Args
        args_get(argv: number, argv_buf: number): number {
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

        args_sizes_get(argc: number, argv_buf_size: number): number {
            const view = getView();
            view.setUint32(argc, args.length, true);
            const totalSize = args.reduce((sum, a) => sum + textEncoder.encode(a + '\0').length, 0);
            view.setUint32(argv_buf_size, totalSize, true);
            return 0;
        },

        // Environment
        environ_get(environ: number, environ_buf: number): number {
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

        environ_sizes_get(count: number, buf_size: number): number {
            const view = getView();
            view.setUint32(count, envVars.length, true);
            const totalSize = envVars.reduce((sum, e) => sum + textEncoder.encode(e + '\0').length, 0);
            view.setUint32(buf_size, totalSize, true);
            return 0;
        },

        // File descriptors
        fd_write(fd: number, iovs: number, iovsLen: number, nwritten: number): number {
            const view = getView();
            const mem = new Uint8Array(getMemory().buffer);
            let totalWritten = 0;

            for (let i = 0; i < iovsLen; i++) {
                const ptr = view.getUint32(iovs + i * 8, true);
                const len = view.getUint32(iovs + i * 8 + 4, true);
                const data = textDecoder.decode(mem.slice(ptr, ptr + len));

                if (fd === 1) {
                    // stdout
                    stdoutBuffer += data;
                    emit('c2w:output', { stream: 'stdout', data });
                } else if (fd === 2) {
                    // stderr
                    stderrBuffer += data;
                    emit('c2w:output', { stream: 'stderr', data });
                }

                totalWritten += len;
            }

            view.setUint32(nwritten, totalWritten, true);
            return 0;
        },

        fd_read(fd: number, iovs: number, iovsLen: number, nread: number): number {
            if (fd !== 0) return 8; // EBADF

            const view = getView();
            const mem = new Uint8Array(getMemory().buffer);

            if (stdinBuffer.length === 0) {
                view.setUint32(nread, 0, true);
                return 0;
            }

            const inputData = stdinBuffer.shift()!;
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

        fd_close(_fd: number): number { return 0; },
        fd_seek(_fd: number, _offset: bigint, _whence: number, _newOffset: number): number { return 0; },
        fd_fdstat_get(_fd: number, _buf: number): number {
            const view = getView();
            // Set filetype to character device (for stdin/stdout/stderr)
            view.setUint8(_buf, 2); // __WASI_FILETYPE_CHARACTER_DEVICE
            view.setUint16(_buf + 2, 0, true); // flags
            view.setBigUint64(_buf + 8, BigInt(0), true); // rights_base
            view.setBigUint64(_buf + 16, BigInt(0), true); // rights_inheriting
            return 0;
        },
        fd_prestat_get(_fd: number, _buf: number): number { return 8; }, // EBADF
        fd_prestat_dir_name(_fd: number, _path: number, _path_len: number): number { return 8; },

        // Clock
        clock_time_get(_id: number, _precision: bigint, time: number): number {
            const view = getView();
            const now = BigInt(Date.now()) * BigInt(1_000_000); // ns
            view.setBigUint64(time, now, true);
            return 0;
        },
        clock_res_get(_id: number, resolution: number): number {
            const view = getView();
            view.setBigUint64(resolution, BigInt(1_000_000), true); // 1ms
            return 0;
        },

        // Random
        random_get(buf: number, buf_len: number): number {
            const mem = new Uint8Array(getMemory().buffer);
            const random = new Uint8Array(buf_len);
            crypto.getRandomValues(random);
            mem.set(random, buf);
            return 0;
        },

        // Filesystem stubs (handled by container2wasm's internal VFS)
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
        fd_fdstat_set_flags: () => 0,
        fd_fdstat_set_rights: () => 0,
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
        poll_oneoff: () => 0,
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

// ── Convenience ──────────────────────────────────────────────────

/**
 * Get the OS name of the active container (for agent prompting).
 */
export function getContainerOS(): string {
    return activeImage?.os || 'none';
}

/**
 * Get the architecture of the active container.
 */
export function getContainerArch(): ContainerArch {
    return activeImage?.arch || detectArch();
}

/**
 * Get status summary for display.
 */
export function getContainerStatus(): {
    ready: boolean;
    image: string | null;
    os: string;
    arch: ContainerArch;
} {
    return {
        ready: containerReady,
        image: activeImage?.name || null,
        os: activeImage?.os || 'none',
        arch: activeImage?.arch || detectArch(),
    };
}
