import type { WasmModule } from '@bjorn3/browser_wasi_shim';

export interface WASIContainerConfig {
    wasmPath: string;
    mounts: Record<string, FileSystemDirectoryHandle>;
    preopenedDirs?: string[];
}

export interface CommandResult {
    stdout: string;
    stderr: string;
    exit_code: number;
}

export interface ContainerInfo {
    os: string;
    arch: string;
    version: string;
    initialized: boolean;
    mountPoints: string[];
}

export class WASIContainer {
    private instance: WebAssembly.Instance | null = null;
    private module: WebAssembly.Module | null = null;
    private memory: WebAssembly.Memory | null = null;
    private stdinBuffer: string = '';
    private ready: boolean = false;
    private mounts: Map<string, FileSystemDirectoryHandle> = new Map();
    private osInfo: string = 'alpine';
    private stdout: string = '';
    private stderr: string = '';

    static async load(wasmPath: string): Promise<WASIContainer> {
        const container = new WASIContainer();
        const response = await fetch(wasmPath);
        if (!response.ok) {
            throw new Error(`Failed to fetch WASM: ${response.status} ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        container.module = await WebAssembly.compile(buffer);
        return container;
    }

    static async fromBuffer(buffer: ArrayBuffer): Promise<WASIContainer> {
        const container = new WASIContainer();
        container.module = await WebAssembly.compile(buffer);
        return container;
    }

    async start(config?: { mounts?: Record<string, FileSystemDirectoryHandle> }): Promise<void> {
        if (!this.module) throw new Error('WASM module not loaded');

        this.memory = new WebAssembly.Memory({ initial: 256, maximum: 512 });

        if (config?.mounts) {
            for (const [path, handle] of Object.entries(config.mounts)) {
                this.mounts.set(path, handle);
            }
        }

        const textEncoder = new TextEncoder();
        const textDecoder = new TextDecoder();

        const imports = {
            wasi_snapshot_preview1: {
                proc_exit: (code: number) => {
                    throw new Error(`Process exited with code ${code}`);
                },
                fd_write: (fd: number, iovs_ptr: number, iovs_len: number, nwritten_ptr: number): number => {
                    if (!this.memory) return 1;
                    const view = new DataView(this.memory.buffer);
                    let nwritten = 0;
                    for (let i = 0; i < iovs_len; i++) {
                        const ptr = view.getUint32(iovs_ptr + i * 8, true);
                        const len = view.getUint32(iovs_ptr + i * 8 + 4, true);
                        const str = new Uint8Array(this.memory.buffer, ptr, len);
                        const decoded = textDecoder.decode(str);
                        if (fd === 1) {
                            this.stdout += decoded;
                        } else if (fd === 2) {
                            this.stderr += decoded;
                        }
                    }
                    view.setUint32(nwritten_ptr, nwritten, true);
                    return 0;
                },
                fd_read: (fd: number, iovs_ptr: number, iovs_len: number, nread_ptr: number): number => {
                    if (!this.memory) return 1;
                    if (fd !== 0) return 8;
                    const view = new DataView(this.memory.buffer);
                    const input = this.stdinBuffer || '\n';
                    const bytes = textEncoder.encode(input);
                    let offset = 0;
                    for (let i = 0; i < iovs_len && offset < bytes.length; i++) {
                        const ptr = view.getUint32(iovs_ptr + i * 8, true);
                        const len = view.getUint32(iovs_ptr + i * 8 + 4, true);
                        const chunk = bytes.slice(offset, offset + len);
                        new Uint8Array(this.memory.buffer, ptr, chunk.length).set(chunk);
                        offset += chunk.length;
                    }
                    view.setUint32(nread_ptr, offset, true);
                    this.stdinBuffer = '';
                    return 0;
                },
                environ_get: (environ_ptr: number, environ_buf_ptr: number): number => {
                    if (!this.memory) return 1;
                    const view = new DataView(this.memory.buffer);
                    const envVars = ['HOME=/', 'USER=ezclaw', 'PATH=/usr/local/bin:/usr/bin:/bin', 'PWD=/workspace', 'TERM=xterm-256color'];
                    let offset = environ_buf_ptr;
                    for (let i = 0; i < envVars.length; i++) {
                        const bytes = textEncoder.encode(envVars[i] + '\0');
                        view.setUint32(environ_ptr + i * 4, offset, true);
                        new Uint8Array(this.memory.buffer, offset, bytes.length).set(bytes);
                        offset += bytes.length;
                    }
                    return 0;
                },
                environ_sizes_get: (environc_ptr: number, environ_buf_size_ptr: number): number => {
                    if (!this.memory) return 1;
                    const view = new DataView(this.memory.buffer);
                    const envVars = ['HOME=/', 'USER=ezclaw', 'PATH=/usr/local/bin:/usr/bin:/bin', 'PWD=/workspace', 'TERM=xterm-256color'];
                    view.setUint32(environc_ptr, envVars.length, true);
                    const totalSize = envVars.reduce((sum, e) => sum + e.length + 1, 0);
                    view.setUint32(environ_buf_size_ptr, totalSize, true);
                    return 0;
                },
                fd_prestat_get: (fd: number, prestat_ptr: number): number => {
                    return 8;
                },
                fd_prestat_dir_name: (fd: number, path_ptr: number, path_len: number): number => {
                    return 8;
                },
                path_open: (dirfd: number, flags: number, path_ptr: number, path_len: number, o_flags: number, fdflags: number, fd_ptr: number): number => {
                    return 8;
                },
                fd_close: (fd: number): number => {
                    return 0;
                },
                fd_seek: (fd: number, offset: bigint, whence: number, newoffset_ptr: number): number => {
                    return 8;
                },
                fd_fdstat_get: (fd: number, stat_ptr: number): number => {
                    if (!this.memory) return 1;
                    const view = new DataView(this.memory.buffer);
                    view.setUint8(stat_ptr, 0);
                    view.setUint16(stat_ptr + 2, 0, true);
                    view.setBigUint64(stat_ptr + 8, BigInt(0), true);
                    return 0;
                },
            },
        };

        try {
            this.instance = await WebAssembly.instantiate(this.module, imports);
            this.ready = true;
        } catch (e) {
            console.warn('[WASI] Instantiation failed, using fallback shell:', e);
            this.ready = true;
        }
    }

    async run(command: string, args: string[] = [], env: Record<string, string> = {}): Promise<CommandResult> {
        this.stdout = '';
        this.stderr = '';

        if (!this.ready) {
            throw new Error('Container not initialized');
        }

        const parts = [command, ...args];
        const cmd = parts[0];
        const cmdArgs = parts.slice(1);

        if (!this.instance || !this.memory) {
            return this.fallbackExecute(cmd, cmdArgs);
        }

        try {
            const exports = this.instance.exports as any;
            const memory = exports.memory;

            const argv = [command, ...args];
            const argvBuffer = argv.join('\0') + '\0';
            const envVars = Object.entries(env).map(([k, v]) => `${k}=${v}`).join('\0') + '\0';

            const argvPtr = (exports as any).malloc(argvBuffer.length);
            const envPtr = (exports as any).malloc(envVars.length);

            new Uint8Array(memory.buffer, argvPtr, argvBuffer.length).set(textEncoder.encode(argvBuffer));
            new Uint8Array(memory.buffer, envPtr, envVars.length).set(textEncoder.encode(envVars));

            const argvArrayPtr = (exports as any).malloc(argv.length * 4);
            const view = new DataView(memory.buffer);
            for (let i = 0; i < argv.length; i++) {
                view.setUint32(argvArrayPtr + i * 4, argvPtr + (i === 0 ? 0 : argv.slice(0, i).join('\0').length + 1), true);
            }

            if (typeof exports._start === 'function') {
                exports._start();
            }

            return {
                stdout: this.stdout,
                stderr: this.stderr,
                exit_code: 0,
            };
        } catch (e: any) {
            if (e.message?.includes('Process exited')) {
                const match = e.message.match(/code (\d+)/);
                return {
                    stdout: this.stdout,
                    stderr: this.stderr,
                    exit_code: match ? parseInt(match[1]) : 0,
                };
            }
            return this.fallbackExecute(cmd, cmdArgs);
        }
    }

    private fallbackExecute(cmd: string, args: string[]): CommandResult {
        let stdout = '';
        let stderr = '';
        let exitCode = 0;

        switch (cmd) {
            case 'ls':
                stdout = this.listMountedDirs();
                break;
            case 'pwd':
                stdout = '/workspace\n';
                break;
            case 'echo':
                stdout = args.join(' ') + '\n';
                break;
            case 'whoami':
                stdout = 'ezclaw\n';
                break;
            case 'uname':
                stdout = `EZ-Claw WASI ${this.osInfo}\n`;
                break;
            case 'date':
                stdout = new Date().toISOString() + '\n';
                break;
            case 'env':
                stdout = 'HOME=/\nUSER=ezclaw\nPATH=/usr/local/bin:/usr/bin:/bin\nPWD=/workspace\nTERM=xterm-256color\n';
                break;
            case 'cat':
                if (args.length === 0) {
                    stderr = 'cat: missing operand\n';
                    exitCode = 1;
                } else {
                    stdout = `[Use read_file tool for workspace files: ${args[0]}]\n`;
                }
                break;
            case 'sh':
            case 'bash':
                stdout = args.join(' ') + '\n';
                break;
            case 'id':
                stdout = 'uid=0(root) gid=0(root) groups=0(root)\n';
                break;
            case 'hostname':
                stdout = 'ezclaw-wasi\n';
                break;
            case 'arch':
                stdout = 'x86_64\n';
                break;
            case 'help':
                stdout = this.getHelp();
                break;
            default:
                stderr = `${cmd}: command not found in WASI sandbox\n`;
                exitCode = 127;
        }

        return { stdout, stderr, exit_code: exitCode };
    }

    private listMountedDirs(): string {
        if (this.mounts.size === 0) {
            return 'drwxr-xr-x   1 ezclaw ezclaw  4096 .\n';
        }
        let output = 'drwxr-xr-x   1 ezclaw ezclaw  4096 .\ndrwxr-xr-x   1 ezclaw ezclaw  4096 ..\n';
        for (const [path] of this.mounts) {
            output += `drwxr-xr-x   1 ezclaw ezclaw  4096 ${path}\n`;
        }
        return output;
    }

    private getHelp(): string {
        return `EZ-Claw WASI Container - Available Commands:
  ls, pwd, echo, whoami, uname, date, env, cat, id, hostname, arch, help

  Workspace tools (use instead of shell):
    read_file, write_file, list_dir

  For full shell access, use CheerpX or Native CLI tier.
`;
    }

    async mount(path: string, handle: FileSystemDirectoryHandle): Promise<void> {
        this.mounts.set(path, handle);
    }

    async unmount(path: string): Promise<void> {
        this.mounts.delete(path);
    }

    getMounts(): string[] {
        return Array.from(this.mounts.keys());
    }

    isReady(): boolean {
        return this.ready;
    }

    getInfo(): ContainerInfo {
        return {
            os: this.osInfo,
            arch: 'x86_64',
            version: '1.0.0',
            initialized: this.ready,
            mountPoints: this.getMounts(),
        };
    }

    setOS(os: string): void {
        this.osInfo = os;
    }
}

export async function detectArchitecture(): Promise<'amd64' | 'arm64'> {
    const ua = navigator.userAgent;
    if (ua.includes('Arm64') || ua.includes('aarch64') || ua.includes('Mac')) {
        const isAppleSilicon = ua.includes('Mac') && ua.includes('Safari');
        if (isAppleSilicon || ua.includes('Version/16')) return 'arm64';
    }
    return 'amd64';
}

export async function loadOptimalContainer(): Promise<WASIContainer> {
    const arch = await detectArchitecture();
    const wasmPath = `/containers/alpine-${arch}.wasm`;
    try {
        const container = await WASIContainer.load(wasmPath);
        await container.start();
        return container;
    } catch (e) {
        console.warn('[WASI] Failed to load WASM container, using fallback:', e);
        const container = new WASIContainer();
        await container.start();
        return container;
    }
}
