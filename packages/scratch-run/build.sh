#!/bin/bash
set -e

NODE_VERSION=16.16.0
VERSION=$(node -p -e "require('./package.json').version")
ROOT_DIR=$(pwd)
BUILD_CMD="npx pkg $ROOT_DIR/dist/index.js"

rm -rf bin dist
npx webpack

mkdir -p bin/linux-amd64 bin/linux-arm64 bin/macos-amd64 bin/macos-arm64 bin/win-amd64 bin/win-arm64

# Linux amd64
$BUILD_CMD -t node"$NODE_VERSION"-linux-x64 --out-path "$ROOT_DIR/bin/linux-amd64"
cd "$ROOT_DIR/bin/linux-amd64"
mv index scratch-run
rm -f "../../scratch-run_${VERSION}_linux_amd64.zip"
zip -q "../../scratch-run_${VERSION}_linux_amd64.zip" scratch-run

# Linux arm64
$BUILD_CMD -t node"$NODE_VERSION"-linux-arm64 --out-path "$ROOT_DIR/bin/linux-arm64"
cd "$ROOT_DIR/bin/linux-arm64"
mv index scratch-run
rm -f "../../scratch-run_${VERSION}_linux_arm64.zip"
zip -q "../../scratch-run_${VERSION}_linux_arm64.zip" scratch-run

# macOS amd64
$BUILD_CMD -t node"$NODE_VERSION"-macos-x64 --out-path "$ROOT_DIR/bin/macos-amd64"
cd "$ROOT_DIR/bin/macos-amd64"
mv index scratch-run
rm -f "../../scratch-run_${VERSION}_macos_amd64.zip"
zip -q "../../scratch-run_${VERSION}_macos_amd64.zip" scratch-run

# macOS arm64
$BUILD_CMD -t node"$NODE_VERSION"-macos-arm64 --out-path "$ROOT_DIR/bin/macos-arm64"
cd "$ROOT_DIR/bin/macos-arm64"
mv index scratch-run
rm -f "../../scratch-run_${VERSION}_macos_arm64.zip"
zip -q "../../scratch-run_${VERSION}_macos_arm64.zip" scratch-run

# Windows amd64
$BUILD_CMD -t node"$NODE_VERSION"-win-x64 --out-path "$ROOT_DIR/bin/win-amd64"
cd "$ROOT_DIR/bin/win-amd64"
mv index.exe scratch-run.exe
rm -f "../../scratch-run_${VERSION}_win_amd64.zip"
zip -q "../../scratch-run_${VERSION}_win_amd64.zip" scratch-run.exe

# Windows arm64
$BUILD_CMD -t node"$NODE_VERSION"-win-arm64 --out-path "$ROOT_DIR/bin/win-arm64"
cd "$ROOT_DIR/bin/win-arm64"
mv index.exe scratch-run.exe
rm -f "../../scratch-run_${VERSION}_win_arm64.zip"
zip -q "../../scratch-run_${VERSION}_win_arm64.zip" scratch-run.exe

echo "Build complete."

