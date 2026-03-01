#!/bin/bash
set -e
echo "==> Building ezclaw-core WASM (release)..."
cd "$(dirname "$0")/../crates/ezclaw-core"
wasm-pack build --target web --release --out-dir ../../src/lib/wasm/ezclaw-core
echo "==> WASM build complete."
