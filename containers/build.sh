#!/usr/bin/env bash
#
# build.sh — Compile container images to WASM using container2wasm + wizer.
#
# Prerequisites:
#   - Docker (with BuildKit)
#   - Go 1.21+ (for c2w CLI)
#
# Usage:
#   ./containers/build.sh                           # Build Alpine for detected arch
#   ./containers/build.sh x86_64                    # Build Alpine for x86_64
#   ./containers/build.sh aarch64                   # Build Alpine for AArch64
#   ./containers/build.sh x86_64 alpine:3.20        # Build specific image
#   ./containers/build.sh x86_64 kali-rolling       # Build Kali Linux
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# ── Args ──────────────────────────────────────────────────────────

ARCH="${1:-x86_64}"
IMAGE="${2:-alpine:3.20}"
IMAGE_SLUG="$(echo "$IMAGE" | sed 's|[:/]|-|g')"
OUTPUT_DIR="${SCRIPT_DIR}"
OUTPUT_FILE="${OUTPUT_DIR}/${IMAGE_SLUG}-${ARCH}.wasm"

# Map our arch names to c2w's --target-arch values
case "$ARCH" in
    x86_64|amd64)  C2W_ARCH="amd64" ;;
    aarch64|arm64) C2W_ARCH="amd64" ;; # c2w emulates x86 anyway for WASI target
    riscv64)       C2W_ARCH="riscv64" ;;
    *)             echo "Unknown arch: $ARCH" && exit 1 ;;
esac

# ── Install c2w ───────────────────────────────────────────────────

if ! command -v c2w &>/dev/null; then
    echo "📦 Installing container2wasm (c2w)..."
    go install github.com/container2wasm/container2wasm/cmd/c2w@latest
    export PATH="$PATH:$(go env GOPATH)/bin"
fi

echo "🔧 container2wasm version: $(c2w --version 2>/dev/null || echo 'unknown')"

# ── Build ─────────────────────────────────────────────────────────

echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║  Building container WASM blob                         ║"
echo "║  Image:  $IMAGE"
echo "║  Arch:   $ARCH → c2w target: $C2W_ARCH"
echo "║  Output: $OUTPUT_FILE"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

mkdir -p "$OUTPUT_DIR"

# c2w uses Docker + BuildKit internally.
# The --target-arch flag selects the emulated CPU architecture.
# Wizer pre-booting is enabled by default for WASI targets,
# which pre-boots the kernel to minimize browser startup latency.
c2w --target-arch="$C2W_ARCH" "$IMAGE" "$OUTPUT_FILE"

# ── Summary ───────────────────────────────────────────────────────

FILE_SIZE="$(du -h "$OUTPUT_FILE" | cut -f1)"

echo ""
echo "✅ Build complete!"
echo "   File: $OUTPUT_FILE"
echo "   Size: $FILE_SIZE"
echo ""
echo "To use in EZ-Claw:"
echo "  1. Copy to: ${PROJECT_ROOT}/public/containers/"
echo "     cp $OUTPUT_FILE ${PROJECT_ROOT}/public/containers/"
echo ""
echo "  2. Or serve from a CDN and register the URL in EZ-Claw settings."
echo ""
