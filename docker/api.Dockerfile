# syntax=docker/dockerfile:1
FROM node:20-bullseye-slim AS builder

WORKDIR /app

# 1. Cài đặt các công cụ build cần thiết cho native modules (bcrypt, canvas, v.v.)
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    make \
    g++ \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

# 2. Cài đặt pnpm
RUN npm install -g pnpm@9.12.3

# Cấu hình pnpm store nằm trong Docker cache mount (không bị xóa giữa các lần build)
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

# 3. Copy các file cấu hình workspace (lock file riêng để tối ưu cache layer)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY turbo.json ./

# 4. Copy thư mục packages dùng chung
COPY packages ./packages

# 5. Copy thư mục tin-hoc-tre-api
COPY apps/tin-hoc-tre-api ./apps/tin-hoc-tre-api

# 6. Cài đặt dependencies — cache pnpm store vào BuildKit cache
#    Lần 2+: reuse cache → không download lại → nhanh hơn nhiều
RUN --mount=type=cache,id=pnpm-store,target=/pnpm/store \
    pnpm install --filter ./apps/tin-hoc-tre-api...

# 7. Extract App thành thư mục cô lập (gom đủ deps của workspace packages)
RUN pnpm --filter tin-hoc-tre-contest-platform deploy --prod /prod/api

# --- RUNNER STAGE ---
FROM node:20-bullseye-slim AS runner

WORKDIR /app

# Cài đặt thư viện runtime cần thiết cho native modules
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

# Copy app đã được isolate hoàn toàn (node_modules đầy đủ, không cần monorepo)
COPY --from=builder /prod/api .

EXPOSE 3000
CMD ["node", "src/server.js"]
