# EZ-Claw WASI Container Build Scripts
# 
# This directory contains scripts to build WASM containers from Linux images
# using container2wasm with wizer pre-booting for instant startup.

# Prerequisites:
# - Docker with BuildKit enabled
# - container2wasm (c2w) CLI tool
# - wasmtime for testing

# Architecture detection helper
detect_arch() {
    case $(uname -m) in
        x86_64) echo "amd64" ;;
        aarch64|arm64) echo "arm64" ;;
        *) echo "amd64" ;;
    esac
}

# Build Alpine Linux WASM container
build_alpine() {
    ARCH=${1:-$(detect_arch)}
    echo "Building Alpine Linux WASM container for $ARCH..."
    
    # Check if we already have a pre-built container
    if [ -f "containers/alpine-${ARCH}.wasm" ]; then
        echo "Found pre-built container: containers/alpine-${ARCH}.wasm"
        return 0
    fi
    
    # Try to download from demo-images repository
    echo "No local container found. Attempting to download pre-built container..."
    
    # Download pre-built Alpine WASM from ktock/demo-images
    local demo_url="https://raw.githubusercontent.com/ktock/demo-images/main/amd64-vim-wasi-container00.wasm"
    
    mkdir -p containers
    if curl -L "$demo_url" -o "containers/alpine-${ARCH}.wasm" 2>/dev/null; then
        echo "Downloaded: containers/alpine-${ARCH}.wasm"
    else
        echo "Download failed. Building container image with c2w..."
        
        docker build \
            --build-arg BASE_IMAGE=alpine:3.19 \
            --build-arg TARGET_ARCH=$ARCH \
            -t ezclaw-alpine-c2w-$ARCH:latest \
            -f containers/Dockerfile.c2w .
        
        echo ""
        echo "Container image ready: ezclaw-alpine-c2w-$ARCH:latest"
        echo "To generate the WASM binary, run:"
        echo "  docker run --rm -v \"\$(pwd)/containers:/out\" --entrypoint /usr/local/bin/c2w ezclaw-alpine-c2w-$ARCH:latest --target-arch $ARCH alpine:3.19 /out/alpine-$ARCH.wasm"
    fi
}

# Build Kali Linux WASM container (for security tools)
build_kali() {
    ARCH=${1:-$(detect_arch)}
    echo "Building Kali Linux WASM container for $ARCH..."
    
    docker build \
        --build-arg BASE_IMAGE=kali-rolling \
        --build-arg TARGET_ARCH=$ARCH \
        -t ezclaw-kali-$ARCH:latest \
        -f containers/Dockerfile.kali .
    
    docker run --rm \
        -v $(pwd)/containers:/out \
        ezclaw-kali-$ARCH:latest \
        c2w --target-arch $ARCH kali-rolling /out/kali-$ARCH.wasm
    
    echo "Built: containers/kali-$ARCH.wasm"
}

# Build all containers
build_all() {
    ARCH=$(detect_arch)
    build_alpine $ARCH
    # build_kali $ARCH  # Optional: uncomment if needed
}

# Test WASM container locally
test_wasm() {
    CONTAINER=${1:-containers/alpine-amd64.wasm}
    if [ ! -f "$CONTAINER" ]; then
        echo "Container not found: $CONTAINER"
        return 1
    fi
    
    echo "Testing $CONTAINER..."
    wasmtime run $CONTAINER -- ls /workspace
    wasmtime run $CONTAINER -- uname -a
}

# Serve containers for browser
serve_containers() {
    echo "Serving containers on localhost:8080..."
    docker run --rm -p 8080:80 \
        -v $(pwd)/containers:/usr/local/apache2/htdocs:ro \
        httpd:2
}

# Default action
case "${1:-}" in
    alpine) build_alpine ;;
    kali) build_kali ;;
    all) build_all ;;
    test) test_wasm $2 ;;
    serve) serve_containers ;;
    *) echo "Usage: $0 {alpine|kali|all|test [container]|serve}" ;;
esac
