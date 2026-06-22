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

## Cut a release (automated — no manual tagging)

Versioning + tagging is driven by [release-please](https://github.com/googleapis/release-please)
from [Conventional Commits](https://www.conventionalcommits.org/):

1. Commit to `main` with conventional messages — `fix:` → patch, `feat:` → minor,
   `feat!:`/`BREAKING CHANGE:` → major. (Other prefixes like `chore:`/`docs:` don't
   trigger a release.)
2. release-please opens/updates a **"chore(main): release X.Y.Z" PR** that bumps
   `package.json` + the version manifest and updates `CHANGELOG.md`.
3. **Merge that PR.** release-please then creates the `vX.Y.Z` tag + GitHub release;
   the same workflow builds both arches, uploads the tarballs + `otodo.rb`, and
   (if `TAP_GITHUB_TOKEN` is set) commits the formula to the tap.

State files: `release-please-config.json` + `.release-please-manifest.json` (the
manifest is the source of truth for the current version — keep it in sync with
`package.json`).

If `TAP_GITHUB_TOKEN` is not set, finish the tap manually after the release:

```bash
gh release download vX.Y.Z -p otodo.rb -D /tmp
cp /tmp/otodo.rb /path/to/homebrew-otodo/Formula/otodo.rb
cd /path/to/homebrew-otodo && git commit -am "otodo X.Y.Z" && git push
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
