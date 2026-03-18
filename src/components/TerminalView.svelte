<script lang="ts">
    import { onMount, onDestroy, tick } from "svelte";
    import { Terminal } from "xterm";
    import { FitAddon } from "xterm-addon-fit";
    import "xterm/css/xterm.css";
    import {
        SandboxManager,
        type SandboxTier,
    } from "../bridge/sandbox-manager";

    interface Props {
        sessionId?: string;
        className?: string;
    }

    let { sessionId = "default", className = "" }: Props = $props();

    let termContainer: HTMLDivElement | undefined = $state();
    let term: Terminal | null = null;
    let fitAddon: FitAddon | null = null;
    let manager: SandboxManager | null = null;
    let cleanups: (() => void)[] = [];
    
    let containerReady = $state(false);

    async function initTerminal() {
        if (!termContainer || term) return;

        console.log(`[EZ-Claw] Initializing TerminalView (v2.6-trace) | isolated=${window.crossOriginIsolated}`);

        term = new Terminal({
            cursorBlink: true,
            theme: {
                background: "#0d1117",
                foreground: "#e6edf3",
                cursor: "#58a6ff",
                selectionBackground: "rgba(88, 166, 255, 0.3)",
                black: "#484f58",
                red: "#ff7b72",
                green: "#3fb950",
                yellow: "#d29922",
                blue: "#58a6ff",
                magenta: "#bc8cff",
                cyan: "#39c5bb",
                white: "#b1bac4",
            },
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
            fontSize: 13,
            lineHeight: 1.4,
            scrollback: 1000,
            convertEol: true
        });

        fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(termContainer);
        
        await tick();
        fitAddon.fit();
        term.focus();

        term.onData((data) => {
            console.log(`[EZ-Claw] Terminal onData (raw): ${JSON.stringify(data)}`);
            if (manager) {
                manager.sendStdin(data);
            }
        });

        term.writeln("\x1b[1;34m🦀 EZ-TERM 2.6 (Trace) — Secure Sandbox\x1b[0m");
        term.writeln("\x1b[2mInteractive Alpine Linux session active. Type directly below.\x1b[0m\n");
    }

    onMount(async () => {
        await initTerminal();
        
        manager = SandboxManager.getInstance(sessionId);
        containerReady = manager.isContainerBooted;

        // Output pipe
        const offOutput = manager.onOutput((data) => {
            if (term) term.write(data);
        });
        cleanups.push(offOutput);

        // Progress events
        const offProgress = manager.onC2WEvent("c2w:progress", (data: any) => {
            if (data?.loaded && data?.total && term) {
                const pct = data.percent ?? Math.min(100, Math.round((data.loaded / data.total) * 100));
                const mb = (data.loaded / 1024 / 1024).toFixed(1);
                const totalMb = (data.total / 1024 / 1024).toFixed(1);
                term.write(`\r\x1b[K⏳ Downloading container... ${mb}MB / ${totalMb}MB (${pct}%)`);
            }
        });
        cleanups.push(offProgress);

        const offReady = manager.onC2WEvent("c2w:ready", () => {
            containerReady = true;
            term?.write("\n\r\x1b[1;32m✅ Linux container ready!\x1b[0m\n\n");
            term?.focus();
        });
        cleanups.push(offReady);

        const offError = manager.onC2WEvent("c2w:error", (data: any) => {
            term?.writeln(`\r\n\x1b[1;31m❌ Container error: ${data?.error || "Unknown"}\x1b[0m`);
        });
        cleanups.push(offError);

        // Auto-boot if needed
        if (manager.getConfig().tier === "container2wasm" && !manager.isContainerBooted) {
            term?.writeln("🐧 Booting Alpine Linux container...");
            manager.bootContainer().catch((err) => {
                term?.writeln(`\r\n\x1b[31mFailed to boot: ${err.message}\x1b[0m`);
            });
        }

        const resizeObserver = new ResizeObserver(() => {
            fitAddon?.fit();
        });
        if (termContainer) resizeObserver.observe(termContainer);
        cleanups.push(() => resizeObserver.disconnect());
    });

    onDestroy(() => {
        for (const cleanup of cleanups) cleanup();
        term?.dispose();
    });

    export function focus() {
        term?.focus();
    }

    export function fit() {
        fitAddon?.fit();
    }
</script>

<div class="terminal-view {className}" bind:this={termContainer}></div>

<style>
    .terminal-view {
        width: 100%;
        height: 100%;
        background: #0d1117;
        min-height: 0;
    }
    :global(.xterm) {
        height: 100%;
        padding: 4px;
    }
</style>
