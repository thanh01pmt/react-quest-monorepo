FROM node:18-bullseye-slim AS builder

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
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json .npmrc ./

# 4. Copy thư mục packages dùng chung
COPY packages ./packages

# 5. Copy thư mục tin-hoc-tre-api
COPY apps/tin-hoc-tre-api ./apps/tin-hoc-tre-api

# 6. Cài đặt dependencies cho API và toàn bộ workspace packages liên quan
#    pnpm deploy ở bước sau sẽ bundle đúng deps của packages/* vào image
RUN pnpm install --filter ./apps/tin-hoc-tre-api...

# 8. Extract App thành một thư mục cô lập độc lập (bao gồm toàn bộ thư viện liên kết)
RUN pnpm --filter tin-hoc-tre-contest-platform deploy --prod /prod/api

# --- RUNNER STAGE ---
FROM node:18-bullseye-slim AS runner

WORKDIR /app

# Cài đặt thư viện môi trường cần dùng ở runtime (nếu có canvas/xử lý ảnh)
RUN apt-get update && apt-get install -y \
    libcairo2 \
    libpango-1.0-0 \
    libjpeg62-turbo \
    libgif7 \
    librsvg2-2 \
    && rm -rf /var/lib/apt/lists/*

# Copy mã nguồn sau khi deploy isolate (đủ module độc lập hoàn toàn)
COPY --from=builder /prod/api .

# Phơi xuất cổng port mặc định của API
EXPOSE 3000

# Lệnh khởi chạy server API
CMD ["node", "src/server.js"]
