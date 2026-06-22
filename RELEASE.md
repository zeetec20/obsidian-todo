# Releasing otodo via Homebrew

Distribution: prebuilt, self-contained binaries (Bun runtime bundled — no install-time
deps) on GitHub Releases, installed through a custom Homebrew tap.

> **Why CI, not local cross-compile?** OpenTUI ships native (FFI) bindings per
> platform. `bun build --compile` can only target the arch whose
> `@opentui/core-<platform>` package is unpacked — and those are gated by `cpu`/`os`,
> so an arm64 Mac cannot produce an x64 binary. Each arch is therefore built on its
> own native runner (`.github/workflows/release.yml`: macos-14 arm64 + macos-13 x64).

## One-time setup

1. **Code repo** — push this project to `github.com/zeetec20/obsidian-todo`.
2. **Tap repo** — create `github.com/zeetec20/homebrew-otodo` (name must be
   `homebrew-<tap>`), with a `Formula/` directory.
3. *(optional, for auto-tap-update)* add repo secret `TAP_GITHUB_TOKEN` — a PAT with
   `contents:write` on `zeetec20/homebrew-otodo`. Without it, the formula is still
   attached to each release as `otodo.rb` for you to copy manually.

## Cut a release (automated)

```bash
# bump "version" in package.json, commit, then:
git tag v0.1.0
git push origin v0.1.0
```

The workflow then: builds + tests both arches natively, publishes a GitHub release
with `otodo-darwin-arm64.tar.gz`, `otodo-darwin-x64.tar.gz`, and `otodo.rb`, and
(if `TAP_GITHUB_TOKEN` is set) commits the formula to the tap.

If `TAP_GITHUB_TOKEN` is not set, finish manually:

```bash
gh release download v0.1.0 -p otodo.rb -D /tmp
cp /tmp/otodo.rb /path/to/homebrew-otodo/Formula/otodo.rb
cd /path/to/homebrew-otodo && git commit -am "otodo 0.1.0" && git push
```

## Build locally (your arch only)

```bash
./scripts/build-release.sh                 # -> dist/otodo-darwin-<arch>.tar.gz + .sha256
./scripts/gen-formula.sh 0.1.0 zeetec20 <arm64_sha> <x64_sha>   # -> dist/otodo.rb
```

Local builds cover one arch — use the workflow for a real multi-arch release.

## Install (end users)

```bash
brew install zeetec20/otodo/otodo
# or:  brew tap zeetec20/otodo && brew install otodo
```

## Notes

- Add Linux: append `bun-linux-x64` / `bun-linux-arm64` runners to the matrix and an
  `on_linux` block to `Formula/otodo.rb`.
- Each binary is ~62 MB compressed runtime; `--minify` is applied.
- `Formula/otodo.rb` is a **template** (`__PLACEHOLDER__` tokens). The runnable
  formula is generated to `dist/otodo.rb`.
