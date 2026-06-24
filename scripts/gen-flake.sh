#!/usr/bin/env bash
# Fill the Nix flake template with version, owner, and per-platform sha256 hashes.
# Usage: ./scripts/gen-flake.sh <version> [gh_owner] <sha_darwin_arm64> <sha_darwin_x64> <sha_linux_arm64> <sha_linux_x64>
# All sha256 args are hex strings (output of shasum/sha256sum); converted internally to Nix SRI.
# Output: dist/flake.nix
set -euo pipefail

VERSION="${1:?version}"; GH_OWNER="${2:-zeetec20}"
SHA_DARWIN_ARM64="${3:?darwin-arm64 sha256}"
SHA_DARWIN_X64="${4:?darwin-x64 sha256}"
SHA_LINUX_ARM64="${5:?linux-arm64 sha256}"
SHA_LINUX_X64="${6:?linux-x64 sha256}"

hex_to_sri() {
  python3 -c "
import sys, base64, binascii
print('sha256-' + base64.b64encode(binascii.unhexlify(sys.argv[1])).decode())
" "$1"
}

SRI_DARWIN_ARM64="$(hex_to_sri "$SHA_DARWIN_ARM64")"
SRI_DARWIN_X64="$(hex_to_sri "$SHA_DARWIN_X64")"
SRI_LINUX_ARM64="$(hex_to_sri "$SHA_LINUX_ARM64")"
SRI_LINUX_X64="$(hex_to_sri "$SHA_LINUX_X64")"

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/dist"

sed \
  -e "s|__VERSION__|$VERSION|g" \
  -e "s|__GH_OWNER__|$GH_OWNER|g" \
  -e "s|__SHA256_DARWIN_ARM64__|$SRI_DARWIN_ARM64|g" \
  -e "s|__SHA256_DARWIN_X64__|$SRI_DARWIN_X64|g" \
  -e "s|__SHA256_LINUX_ARM64__|$SRI_LINUX_ARM64|g" \
  -e "s|__SHA256_LINUX_X64__|$SRI_LINUX_X64|g" \
  "$ROOT/flake.nix" > "$ROOT/dist/flake.nix"

echo "wrote dist/flake.nix (v$VERSION, $GH_OWNER)"
