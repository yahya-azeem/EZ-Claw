#!/bin/bash
set -e
echo "==> Building ezclaw-core WASM (dev)..."
cd "$(dirname "$0")/../crates/ezclaw-core"
wasm-pack build --target web --dev --out-dir ../../src/lib/wasm/ezclaw-core
cd ../..
echo "==> Starting Vite dev server..."
npm run dev
