#!/usr/bin/env bash
# Build a standalone `otodo` binary + tarball for the HOST architecture.
#
# OpenTUI ships native (FFI) bindings per platform, so cross-compiling to another
# arch fails (the foreign @opentui/core-<platform> package won't unpack). Each arch
# must be built on its own native machine — see .github/workflows/release.yml.
#
# macOS Intel: build on the native x86_64 runner `macos-15-intel` (GitHub retired the
# old `macos-13` label; Rosetta cross-compile from arm64 does not work — bun's installer
# is Rosetta-aware and refuses to ship an x64 bun).
#
# Usage:  ./scripts/build-release.sh [version]
# Output: dist/otodo-<os>-<arch>.tar.gz  +  dist/otodo-<os>-<arch>.sha256
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="${1:-$(bun -e 'console.log(require("./package.json").version)')}"
DIST="$ROOT/dist"
mkdir -p "$DIST"

case "$(uname -s)" in
  Darwin) OS_NAME="darwin" ;;
  Linux)  OS_NAME="linux"  ;;
  *) echo "unsupported OS: $(uname -s)" >&2; exit 1 ;;
esac

case "$(uname -m)" in
  arm64|aarch64) ARCH="arm64"; TARGET="bun-${OS_NAME}-arm64" ;;
  x86_64)        ARCH="x64";   TARGET="bun-${OS_NAME}-x64" ;;
  *) echo "unsupported arch: $(uname -m)" >&2; exit 1 ;;
esac

out="$DIST/otodo-${OS_NAME}-${ARCH}"
echo ">> building ${OS_NAME}-${ARCH} ($TARGET) v$VERSION"
bun build --compile --minify --target="$TARGET" ./src/index.ts --outfile "$out"
tar -czf "$out.tar.gz" -C "$DIST" "otodo-${OS_NAME}-${ARCH}"
rm -f "$out"

if command -v shasum &>/dev/null; then
  shasum -a 256 "$out.tar.gz" | awk '{print $1}' > "$out.sha256"
else
  sha256sum "$out.tar.gz" | awk '{print $1}' > "$out.sha256"
fi

echo "   -> $out.tar.gz"
echo "   -> sha256 $(cat "$out.sha256")"
