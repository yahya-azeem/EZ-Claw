# ============================================================
# Stage 1: Build Rust WASM core
# ============================================================
FROM rust:bookworm AS rust-wasm

RUN rustup target add wasm32-unknown-unknown \
    && cargo install wasm-pack

WORKDIR /build
COPY crates/ crates/
RUN cd crates/ezclaw-core \
    && wasm-pack build --target web --release --out-dir /build/wasm-pkg

# ============================================================
# Stage 2: Build Svelte frontend
# ============================================================
FROM node:22-alpine AS node-build

WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install

COPY --from=rust-wasm /build/wasm-pkg ./pkg
COPY . .
RUN npm run build

# ============================================================
# Stage 3: Serve static site
# ============================================================
FROM nginx:alpine AS serve

COPY --from=node-build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
