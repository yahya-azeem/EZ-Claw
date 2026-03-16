/**
 * C2W Web Worker — background Linux kernel execution.
 * 
 * Served from /public to avoid Vite transformation issues.
 */

let wasmInstance = null;
let stdinBuffer = [];
let stdoutBuffer = '';
let stderrBuffer = '';
let commandActive = false;

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

const emitMsg = (type, payload) => self.postMessage({ type, payload });

self.onmessage = async (e) => {
    const { type, payload } = e.data;
    try {
        if (type === 'load') await handleLoad(payload.image);
        else if (type === 'execute') await handleExecute(payload.command, payload.timeoutMs);
        else if (type === 'stdin') stdinBuffer.push(payload.data);
    } catch (err) {
        emitMsg('error', { message: err.message });
    }
};

async function handleLoad(image) {
    stdoutBuffer = ''; stderrBuffer = ''; stdinBuffer = [];
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
            emitMsg('progress', { loaded: received, total: contentLength });
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
    emitMsg('ready');

    try {
        const _start = wasmInstance.exports._start;
        if (_start) _start();
    } catch (e) {}
}

async function handleExecute(command, timeoutMs) {
    if (!wasmInstance) return;
    const start = performance.now();
    stdoutBuffer = ''; stderrBuffer = ''; stdinBuffer.push(command + '\n');
    commandActive = true;
    const deadline = start + timeoutMs;
    while (commandActive && performance.now() < deadline) {
        await new Promise(r => setTimeout(r, 50));
        if (stdoutBuffer.endsWith('# ') || stdoutBuffer.endsWith('$ ')) break;
    }
    commandActive = false;
    emitMsg('result', { stdout: stdoutBuffer, stderr: stderrBuffer, exit_code: 0, duration_ms: performance.now() - start });
}

function createWasiShim(image) {
    const env = [
        'HOME=/root', 'USER=root', 'PWD=/workspace', 'TERM=xterm-256color',
        `EZCLAW_OS=${image.os || 'alpine'}`, `EZCLAW_ARCH=${image.arch || 'x86_64'}`,
        'LANG=C.UTF-8', 'PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin'
    ];
    const args = ['/bin/sh'];
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
            if (stdinBuffer.length === 0) { view.setUint32(nread, 0, true); return 0; }
            const inputData = stdinBuffer.shift();
            const input = textEncoder.encode(inputData);
            const buf = new Uint8Array(mem.buffer);
            let total = 0;
            for (let i = 0; i < iovsLen && total < input.length; i++) {
                const ptr = view.getUint32(iovs + i * 8, true);
                const len = view.getUint32(iovs + i * 8 + 4, true);
                const chunk = input.slice(total, total + len);
                buf.set(chunk, ptr); total += chunk.length;
            }
            view.setUint32(nread, total, true);
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
