#!/bin/bash
set -e

echo "=================================================="
echo "⚡ LoadForge - Quick Installer & Launcher"
echo "=================================================="

OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$OS" in
  darwin*)
    if [ "$ARCH" = "arm64" ]; then
      BINARY_NAME="loadforge-darwin-arm64"
    else
      BINARY_NAME="loadforge-darwin-amd64"
    fi
    ;;
  linux*)
    BINARY_NAME="loadforge-linux-amd64"
    ;;
  msys*|mingw*|cygwin*)
    BINARY_NAME="loadforge-windows-amd64.exe"
    ;;
  *)
    echo "❌ Unsupported operating system: $OS ($ARCH)"
    exit 1
    ;;
esac

INSTALL_DIR="$HOME/.loadforge/bin"
mkdir -p "$INSTALL_DIR"
TARGET="$INSTALL_DIR/loadforge"

DOWNLOAD_URL="https://raw.githubusercontent.com/khajumsanjog/LoadForge/main/releases/$BINARY_NAME"

echo "📥 Downloading LoadForge for $OS ($ARCH)..."
curl -fsSL "$DOWNLOAD_URL" -o "$TARGET"
chmod +x "$TARGET"

echo "=================================================="
echo "✔ LoadForge installed successfully at $TARGET"
echo "⚡ Starting LoadForge on http://localhost:8080..."
echo "=================================================="

exec "$TARGET" -port 8080 -browser
