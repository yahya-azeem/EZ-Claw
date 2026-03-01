import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    svelte(),
  ],
  resolve: {
    alias: {
      // Map @wasm to the pkg/ directory where wasm-pack outputs
      '@wasm': fileURLToPath(new URL('./pkg', import.meta.url)),
    },
  },
  build: {
    target: 'es2022',
    outDir: 'dist',
  },
  optimizeDeps: {
    exclude: ['sql.js'],
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    fs: {
      // Allow serving files from the pkg/ directory (WASM output)
      allow: ['..'],
    },
  },
});
