# Container Images for EZ-Claw

EZ-Claw uses [container2wasm](https://github.com/container2wasm/container2wasm) to run real Linux containers in the browser.

## Prerequisites

- Docker (with BuildKit)
- Go 1.21+ (for the `c2w` CLI)

## Building the Default Alpine Image

```bash
# Build for x86_64 (default)
bash containers/build.sh

# Build for AArch64 (mobile/ARM)
bash containers/build.sh aarch64

# Copy to public directory for Vite to serve
mkdir -p public/containers
cp containers/alpine-3.20-x86_64.wasm public/containers/
```

## Building Custom Images

```bash
# Kali Linux (for security tools)
bash containers/build.sh x86_64 kalilinux/kali-rolling

# Ubuntu with custom tools
bash containers/build.sh x86_64 ubuntu:22.04

# Debian with curl
bash containers/build.sh x86_64 debian:bookworm-slim
```

## How It Works

1. `c2w` converts Docker images to WASM using Bochs (x86_64 emulator)
2. **Wizer pre-boots** the Linux kernel during build → fast browser startup
3. The WASM blob runs inside `browser_wasi_shim` in the browser
4. The workspace folder is mounted at `/workspace` inside the container

## Image Size

Container WASM blobs are typically 50-80MB. They're served as static files
and cached by the browser after first load.

## Adding Custom Images in EZ-Claw UI

Users can also register custom container images through the UI:
1. Open the **Workspace** panel
2. Click the **Container** tab  
3. Click **Add Custom Image**
4. Provide the WASM blob URL and metadata
