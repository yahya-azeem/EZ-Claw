/**
 * C2W Web Worker v3 — background Linux kernel execution.
 * 
 * Served from /public to avoid Vite transformation issues.
 */

let wasmInstance = null;
let stdinBuffer = [];
let sharedStdinBuffer = null;
let sharedStdinUint8 = null;
let sharedStdinPointers = null;
let stdoutBuffer = '';
let stderrBuffer = '';
let commandActive = false;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const emitMsg = (type, payload) => self.postMessage({ type, payload });

self.onmessage = async (e) => {
    const { type, payload } = e.data;
    try {
        if (type === 'load') await handleLoad(payload);
        else if (type === 'execute') await handleExecute(payload.command, payload.timeoutMs);
        else if (type === 'stdin') {
            emitMsg('log', { message: `Worker received stdin: ${JSON.stringify(payload.data)}` });
            stdinBuffer.push(payload.data);
        }
    } catch (err) {
        emitMsg('error', { message: err.message });
    }
};

async function handleLoad(payload) {
    const { image, stdinBuffer: sharedBuffer } = payload;
    stdoutBuffer = ''; stderrBuffer = ''; stdinBuffer = [];
    
    if (sharedBuffer) {
        sharedStdinBuffer = sharedBuffer;
        sharedStdinUint8 = new Uint8Array(sharedStdinBuffer, 8);
        sharedStdinPointers = new Int32Array(sharedStdinBuffer, 0, 2);
        emitMsg('log', { message: 'SharedArrayBuffer input initialized' });
    } else {
        emitMsg('log', { message: 'SharedArrayBuffer NOT supported, using postMessage fallback' });
    }

    const response = await fetch(image.wasmUrl);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const contentLength = Number(response.headers.get('content-length') || 0);
    const reader = response.body?.getReader();
    let bytes;

    if (reader && contentLength > 0) {
        const chunks = [];
        let received = 0;
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value); received += value.length;
            const pct = contentLength > 0 ? Math.min(100, Math.round((received / contentLength) * 100)) : 0;
            emitMsg('progress', { loaded: received, total: contentLength, percent: pct });
        }
        bytes = new Uint8Array(received);
        let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    } else {
        bytes = new Uint8Array(await response.arrayBuffer());
    }

    const wasi = createWasiShim(image);
    const result = await WebAssembly.instantiate(bytes, { wasi_snapshot_preview1: wasi, wasi_unstable: wasi });
    wasmInstance = result.instance;
    emitMsg('log', { message: 'WASM Instance created, signaling ready' });
    emitMsg('ready');

    try {
        const _start = wasmInstance.exports._start;
        if (_start) {
            emitMsg('log', { message: `Starting WASM kernel loop with crossOriginIsolated=${self.crossOriginIsolated}` });
            _start();
        }
    } catch (e) {
        emitMsg('error', { message: `WASM KERNEL TRAP: ${e.message}` });
        emitMsg('log', { message: `Stack: ${e.stack}` });
    }
}

async function handleExecute(command, timeoutMs) {
    if (!wasmInstance) return;
    // For interactive terminals, we just push to stdin and let it loop
    stdinBuffer.push(command + '\n');
    emitMsg('result', { stdout: "Command queued", stderr: "", exit_code: 0, duration_ms: 0 });
}

