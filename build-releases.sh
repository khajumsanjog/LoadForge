#!/bin/bash
set -e

echo "=================================================="
echo "⚡ LoadForge - Multi-Platform Release Builder"
echo "=================================================="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
RELEASE_DIR="$ROOT_DIR/releases"

rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

echo "1. Building React Frontend production bundle..."
cd "$ROOT_DIR/frontend"
npm install --include=optional || npm install
npm run build

echo "2. Compiling cross-platform Go binary executables & packaging ZIPs..."
BUILD_TMP="$(mktemp -d)"

cd "$ROOT_DIR/backend"

# macOS Apple Silicon (ARM64)
echo " -> Packaging macOS ARM64 (Apple Silicon M1/M2/M3)..."
GOOS=darwin GOARCH=arm64 go build -ldflags="-s -w" -o "$BUILD_TMP/mac-arm/loadforge" main.go
cat << 'EOF' > "$BUILD_TMP/mac-arm/Double-Click-To-Run.command"
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
chmod +x "$DIR/loadforge"
"$DIR/loadforge" -port 8080 -browser
EOF
chmod +x "$BUILD_TMP/mac-arm/Double-Click-To-Run.command"
(cd "$BUILD_TMP/mac-arm" && zip -r "$RELEASE_DIR/LoadForge-macOS-AppleSilicon.zip" .)

# macOS Intel (AMD64)
echo " -> Packaging macOS AMD64 (Intel)..."
GOOS=darwin GOARCH=amd64 go build -ldflags="-s -w" -o "$BUILD_TMP/mac-intel/loadforge" main.go
cat << 'EOF' > "$BUILD_TMP/mac-intel/Double-Click-To-Run.command"
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
chmod +x "$DIR/loadforge"
"$DIR/loadforge" -port 8080 -browser
EOF
chmod +x "$BUILD_TMP/mac-intel/Double-Click-To-Run.command"
(cd "$BUILD_TMP/mac-intel" && zip -r "$RELEASE_DIR/LoadForge-macOS-Intel.zip" .)

# Linux (AMD64)
echo " -> Packaging Linux AMD64 (x86_64)..."
GOOS=linux GOARCH=amd64 go build -ldflags="-s -w" -o "$BUILD_TMP/linux/loadforge" main.go
cat << 'EOF' > "$BUILD_TMP/linux/run.sh"
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
chmod +x "$DIR/loadforge"
"$DIR/loadforge" -port 8080 -browser
EOF
chmod +x "$BUILD_TMP/linux/run.sh"
(cd "$BUILD_TMP/linux" && zip -r "$RELEASE_DIR/LoadForge-Linux-x64.zip" .)

# Windows (AMD64)
echo " -> Packaging Windows AMD64 (.exe)..."
GOOS=windows GOARCH=amd64 go build -ldflags="-s -w" -o "$BUILD_TMP/win/loadforge.exe" main.go
cat << 'EOF' > "$BUILD_TMP/win/Double-Click-To-Run.bat"
@echo off
start "" http://localhost:8080
loadforge.exe -port 8080
EOF
(cd "$BUILD_TMP/win" && zip -r "$RELEASE_DIR/LoadForge-Windows-x64.zip" .)

rm -rf "$BUILD_TMP"

echo "=================================================="
echo "✔ Release ZIP packages generated successfully in ./releases/:"
ls -lh "$RELEASE_DIR"
echo "=================================================="
