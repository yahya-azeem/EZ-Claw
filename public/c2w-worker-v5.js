/**
 * C2W Web Worker v5 — background Linux kernel execution.
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
let lastStdinActivity = Date.now();

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
            lastStdinActivity = Date.now();
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
    let received = 0;

    // Monitor progress without blocking compilation
    const progressStream = new TransformStream({
        transform(chunk, controller) {
            received += chunk.length;
            const pct = contentLength > 0 ? Math.min(100, Math.round((received / contentLength) * 100)) : 0;
            emitMsg('progress', { loaded: received, total: contentLength, percent: pct });
            controller.enqueue(chunk);
        }
    });

    const wasi = createWasiShim(image);
    // Parallel download + compile — this is much faster for large binaries
    const result = await WebAssembly.instantiateStreaming(
        new Response(response.body.pipeThrough(progressStream), {
            headers: { "Content-Type": "application/wasm" }
        }), 
        { wasi_snapshot_preview1: wasi, wasi_unstable: wasi }
    );
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
        proc_exit: (code) => { 
            emitMsg('log', { message: `WASI proc_exit(${code})` });
            commandActive = false; 
            emitMsg('exit', { code }); 
        },
        fd_write: (fd, iovs, iovsLen, nwritten) => {
            // Only log non-stdout/stderr writes or infrequent updates to avoid flooding
            if (fd > 2) emitMsg('log', { message: `WASI fd_write(fd=${fd}, iovsLen=${iovsLen})` });
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
            if (fd === 0) {
                emitMsg('log', { message: `WASI fd_read(fd=0, iovsLen=${iovsLen})` });
            } else {
                emitMsg('log', { message: `WASI fd_read(fd=${fd}, iovsLen=${iovsLen})` });
            }
            if (fd !== 0) return 8; // EBADF
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
                                // Wait for data
                                try {
                                    Atomics.wait(sharedStdinPointers, 1, write, 50); // Shorter timeout for better responsiveness
                                } catch (atomicErr) {
                                    break;
                                }
                                read = Atomics.load(sharedStdinPointers, 0);
                                write = Atomics.load(sharedStdinPointers, 1);
                                if (read === write) break; 
                            }

                            let char = sharedStdinUint8[read];
                            // Map \r (13) to \n (10) for Linux compatibility
                            if (char === 13) char = 10;

                            memUint8[ptr + j] = char;
                            Atomics.store(sharedStdinPointers, 0, (read + 1) % 1024);
                            totalRead++;
                            lastStdinActivity = Date.now();
                            emitMsg('log', { message: `WASI fd_read consumed byte ${char} from SAB` });
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
                view.setUint32(nread, 0, true); 
                return 6; // EAGAIN
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
            emitMsg('log', { message: `WASI args_get` });
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
            emitMsg('log', { message: `WASI args_sizes_get` });
            const view = new DataView(getMem().buffer);
            view.setUint32(argc, args.length, true);
            view.setUint32(size, args.reduce((s, a) => s + a.length + 1, 0), true);
            return 0;
        },
        environ_get: (envp, buf) => {
            emitMsg('log', { message: `WASI environ_get` });
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
            emitMsg('log', { message: `WASI environ_sizes_get` });
            const view = new DataView(getMem().buffer);
            view.setUint32(count, env.length, true);
            view.setUint32(size, env.reduce((s, e) => s + e.length + 1, 0), true);
            return 0;
        },
        random_get: (buf, len) => { 
            // emitMsg('log', { message: `WASI random_get(len=${len})` });
            crypto.getRandomValues(new Uint8Array(getMem().buffer, buf, len)); 
            return 0; 
        },
        clock_time_get: (id, prec, time) => { 
            new DataView(getMem().buffer).setBigUint64(time, BigInt(Date.now()) * 1000000n, true); 
            return 0; 
        },
        clock_res_get: (id, res) => { 
            new DataView(getMem().buffer).setBigUint64(res, 1000000n, true); 
            return 0; 
        },
        poll_oneoff: (inPtr, outPtr, n, res) => { 
            const mem = getMem();
            const view = new DataView(mem.buffer);
            let eventsCount = 0;

            for (let i = 0; i < n; i++) {
                const subPtr = inPtr + i * 48; // subscription is 48 bytes
                const userData = view.getBigUint64(subPtr, true);
                const type = view.getUint8(subPtr + 8);

                if (type === 1) { // FD_READ
                    const fd = view.getUint32(subPtr + 16, true);
                    if (fd === 0) {
                        // Check if stdin has data
                        let hasData = (sharedStdinPointers && Atomics.load(sharedStdinPointers, 0) !== Atomics.load(sharedStdinPointers, 1)) || stdinBuffer.length > 0;
                        
                        // If no data and we are the only poll, wait a bit to save CPU
                        if (!hasData && n === 1 && sharedStdinPointers) {
                            const write = Atomics.load(sharedStdinPointers, 1);
                            const now = Date.now();
                            const idleTime = now - lastStdinActivity;
                            const waitTime = idleTime < 5000 ? 10 : 250;
                            
                            try { Atomics.wait(sharedStdinPointers, 1, write, waitTime); } catch(e) {}
                            hasData = Atomics.load(sharedStdinPointers, 0) !== Atomics.load(sharedStdinPointers, 1);
                        }

                        if (hasData) {
                            const eventPtr = outPtr + eventsCount * 32; // event is 32 bytes
                            view.setBigUint64(eventPtr, userData, true);
                            view.setUint16(eventPtr + 8, 0, true); // errno: 0
                            view.setUint8(eventPtr + 10, 1); // type: FD_READ
                            eventsCount++;
                        }
                    }
                } else if (type === 0) { // CLOCK
                    // Signal clock events immediately to keep the kernel moving
                    const eventPtr = outPtr + eventsCount * 32;
                    view.setBigUint64(eventPtr, userData, true);
                    view.setUint16(eventPtr + 8, 0, true);
                    view.setUint8(eventPtr + 10, 0); // type: CLOCK
                    eventsCount++;
                }
            }
            view.setUint32(res, eventsCount, true);
            return 0; 
        },
        fd_close: (fd) => { 
            emitMsg('log', { message: `WASI fd_close(${fd})` });
            return 0; 
        },
        fd_fdstat_get: (fd, buf) => { 
            // emitMsg('log', { message: `WASI fd_fdstat_get(${fd})` });
            const v = new DataView(getMem().buffer); 
            v.setUint8(buf, 2); // Character device
            v.setUint16(buf + 2, 0, true); 
            v.setBigUint64(buf + 8, 0n, true); 
            v.setBigUint64(buf + 16, 0n, true); 
            return 0; 
        },
        fd_seek: (fd) => { 
            emitMsg('log', { message: `WASI fd_seek(${fd})` });
            return 0; 
        },
        fd_fdstat_set_flags: () => 0,
        fd_fdstat_set_rights: () => 0,
        fd_prestat_get: (fd, buf) => { 
            emitMsg('log', { message: `WASI fd_prestat_get(${fd})` });
            return 8; // No pre-opened dirs
        },
        fd_prestat_dir_name: () => 8,
        path_open: () => 44, // ENOSYS
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
