# Hướng dẫn nhúng Extension vào TurboWarp GUI (scratch-gui)

## Yêu cầu
- Node.js >= 16
- Git

## Bước 1: Clone scratch-gui của TurboWarp
```bash
git clone https://github.com/TurboWarp/scratch-gui.git
cd scratch-gui
npm ci
```

## Bước 2: Copy extension vào dự án
```bash
cp /path/to/contest.js src/lib/libraries/extensions/tinhoctre/index.js
```

## Bước 3: Áp dụng patch vào extension-manager.js
Xem file `extension-manager.patch` để biết chính xác đoạn cần sửa.

## Bước 4: Áp dụng patch ẩn UI thừa
Xem file `gui-cleanup.patch`

## Bước 5: Build production
```bash
NODE_ENV=production npm run build
# Output: build/  (deploy folder này lên server)
```
