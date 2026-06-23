#!/usr/bin/env bash
# Fill the Homebrew formula template from version, owner, and the per-arch sha256s.
# Usage: ./scripts/gen-formula.sh <version> [gh_owner] <sha_arm64>
# Output: dist/otodo.rb
set -euo pipefail

VERSION="${1:?version}"; GH_OWNER="${2:-zeetec20}"
SHA_ARM64="${3:?arm64 sha256}"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/dist"

sed \
  -e "s|__VERSION__|$VERSION|g" \
  -e "s|__GH_OWNER__|$GH_OWNER|g" \
  -e "s|__SHA_ARM64__|$SHA_ARM64|g" \
  "$ROOT/Formula/otodo.rb" | awk '/^class Otodo/{p=1} p' >"$ROOT/dist/otodo.rb"

echo "wrote dist/otodo.rb (v$VERSION, $GH_OWNER)"
