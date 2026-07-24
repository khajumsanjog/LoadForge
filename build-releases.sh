#!/bin/bash
set -e

echo "=================================================="
echo "⚡ LoadForge - Multi-Platform Release Builder"
echo "=================================================="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
RELEASE_DIR="$ROOT_DIR/releases"

mkdir -p "$RELEASE_DIR"
rm -rf "$RELEASE_DIR/*"

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

echo "3. Packaging Double-Clickable User Archives (.zip)..."

# macOS Apple Silicon ZIP
TMP_MAC_ARM="$(mktemp -d)"
cp "$RELEASE_DIR/loadforge-darwin-arm64" "$TMP_MAC_ARM/loadforge"
cat << 'EOF' > "$TMP_MAC_ARM/Double-Click-To-Run.command"
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
chmod +x "$DIR/loadforge"
"$DIR/loadforge" -port 8080 -browser
EOF
chmod +x "$TMP_MAC_ARM/Double-Click-To-Run.command"
(cd "$TMP_MAC_ARM" && zip -r "$RELEASE_DIR/LoadForge-macOS-AppleSilicon.zip" .)

# macOS Intel ZIP
TMP_MAC_INTEL="$(mktemp -d)"
cp "$RELEASE_DIR/loadforge-darwin-amd64" "$TMP_MAC_INTEL/loadforge"
cat << 'EOF' > "$TMP_MAC_INTEL/Double-Click-To-Run.command"
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
chmod +x "$DIR/loadforge"
"$DIR/loadforge" -port 8080 -browser
EOF
chmod +x "$TMP_MAC_INTEL/Double-Click-To-Run.command"
(cd "$TMP_MAC_INTEL" && zip -r "$RELEASE_DIR/LoadForge-macOS-Intel.zip" .)

# Linux ZIP
TMP_LINUX="$(mktemp -d)"
cp "$RELEASE_DIR/loadforge-linux-amd64" "$TMP_LINUX/loadforge"
cat << 'EOF' > "$TMP_LINUX/run.sh"
#!/bin/bash
DIR="$(cd "$(dirname "$0")" && pwd)"
chmod +x "$DIR/loadforge"
"$DIR/loadforge" -port 8080 -browser
EOF
chmod +x "$TMP_LINUX/run.sh"
(cd "$TMP_LINUX" && zip -r "$RELEASE_DIR/LoadForge-Linux-x64.zip" .)

# Windows ZIP
TMP_WIN="$(mktemp -d)"
cp "$RELEASE_DIR/loadforge-windows-amd64.exe" "$TMP_WIN/loadforge.exe"
cat << 'EOF' > "$TMP_WIN/Double-Click-To-Run.bat"
@echo off
start "" http://localhost:8080
loadforge.exe -port 8080
EOF
(cd "$TMP_WIN" && zip -r "$RELEASE_DIR/LoadForge-Windows-x64.zip" .)

echo "=================================================="
echo "✔ All binaries and user double-clickable ZIPs generated successfully:"
ls -lh "$RELEASE_DIR"
echo "=================================================="
