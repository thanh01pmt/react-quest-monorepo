FROM node:18-bullseye-slim

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

# 3. Copy các file cấu hình workspace
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./

# 4. Copy thư mục packages dùng chung
COPY packages ./packages

# 5. Copy thư mục tin-hoc-tre-api
COPY apps/tin-hoc-tre-api ./apps/tin-hoc-tre-api

# 6. Cài đặt dependencies chỉ cho API và các dependencies liên quan của nó
RUN pnpm install --network-concurrency 1 --filter ./apps/tin-hoc-tre-api...

# 7. Phơi xuất cổng port mặc định của API
EXPOSE 3000

# 8. Chuyển context sang thư mục api để khởi chạy
WORKDIR /app/apps/tin-hoc-tre-api

# 9. Lệnh khởi chạy server API
CMD ["node", "src/server.js"]
