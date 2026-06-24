#!/usr/bin/env bash
# Install the latest otodo binary for macOS (arm64/x64) or Linux (arm64/x64).
# Usage:  curl -fsSL https://raw.githubusercontent.com/zeetec20/obsidian-todo/main/scripts/install.sh | sh
# Override install dir:  INSTALL_DIR=/usr/local/bin bash <(curl -fsSL ...)
set -euo pipefail

REPO="zeetec20/obsidian-todo"
INSTALL_DIR="${INSTALL_DIR:-$HOME/.local/bin}"

OS="$(uname -s)"
ARCH="$(uname -m)"

case "$OS" in
  Darwin) PLATFORM="darwin" ;;
  Linux)  PLATFORM="linux"  ;;
  *) echo "error: unsupported OS: $OS (only macOS and Linux are supported)" >&2; exit 1 ;;
esac

case "$ARCH" in
  arm64|aarch64) ARCH_NAME="arm64" ;;
  x86_64)        ARCH_NAME="x64" ;;
  *) echo "error: unsupported arch: $ARCH (only arm64 and x64 are supported)" >&2; exit 1 ;;
esac

VERSION="$(curl -fsSL "https://api.github.com/repos/${REPO}/releases/latest" \
  | grep '"tag_name"' | sed -E 's/.*"v([^"]+)".*/\1/')"

if [[ -z "$VERSION" ]]; then
  echo "error: could not determine latest version" >&2; exit 1
fi

TARBALL="otodo-${PLATFORM}-${ARCH_NAME}.tar.gz"
BIN_NAME="otodo-${PLATFORM}-${ARCH_NAME}"
echo "Installing otodo v${VERSION} (${PLATFORM}-${ARCH_NAME})..."

BASE="https://github.com/${REPO}/releases/download/v${VERSION}"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

curl -fsSL "${BASE}/${TARBALL}"               -o "$TMP/otodo.tar.gz"
curl -fsSL "${BASE}/${BIN_NAME}.sha256"       -o "$TMP/otodo.sha256"

EXPECTED="$(cat "$TMP/otodo.sha256")"
if command -v shasum &>/dev/null; then
  ACTUAL="$(shasum -a 256 "$TMP/otodo.tar.gz" | awk '{print $1}')"
else
  ACTUAL="$(sha256sum "$TMP/otodo.tar.gz" | awk '{print $1}')"
fi
if [[ "$EXPECTED" != "$ACTUAL" ]]; then
  echo "error: checksum mismatch (expected $EXPECTED, got $ACTUAL)" >&2; exit 1
fi

tar -xzf "$TMP/otodo.tar.gz" -C "$TMP"
mkdir -p "$INSTALL_DIR"
mv "$TMP/${BIN_NAME}" "$INSTALL_DIR/otodo"
chmod +x "$INSTALL_DIR/otodo"

echo "Installed → $INSTALL_DIR/otodo"

# Warn if INSTALL_DIR is not on PATH
if ! echo ":$PATH:" | grep -q ":${INSTALL_DIR}:"; then
  echo "  Note: add $INSTALL_DIR to your PATH to use 'otodo' directly."
  echo "  e.g.: export PATH=\"\$HOME/.local/bin:\$PATH\""
fi

echo "Run: otodo --help"
