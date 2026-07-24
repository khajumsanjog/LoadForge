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
      ZIP_NAME="LoadForge-macOS-AppleSilicon.zip"
    else
      ZIP_NAME="LoadForge-macOS-Intel.zip"
    fi
    ;;
  linux*)
    ZIP_NAME="LoadForge-Linux-x64.zip"
    ;;
  msys*|mingw*|cygwin*)
    ZIP_NAME="LoadForge-Windows-x64.zip"
    ;;
  *)
    echo "❌ Unsupported operating system: $OS ($ARCH)"
    exit 1
    ;;
esac

INSTALL_DIR="$HOME/.loadforge/bin"
mkdir -p "$INSTALL_DIR"
TMP_ZIP="$(mktemp)"

DOWNLOAD_URL="https://raw.githubusercontent.com/khajumsanjog/LoadForge/main/releases/$ZIP_NAME"

echo "📥 Downloading LoadForge package ($ZIP_NAME)..."
curl -fsSL "$DOWNLOAD_URL" -o "$TMP_ZIP"

echo "📦 Extracting LoadForge to $INSTALL_DIR..."
unzip -o "$TMP_ZIP" -d "$INSTALL_DIR" > /dev/null
rm -f "$TMP_ZIP"

chmod +x "$INSTALL_DIR/loadforge"

echo "=================================================="
echo "✔ LoadForge installed successfully at $INSTALL_DIR/loadforge"
echo "⚡ Starting LoadForge on http://localhost:8080..."
echo "=================================================="

exec "$INSTALL_DIR/loadforge" -port 8080 -browser
