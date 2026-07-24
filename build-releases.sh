#!/bin/bash
set -e

echo "=================================================="
echo "⚡ LoadForge - Multi-Platform Release Builder"
echo "=================================================="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
RELEASE_DIR="$ROOT_DIR/releases"

mkdir -p "$RELEASE_DIR"

echo "1. Building React Frontend production bundle..."
cd "$ROOT_DIR/frontend"
npm run build

echo "2. Compiling cross-platform Go binary executables..."
cd "$ROOT_DIR/backend"

# macOS Apple Silicon (ARM64)
echo " -> Compiling macOS ARM64 (Apple Silicon M1/M2/M3)..."
GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o "$RELEASE_DIR/loadforge-darwin-arm64" main.go

# macOS Intel (AMD64)
echo " -> Compiling macOS AMD64 (Intel)..."
GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o "$RELEASE_DIR/loadforge-darwin-amd64" main.go

# Linux (AMD64)
echo " -> Compiling Linux AMD64 (x86_64)..."
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o "$RELEASE_DIR/loadforge-linux-amd64" main.go

# Windows (AMD64)
echo " -> Compiling Windows AMD64 (.exe)..."
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o "$RELEASE_DIR/loadforge-windows-amd64.exe" main.go

echo "=================================================="
echo "✔ All 4 binaries generated successfully in ./releases/:"
ls -lh "$RELEASE_DIR"
echo "=================================================="
