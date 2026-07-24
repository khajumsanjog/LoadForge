#!/bin/bash
set -e

echo "=================================================="
echo "⚡ LoadForge - Source Code Release Builder"
echo "=================================================="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
RELEASE_DIR="$ROOT_DIR/releases"

rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

echo "1. Building React Frontend production bundle..."
cd "$ROOT_DIR/frontend"
npm install --include=optional || npm install
npm run build

echo "2. Packaging complete LoadForge Source Code ZIP (backend & frontend)..."
cd "$ROOT_DIR"
zip -r "$RELEASE_DIR/LoadForge-SourceCode.zip" . -x "*.git*" "*.DS_Store" "releases/*" "frontend/node_modules/*"

echo "=================================================="
echo "✔ LoadForge-SourceCode.zip generated successfully in ./releases/:"
ls -lh "$RELEASE_DIR"
echo "=================================================="
