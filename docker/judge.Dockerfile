FROM node:18-bullseye-slim

# Cài đặt các thư viện cần thiết cho môi trường Canvas/JSDOM và build tools
RUN apt-get update && apt-get install -y \
    git \
    python3 \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Cài đặt pnpm
RUN npm install -g pnpm

# Copy các file cấu hình workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# Copy thư mục packages chung
COPY packages ./packages

# Copy thư mục tin-hoc-tre-judge
COPY apps/tin-hoc-tre-judge ./apps/tin-hoc-tre-judge

# Cài đặt dependencies đặc thù và build (kể cả native modules của canvas, jsdom nếu có)
RUN pnpm install --filter tin-hoc-tre-judge...

# Chuyển context sang thư mục judge để khởi chạy
WORKDIR /app/apps/tin-hoc-tre-judge

# Lệnh khởi chạy worker
CMD ["node", "src/worker.js"]