function createWasiShim(image) {
    const env = [
        'HOME=/root', 'USER=root', 'PWD=/workspace', 'TERM=xterm-256color',
        `EZCLAW_OS=${image.os || 'alpine'}`, `EZCLAW_ARCH=${image.arch || 'x86_64'}`,
        'LANG=C.UTF-8', 'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
    ];
    const args = ['/bin/sh'];
    emitMsg('log', { message: `WASI Config: args=${JSON.stringify(args)}, envCount=${env.length}` });
    const getMem = () => wasmInstance.exports.memory;

    return {
        proc_exit: (code) => { commandActive = false; emitMsg('exit', { code }); },
        fd_write: (fd, iovs, iovsLen, nwritten) => {
            const mem = getMem();
            const view = new DataView(mem.buffer);
            const buf = new Uint8Array(mem.buffer);
            let total = 0;
            for (let i = 0; i < iovsLen; i++) {
                const ptr = view.getUint32(iovs + i * 8, true);
                const len = view.getUint32(iovs + i * 8 + 4, true);
                const str = textDecoder.decode(buf.slice(ptr, ptr + len));
                if (fd === 1) { stdoutBuffer += str; emitMsg('output', { stream: 'stdout', data: str }); }
                else if (fd === 2) { stderrBuffer += str; emitMsg('output', { stream: 'stderr', data: str }); }
                total += len;
            }
            view.setUint32(nwritten, total, true);
            return 0;
        },
        fd_read: (fd, iovs, iovsLen, nread) => {
            if (fd !== 0) return 8;
            const mem = getMem();
            const view = new DataView(mem.buffer);
            const memUint8 = new Uint8Array(mem.buffer);

            // ── Priority 1: SharedArrayBuffer (Synchronous / Atomic) ──
            if (sharedStdinPointers && sharedStdinUint8) {
                try {
                    let totalRead = 0;
                    for (let i = 0; i < iovsLen; i++) {
                        const ptr = view.getUint32(iovs + i * 8, true);
                        const len = view.getUint32(iovs + i * 8 + 4, true);
                        
                        for (let j = 0; j < len; j++) {
                            let read = Atomics.load(sharedStdinPointers, 0);
                            let write = Atomics.load(sharedStdinPointers, 1);

                            if (read === write) {
                                if (totalRead > 0) break; // Return what we have
                                // Wait for data - wrap in try-catch because this can trap if not isolated
                                try {
                                    Atomics.wait(sharedStdinPointers, 1, write, 100); // 100ms timeout
                                } catch (atomicErr) {
                                    // If we can't wait, we break and hope for the next poll
                                    break;
                                }
                                read = Atomics.load(sharedStdinPointers, 0);
                                write = Atomics.load(sharedStdinPointers, 1);
                                if (read === write) break; 
                            }

                            memUint8[ptr + j] = sharedStdinUint8[read];
                            Atomics.store(sharedStdinPointers, 0, (read + 1) % 1024);
                            totalRead++;
                        }
                        if (totalRead > 0) break;
                    }
                    view.setUint32(nread, totalRead, true);
                    return 0;
                } catch (e) {
                    emitMsg('log', { message: `Atomic fd_read error: ${e.message}` });
                }
            }

            // ── Priority 2: Message Buffer (Fallback) ──
            if (stdinBuffer.length === 0) { 
                // Return EAGAIN (6)
                view.setUint32(nread, 0, true); 
                return 6; 
            }
            const inputData = stdinBuffer.shift();
            emitMsg('log', { message: `WASI fd_read consuming fallback: ${JSON.stringify(inputData)}` });
            const input = textEncoder.encode(inputData);
            let totalRead = 0;
            for (let i = 0; i < iovsLen && totalRead < input.length; i++) {
                const ptr = view.getUint32(iovs + i * 8, true);
                const len = view.getUint32(iovs + i * 8 + 4, true);
                const chunk = input.slice(totalRead, totalRead + len);
                memUint8.set(chunk, ptr); totalRead += chunk.length;
            }
            view.setUint32(nread, totalRead, true);
            return 0;
        },
        args_get: (argv, buf) => {
            const mem = getMem();
            const view = new DataView(mem.buffer);
            const bufArr = new Uint8Array(mem.buffer);
            let offset = buf;
            for (let i = 0; i < args.length; i++) {
                view.setUint32(argv + i * 4, offset, true);
                const b = textEncoder.encode(args[i] + '\0');
                bufArr.set(b, offset); offset += b.length;
            }
            return 0;
        },
        args_sizes_get: (argc, size) => {
            const view = new DataView(getMem().buffer);
            view.setUint32(argc, args.length, true);
            view.setUint32(size, args.reduce((s, a) => s + a.length + 1, 0), true);
            return 0;
        },
        environ_get: (envp, buf) => {
            const mem = getMem();
            const view = new DataView(mem.buffer);
            const bufArr = new Uint8Array(mem.buffer);
            let offset = buf;
            for (let i = 0; i < env.length; i++) {
                view.setUint32(envp + i * 4, offset, true);
                const b = textEncoder.encode(env[i] + '\0');
                bufArr.set(b, offset); offset += b.length;
            }
            return 0;
        },
        environ_sizes_get: (count, size) => {
            const view = new DataView(getMem().buffer);
            view.setUint32(count, env.length, true);
            view.setUint32(size, env.reduce((s, e) => s + e.length + 1, 0), true);
            return 0;
        },
        random_get: (buf, len) => { crypto.getRandomValues(new Uint8Array(getMem().buffer, buf, len)); return 0; },
        clock_time_get: (id, prec, time) => { new DataView(getMem().buffer).setBigUint64(time, BigInt(Date.now()) * 1000000n, true); return 0; },
        clock_res_get: (id, res) => { new DataView(getMem().buffer).setBigUint64(res, 1000000n, true); return 0; },
        poll_oneoff: (inPtr, outPtr, n, res) => { new DataView(getMem().buffer).setUint32(res, 0, true); return 0; },
        fd_close: () => 0,
        fd_fdstat_get: (fd, buf) => { const v = new DataView(getMem().buffer); v.setUint8(buf, 2); v.setUint16(buf + 2, 0, true); v.setBigUint64(buf + 8, 0n, true); v.setBigUint64(buf + 16, 0n, true); return 0; },
        fd_seek: () => 0,
        fd_fdstat_set_flags: () => 0,
        fd_fdstat_set_rights: () => 0,
        fd_prestat_get: () => 8,
        fd_prestat_dir_name: () => 8,
        path_open: () => 44,
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
        sock_accept: () => 58,
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
