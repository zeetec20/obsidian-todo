#!/usr/bin/env bash
# Build a standalone `otodo` binary + tarball for the HOST architecture.
#
# OpenTUI ships native (FFI) bindings per platform, so cross-compiling to another
# arch fails (the foreign @opentui/core-<platform> package won't unpack). Each arch
# must be built on its own native machine — see .github/workflows/release.yml, which
# runs this on both macos-14 (arm64) and macos-13 (x64) runners.
#
# Usage:  ./scripts/build-release.sh [version]
# Output: dist/otodo-darwin-<arch>.tar.gz  +  dist/otodo-darwin-<arch>.sha256
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

VERSION="${1:-$(bun -e 'console.log(require("./package.json").version)')}"
DIST="$ROOT/dist"
mkdir -p "$DIST"

case "$(uname -m)" in
  arm64|aarch64) ARCH="arm64"; TARGET="bun-darwin-arm64" ;;
  x86_64)        ARCH="x64";   TARGET="bun-darwin-x64" ;;
  *) echo "unsupported arch: $(uname -m)" >&2; exit 1 ;;
esac

out="$DIST/otodo-darwin-$ARCH"
echo ">> building darwin-$ARCH ($TARGET) v$VERSION"
bun build --compile --minify --target="$TARGET" ./src/index.ts --outfile "$out"
tar -czf "$out.tar.gz" -C "$DIST" "otodo-darwin-$ARCH"
rm -f "$out"
shasum -a 256 "$out.tar.gz" | awk '{print $1}' >"$out.sha256"

echo "   -> $out.tar.gz"
echo "   -> sha256 $(cat "$out.sha256")"
