// WASI Container — browser-based WebAssembly container with fallback shell

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

// Shared environment variables (used in environ_get and environ_sizes_get)
const WASI_ENV_VARS = ['HOME=/', 'USER=ezclaw', 'PATH=/usr/local/bin:/usr/bin:/bin', 'PWD=/workspace', 'TERM=xterm-256color'];

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
    private textEncoder = new TextEncoder();
    private textDecoder = new TextDecoder();

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
        if (!this.module) {
            // No WASM module loaded — run in fallback shell mode
            this.ready = true;
            return;
        }

        this.memory = new WebAssembly.Memory({ initial: 256, maximum: 512 });

        if (config?.mounts) {
            for (const [path, handle] of Object.entries(config.mounts)) {
                this.mounts.set(path, handle);
            }
        }

        const textEncoder = this.textEncoder;
        const textDecoder = this.textDecoder;

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
                        nwritten += len;
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
                    let offset = environ_buf_ptr;
                    for (let i = 0; i < WASI_ENV_VARS.length; i++) {
                        const bytes = textEncoder.encode(WASI_ENV_VARS[i] + '\0');
                        view.setUint32(environ_ptr + i * 4, offset, true);
                        new Uint8Array(this.memory.buffer, offset, bytes.length).set(bytes);
                        offset += bytes.length;
                    }
                    return 0;
                },
                environ_sizes_get: (environc_ptr: number, environ_buf_size_ptr: number): number => {
                    if (!this.memory) return 1;
                    const view = new DataView(this.memory.buffer);
                    view.setUint32(environc_ptr, WASI_ENV_VARS.length, true);
                    const totalSize = WASI_ENV_VARS.reduce((sum, e) => sum + e.length + 1, 0);
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

        // If no args provided, split the command string on whitespace
        // e.g. run("uname -a") → cmd="uname", cmdArgs=["-a"]
        let parts: string[];
        if (args.length === 0) {
            parts = command.trim().split(/\s+/);
        } else {
            parts = [command, ...args];
        }
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

            new Uint8Array(memory.buffer, argvPtr, argvBuffer.length).set(this.textEncoder.encode(argvBuffer));
            new Uint8Array(memory.buffer, envPtr, envVars.length).set(this.textEncoder.encode(envVars));

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

    // ── In-memory virtual filesystem for fallback shell ──
    private vfs: Map<string, { content: string; isDir: boolean; mtime: number }> = new Map([
        ['/', { content: '', isDir: true, mtime: Date.now() }],
        ['/workspace', { content: '', isDir: true, mtime: Date.now() }],
        ['/tmp', { content: '', isDir: true, mtime: Date.now() }],
        ['/home', { content: '', isDir: true, mtime: Date.now() }],
        ['/home/ezclaw', { content: '', isDir: true, mtime: Date.now() }],
    ]);
    private cwd: string = '/workspace';
    private shellVars: Map<string, string> = new Map([
        ['HOME', '/home/ezclaw'],
        ['USER', 'ezclaw'],
        ['SHELL', '/bin/sh'],
    ]);

    private normalizePath(p: string): string {
        if (!p.startsWith('/')) p = this.cwd + '/' + p;
        const parts = p.split('/').filter(Boolean);
        const stack: string[] = [];
        for (const part of parts) {
            if (part === '..') stack.pop();
            else if (part !== '.') stack.push(part);
        }
        return '/' + stack.join('/');
    }

    private fallbackExecute(cmd: string, args: string[]): CommandResult {
        // Handle pipes
        const fullCmd = [cmd, ...args].join(' ');
        if (fullCmd.includes(' | ')) {
            return this.executePipeline(fullCmd);
        }

        // Handle output redirection
        let redirectFile: string | null = null;
        let appendMode = false;
        const filteredArgs: string[] = [];
        for (let i = 0; i < args.length; i++) {
            if (args[i] === '>>' && i + 1 < args.length) {
                redirectFile = args[i + 1]; appendMode = true; i++; continue;
            }
            if (args[i] === '>' && i + 1 < args.length) {
                redirectFile = args[i + 1]; appendMode = false; i++; continue;
            }
            if (args[i].startsWith('>>')) {
                redirectFile = args[i].slice(2); appendMode = true; continue;
            }
            if (args[i].startsWith('>')) {
                redirectFile = args[i].slice(1); appendMode = false; continue;
            }
            filteredArgs.push(args[i]);
        }

        const result = this.executeCommand(cmd, filteredArgs);

        // Apply redirection
        if (redirectFile && result.exit_code === 0) {
            const path = this.normalizePath(redirectFile);
            const existing = this.vfs.get(path);
            if (appendMode && existing && !existing.isDir) {
                existing.content += result.stdout;
                existing.mtime = Date.now();
            } else {
                this.vfs.set(path, { content: result.stdout, isDir: false, mtime: Date.now() });
            }
            result.stdout = '';
        }

        return result;
    }

    private executePipeline(fullCmd: string): CommandResult {
        const commands = fullCmd.split(' | ').map(s => s.trim());
        let input = '';
        let lastResult: CommandResult = { stdout: '', stderr: '', exit_code: 0 };
        for (const cmdStr of commands) {
            const parts = cmdStr.split(/\s+/);
            const c = parts[0];
            const a = parts.slice(1);
            this.stdinBuffer = input;
            lastResult = this.executeCommand(c, a);
            input = lastResult.stdout;
        }
        return lastResult;
    }

    private executeCommand(cmd: string, args: string[]): CommandResult {
        let stdout = '';
        let stderr = '';
        let exitCode = 0;

        switch (cmd) {
            case 'ls': {
                const target = args.length > 0 ? this.normalizePath(args[args.length - 1]) : this.cwd;
                const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al');
                const longForm = args.includes('-l') || args.includes('-la') || args.includes('-al');
                const dirEntry = this.vfs.get(target);
                if (!dirEntry || !dirEntry.isDir) {
                    // Check if it's a file
                    if (dirEntry) {
                        stdout = longForm
                            ? `-rw-r--r--   1 ezclaw ezclaw  ${dirEntry.content.length} ${target.split('/').pop()}\n`
                            : `${target.split('/').pop()}\n`;
                    } else {
                        stderr = `ls: cannot access '${target}': No such file or directory\n`;
                        exitCode = 2;
                    }
                    break;
                }
                const entries: string[] = [];
                if (showAll) entries.push('.', '..');
                for (const [path, entry] of this.vfs) {
                    if (path === target) continue;
                    const parent = path.substring(0, path.lastIndexOf('/')) || '/';
                    if (parent === target) {
                        const name = path.split('/').pop()!;
                        if (!showAll && name.startsWith('.')) continue;
                        if (longForm) {
                            const perm = entry.isDir ? 'drwxr-xr-x' : '-rw-r--r--';
                            const size = entry.isDir ? 4096 : entry.content.length;
                            entries.push(`${perm}   1 ezclaw ezclaw  ${String(size).padStart(5)} ${name}`);
                        } else {
                            entries.push(name);
                        }
                    }
                }
                // Also show mount points
                for (const [mountPath] of this.mounts) {
                    const parent = mountPath.substring(0, mountPath.lastIndexOf('/')) || '/';
                    if (parent === target) {
                        const name = mountPath.split('/').pop()!;
                        if (longForm) {
                            entries.push(`drwxr-xr-x   1 ezclaw ezclaw   4096 ${name} [mount]`);
                        } else {
                            entries.push(name);
                        }
                    }
                }
                stdout = entries.join('\n') + (entries.length > 0 ? '\n' : '');
                break;
            }
            case 'pwd':
                stdout = this.cwd + '\n';
                break;
            case 'cd': {
                const target = args.length > 0 ? this.normalizePath(args[0]) : '/home/ezclaw';
                const entry = this.vfs.get(target);
                if (entry && entry.isDir) {
                    this.cwd = target;
                } else {
                    stderr = `cd: ${args[0]}: No such directory\n`;
                    exitCode = 1;
                }
                break;
            }
            case 'echo': {
                // Expand $VAR references
                const text = args.map(a => {
                    return a.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, name) => {
                        return this.shellVars.get(name) || WASI_ENV_VARS.find(e => e.startsWith(name + '='))?.split('=')[1] || '';
                    });
                }).join(' ');
                stdout = text + '\n';
                break;
            }
            case 'cat': {
                if (args.length === 0) {
                    stderr = 'cat: missing operand\n';
                    exitCode = 1;
                    break;
                }
                for (const arg of args) {
                    const path = this.normalizePath(arg);
                    const entry = this.vfs.get(path);
                    if (entry && !entry.isDir) {
                        stdout += entry.content;
                    } else if (entry && entry.isDir) {
                        stderr += `cat: ${arg}: Is a directory\n`;
                        exitCode = 1;
                    } else {
                        stderr += `cat: ${arg}: No such file or directory\n`;
                        exitCode = 1;
                    }
                }
                break;
            }
            case 'mkdir': {
                const parents = args.includes('-p');
                const paths = args.filter(a => !a.startsWith('-'));
                for (const p of paths) {
                    const path = this.normalizePath(p);
                    if (this.vfs.has(path)) {
                        if (!parents) { stderr += `mkdir: cannot create directory '${p}': File exists\n`; exitCode = 1; }
                        continue;
                    }
                    if (parents) {
                        // Create all parent dirs
                        const parts = path.split('/').filter(Boolean);
                        let current = '';
                        for (const part of parts) {
                            current += '/' + part;
                            if (!this.vfs.has(current)) {
                                this.vfs.set(current, { content: '', isDir: true, mtime: Date.now() });
                            }
                        }
                    } else {
                        const parentPath = path.substring(0, path.lastIndexOf('/')) || '/';
                        if (!this.vfs.has(parentPath)) {
                            stderr += `mkdir: cannot create directory '${p}': No such file or directory\n`;
                            exitCode = 1;
                            continue;
                        }
                        this.vfs.set(path, { content: '', isDir: true, mtime: Date.now() });
                    }
                }
                break;
            }
            case 'touch': {
                for (const arg of args.filter(a => !a.startsWith('-'))) {
                    const path = this.normalizePath(arg);
                    const existing = this.vfs.get(path);
                    if (existing) {
                        existing.mtime = Date.now();
                    } else {
                        this.vfs.set(path, { content: '', isDir: false, mtime: Date.now() });
                    }
                }
                break;
            }
            case 'rm': {
                const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
                const force = args.includes('-f') || args.includes('-rf') || args.includes('-fr');
                const paths = args.filter(a => !a.startsWith('-'));
                for (const p of paths) {
                    const path = this.normalizePath(p);
                    const entry = this.vfs.get(path);
                    if (!entry) {
                        if (!force) { stderr += `rm: cannot remove '${p}': No such file or directory\n`; exitCode = 1; }
                        continue;
                    }
                    if (entry.isDir && !recursive) {
                        stderr += `rm: cannot remove '${p}': Is a directory\n`;
                        exitCode = 1;
                        continue;
                    }
                    // Remove entry and all children
                    const toDelete = [...this.vfs.keys()].filter(k => k === path || k.startsWith(path + '/'));
                    for (const k of toDelete) this.vfs.delete(k);
                }
                break;
            }
            case 'cp': {
                const filteredPaths = args.filter(a => !a.startsWith('-'));
                if (filteredPaths.length < 2) {
                    stderr = 'cp: missing operand\n'; exitCode = 1; break;
                }
                const src = this.normalizePath(filteredPaths[0]);
                const dst = this.normalizePath(filteredPaths[1]);
                const srcEntry = this.vfs.get(src);
                if (!srcEntry || srcEntry.isDir) {
                    stderr = `cp: cannot copy '${filteredPaths[0]}': ${srcEntry ? 'Is a directory' : 'No such file'}\n`;
                    exitCode = 1; break;
                }
                this.vfs.set(dst, { content: srcEntry.content, isDir: false, mtime: Date.now() });
                break;
            }
            case 'mv': {
                const filteredPaths = args.filter(a => !a.startsWith('-'));
                if (filteredPaths.length < 2) {
                    stderr = 'mv: missing operand\n'; exitCode = 1; break;
                }
                const src = this.normalizePath(filteredPaths[0]);
                const dst = this.normalizePath(filteredPaths[1]);
                const srcEntry = this.vfs.get(src);
                if (!srcEntry) {
                    stderr = `mv: cannot stat '${filteredPaths[0]}': No such file or directory\n`;
                    exitCode = 1; break;
                }
                this.vfs.set(dst, { ...srcEntry, mtime: Date.now() });
                this.vfs.delete(src);
                break;
            }
            case 'head': {
                const nLines = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10;
                const file = args.filter(a => !a.startsWith('-') && a !== String(nLines))[0];
                if (!file) { stderr = 'head: missing operand\n'; exitCode = 1; break; }
                const path = this.normalizePath(file);
                const entry = this.vfs.get(path);
                if (!entry || entry.isDir) { stderr = `head: ${file}: ${entry ? 'Is a directory' : 'No such file'}\n`; exitCode = 1; break; }
                stdout = entry.content.split('\n').slice(0, nLines).join('\n') + '\n';
                break;
            }
            case 'tail': {
                const nLines = args.includes('-n') ? parseInt(args[args.indexOf('-n') + 1]) || 10 : 10;
                const file = args.filter(a => !a.startsWith('-') && a !== String(nLines))[0];
                if (!file) { stderr = 'tail: missing operand\n'; exitCode = 1; break; }
                const path = this.normalizePath(file);
                const entry = this.vfs.get(path);
                if (!entry || entry.isDir) { stderr = `tail: ${file}: ${entry ? 'Is a directory' : 'No such file'}\n`; exitCode = 1; break; }
                const lines = entry.content.split('\n');
                stdout = lines.slice(-nLines).join('\n') + '\n';
                break;
            }
            case 'wc': {
                const file = args.filter(a => !a.startsWith('-'))[0];
                if (!file) { stderr = 'wc: missing operand\n'; exitCode = 1; break; }
                const path = this.normalizePath(file);
                const entry = this.vfs.get(path);
                if (!entry || entry.isDir) { stderr = `wc: ${file}: ${entry ? 'Is a directory' : 'No such file'}\n`; exitCode = 1; break; }
                const lines = entry.content.split('\n').length;
                const words = entry.content.split(/\s+/).filter(Boolean).length;
                const bytes = entry.content.length;
                stdout = `  ${lines}  ${words} ${bytes} ${file}\n`;
                break;
            }
            case 'grep': {
                if (args.length < 2) { stderr = 'grep: missing operand\n'; exitCode = 1; break; }
                const caseInsensitive = args.includes('-i');
                const filteredArgs = args.filter(a => !a.startsWith('-'));
                const pattern = filteredArgs[0];
                const file = filteredArgs[1];
                const path = this.normalizePath(file);
                const entry = this.vfs.get(path);
                if (!entry || entry.isDir) { stderr = `grep: ${file}: ${entry ? 'Is a directory' : 'No such file'}\n`; exitCode = 1; break; }
                const regex = new RegExp(pattern, caseInsensitive ? 'i' : '');
                const matched = entry.content.split('\n').filter(line => regex.test(line));
                if (matched.length === 0) { exitCode = 1; break; }
                stdout = matched.join('\n') + '\n';
                break;
            }
            case 'sort': {
                const file = args.filter(a => !a.startsWith('-'))[0];
                if (!file) { stderr = 'sort: missing operand\n'; exitCode = 1; break; }
                const path = this.normalizePath(file);
                const entry = this.vfs.get(path);
                if (!entry || entry.isDir) { stderr = `sort: ${file}: ${entry ? 'Is a directory' : 'No such file'}\n`; exitCode = 1; break; }
                const lines = entry.content.split('\n').filter(Boolean);
                const reverse = args.includes('-r');
                const numeric = args.includes('-n');
                lines.sort((a, b) => numeric ? parseFloat(a) - parseFloat(b) : a.localeCompare(b));
                if (reverse) lines.reverse();
                stdout = lines.join('\n') + '\n';
                break;
            }
            case 'find': {
                const startDir = args.length > 0 && !args[0].startsWith('-') ? this.normalizePath(args[0]) : this.cwd;
                const nameIdx = args.indexOf('-name');
                const pattern = nameIdx >= 0 && nameIdx + 1 < args.length ? args[nameIdx + 1] : null;
                const results: string[] = [];
                for (const [path] of this.vfs) {
                    if (!path.startsWith(startDir)) continue;
                    if (pattern) {
                        const name = path.split('/').pop()!;
                        const regex = new RegExp('^' + pattern.replace(/\*/g, '.*').replace(/\?/g, '.') + '$');
                        if (!regex.test(name)) continue;
                    }
                    results.push(path);
                }
                stdout = results.join('\n') + (results.length > 0 ? '\n' : '');
                break;
            }
            case 'whoami':
                stdout = 'ezclaw\n';
                break;
            case 'uname': {
                if (args.includes('-a')) {
                    stdout = `EZ-Claw WASI ${this.osInfo} x86_64 ezclaw-wasi\n`;
                } else {
                    stdout = `EZ-Claw WASI ${this.osInfo}\n`;
                }
                break;
            }
            case 'date':
                stdout = new Date().toISOString() + '\n';
                break;
            case 'env':
                stdout = WASI_ENV_VARS.join('\n') + '\n';
                for (const [k, v] of this.shellVars) {
                    stdout += `${k}=${v}\n`;
                }
                break;
            case 'export': {
                for (const arg of args) {
                    const eq = arg.indexOf('=');
                    if (eq > 0) {
                        this.shellVars.set(arg.slice(0, eq), arg.slice(eq + 1));
                    }
                }
                break;
            }
            case 'id':
                stdout = 'uid=1000(ezclaw) gid=1000(ezclaw) groups=1000(ezclaw)\n';
                break;
            case 'hostname':
                stdout = 'ezclaw-wasi\n';
                break;
            case 'arch':
                stdout = 'x86_64\n';
                break;
            case 'true':
                exitCode = 0;
                break;
            case 'false':
                exitCode = 1;
                break;
            case 'sleep': {
                // Non-blocking "sleep" — just acknowledges the duration
                const duration = parseFloat(args[0] || '0');
                if (isNaN(duration)) { stderr = `sleep: invalid time interval '${args[0]}'\n`; exitCode = 1; }
                break;
            }
            case 'printf': {
                if (args.length === 0) break;
                const fmt = args[0];
                const fmtArgs = args.slice(1);
                let result = fmt;
                let argIdx = 0;
                result = result.replace(/%s/g, () => fmtArgs[argIdx++] || '');
                result = result.replace(/%d/g, () => String(parseInt(fmtArgs[argIdx++] || '0')));
                result = result.replace(/\\n/g, '\n').replace(/\\t/g, '\t');
                stdout = result;
                break;
            }
            case 'test':
            case '[': {
                const testArgs = cmd === '[' ? args.filter(a => a !== ']') : args;
                exitCode = this.evaluateTest(testArgs) ? 0 : 1;
                break;
            }
            case 'expr': {
                try {
                    const a = parseInt(args[0]);
                    const op = args[1];
                    const b = parseInt(args[2]);
                    if (op === '+') stdout = String(a + b) + '\n';
                    else if (op === '-') stdout = String(a - b) + '\n';
                    else if (op === '*') stdout = String(a * b) + '\n';
                    else if (op === '/') stdout = String(Math.floor(a / b)) + '\n';
                    else if (op === '%') stdout = String(a % b) + '\n';
                    else { stderr = `expr: unknown operator '${op}'\n`; exitCode = 2; }
                } catch {
                    stderr = 'expr: syntax error\n'; exitCode = 2;
                }
                break;
            }
            case 'seq': {
                const nums = args.map(Number);
                let start = 1, step = 1, end = 1;
                if (nums.length === 1) { end = nums[0]; }
                else if (nums.length === 2) { start = nums[0]; end = nums[1]; }
                else if (nums.length >= 3) { start = nums[0]; step = nums[1]; end = nums[2]; }
                const lines: string[] = [];
                for (let i = start; step > 0 ? i <= end : i >= end; i += step) {
                    lines.push(String(i));
                }
                stdout = lines.join('\n') + '\n';
                break;
            }
            case 'sh':
            case 'bash': {
                if (args.includes('-c') && args.length > args.indexOf('-c') + 1) {
                    const subCmd = args.slice(args.indexOf('-c') + 1).join(' ');
                    const parts = subCmd.split(/\s+/);
                    return this.fallbackExecute(parts[0], parts.slice(1));
                }
                stdout = `sh: interactive mode not supported in WASI sandbox\n`;
                break;
            }
            case 'help':
                stdout = this.getHelp();
                break;
            default:
                stderr = `${cmd}: command not found in WASI sandbox\n`;
                exitCode = 127;
        }

        return { stdout, stderr, exit_code: exitCode };
    }

    private evaluateTest(args: string[]): boolean {
        if (args.length === 0) return false;
        if (args.length === 1) return args[0] !== '';
        if (args[0] === '-f') return this.vfs.has(this.normalizePath(args[1])) && !this.vfs.get(this.normalizePath(args[1]))!.isDir;
        if (args[0] === '-d') return this.vfs.has(this.normalizePath(args[1])) && this.vfs.get(this.normalizePath(args[1]))!.isDir;
        if (args[0] === '-e') return this.vfs.has(this.normalizePath(args[1]));
        if (args[0] === '-z') return args[1] === '';
        if (args[0] === '-n') return args[1] !== '';
        if (args.length === 3) {
            if (args[1] === '=') return args[0] === args[2];
            if (args[1] === '!=') return args[0] !== args[2];
            if (args[1] === '-eq') return parseInt(args[0]) === parseInt(args[2]);
            if (args[1] === '-ne') return parseInt(args[0]) !== parseInt(args[2]);
            if (args[1] === '-gt') return parseInt(args[0]) > parseInt(args[2]);
            if (args[1] === '-lt') return parseInt(args[0]) < parseInt(args[2]);
        }
        return false;
    }

    private getHelp(): string {
        return `EZ-Claw WASI Container - BusyBox Shell
  File:    ls, cat, head, tail, cp, mv, rm, mkdir, touch, find, wc
  Text:    echo, printf, grep, sort
  System:  pwd, cd, whoami, uname, date, env, export, id, hostname, arch
  Math:    expr, seq, test
  Control: true, false, sleep, sh -c
  I/O:     > (redirect), >> (append), | (pipe)

  Agent workspace tools: read_file, write_file, list_dir
  For full host shell access, use the Native CLI tier.
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
    // Use modern userAgentData API when available
    if ('userAgentData' in navigator) {
        try {
            const uaData = await (navigator as any).userAgentData.getHighEntropyValues(['architecture']);
            if (uaData.architecture === 'arm') return 'arm64';
            return 'amd64';
        } catch { /* fallback below */ }
    }

    // Fallback heuristics
    const ua = navigator.userAgent;
    if (ua.includes('aarch64') || ua.includes('arm64') || ua.includes('Arm64')) return 'arm64';

    // Apple Silicon Macs — all post-2020 Macs with macOS 11+ are ARM
    if (ua.includes('Mac') && typeof (navigator as any).platform === 'string') {
        // macOS 11.0+ on ARM Safari reports 'MacIntel' for compat, but we can
        // check for WebGL renderer containing 'Apple' GPU (M-series chips)
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl');
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    if (typeof renderer === 'string' && renderer.includes('Apple')) return 'arm64';
                }
            }
        } catch { /* silent */ }
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
