import './app.css';
import { mount } from 'svelte';

// Dynamic import for App to catch module-level errors gracefully
async function bootstrap() {
    try {
        const { default: App } = await import('./App.svelte');
        const target = document.getElementById('app');
        if (!target) throw new Error('#app not found');

        mount(App, { target });
        console.log('[EZ-Claw] App mounted successfully');
    } catch (err: any) {
        console.error('[EZ-Claw] Bootstrap failed:', err);
        const el = document.createElement('div');
        el.style.cssText = 'color: #ff4c4c; padding: 32px; font-family: "JetBrains Mono", monospace; white-space: pre-wrap; background: #0d1117; min-height: 100vh;';
        el.textContent = `🦀 EZ-Claw Error:\n\n${err?.stack || err?.message || String(err)}`;
        document.body.appendChild(el);
    }
}

bootstrap();
