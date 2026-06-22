# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

`otodo` — a Bun CLI + terminal UI (OpenTUI + `@opentui/react`, React 19) that scans an
Obsidian vault for `TODO.md` files and browses/filters/creates/edits/deletes the tasks
inside them. No build step; Bun runs the TypeScript/TSX directly.

## Commands

```bash
bun install
bun run src/index.ts [args]        # run from source (e.g. `... list --json`)
bun test                           # all tests
bun test test/repo.test.ts         # one file
bun test -t "deleteCategory"       # one test by name
bunx tsc --noEmit                  # typecheck — the source of truth for type errors
```

**`bunx tsc --noEmit` is authoritative.** The editor's TS server frequently shows stale
diagnostics for `src/tui/icons.ts` (Nerd Font glyphs); trust `tsc`, not the inline error.

Editing `icons.ts`: glyphs are real multibyte codepoints that render blank in the Edit
tool, so string-match edits fail. Regenerate the whole file with `bun -e` + `String.fromCodePoint`.

### Exercising the TUI

It needs a TTY. Drive it headlessly with a pty + scripted keystrokes:

```bash
( sleep 2; printf 'jjn\r' ) | XDG_CONFIG_HOME=$(mktemp -d) script -q /dev/null bun run src/index.ts
```

The pty only redraws changed cells, so grepping frames is unreliable for asserting final
layout — confirm visual/layout/mouse behavior in a real terminal.

## Release / Homebrew

See `RELEASE.md`. Key constraint: **OpenTUI uses native per-platform FFI packages
(`@opentui/core-<platform>`) gated by `cpu`/`os`, so cross-compiling another arch from
this machine fails.** Each arch builds on its own native runner via
`.github/workflows/release.yml` (tag `v*`). Local builds (`scripts/build-release.sh`)
cover the host arch only.

## Architecture

Two entry paths from `src/index.ts` (argv via `node:util` `parseArgs`):
- **CLI** (`list`/`rm`/`vault`/`theme`) — uses `core/` directly, prints via `cli/print.ts`, no TUI.
- **TUI** (default / `new`) — lazy-imports `tui/app.tsx` `runTui()`.

### Data flow (`src/core/`)

The TODO.md file **is** the database — there is no separate store.

- `scanner.ts` walks the vault for `TODO.md` (skips `.obsidian`, `node_modules`).
  **Category = the parent folder name.**
- `parser.ts` round-trips `TODO.md` ⇄ `Task[]`. Format: `## heading` = name, then
  `key: value` metadata lines, blank line, then markdown body = description.
  `KNOWN_KEYS` = id/due/status/tags/created/updated; **any other key is preserved
  verbatim on rewrite** so hand-edits in Obsidian survive. Adding a task field means
  touching `types.ts` + `parser.ts` (parse + serialize) + `KNOWN_KEYS`.
- `id.ts` — `#{ACRONYM}-{n}`, acronym derived from category words, counter per acronym.
- `repo.ts` — high-level ops (`loadAllTasks`, `filterTasks`, `add/update/deleteTask`,
  `deleteCategory`, `listCategories`). `addTask` stamps `createdAt`+`updatedAt`;
  `updateTask` re-stamps `updatedAt`. `filterTasks` is shared by CLI and TUI.
- `config.ts` — XDG `~/.config/obsidian-todo/config.json`. Holds a **vault list**
  (`vaults[]` + `lastVault`), `theme`, `mode`, `editor`. Migrates the legacy single
  `vaultPath`. `validateVault` requires a `.obsidian/` dir.
- `theme.ts` — every theme has **light + dark** variants. `resolveTheme(name, mode,
  sysMode)` picks one; `mode："auto"` follows `detectSystemMode()` (macOS `defaults read
  -g AppleInterfaceStyle`). Unknown name → obsidian.

### TUI (`src/tui/`)

- `app.tsx` is the hub: owns vault/tasks/filter/selection/mode state, all keybindings,
  and renders the two-pane layout + overlays. Most other files are presentational.
- **Mode-based overlays**: the main list always renders; modals (`form`, `help`,
  `theme`, `confirm`, `status`, `catfilter`, `datefilter`, `vault`) layer on top via
  `Overlay`/`Modal`. `useKeyboard` fires for *all* keys — handlers gate on the current
  mode; modal modes early-return so the child owns input.
- **Row model**: the list is a flat `ListRow[]` of `{type:"category"}` and
  `{type:"task"}` rows (`TaskList.tsx`), built in `app.tsx`. `selectedIndex` indexes
  this array; `-1` = nothing focused (intentional on first open / after tab switch).
- `keymap.ts` is the single source for keybindings **and** the help panel — update it
  when you change a binding. (README's keybinding list is partly stale: theme is `t`
  not `T`; date filter is `f`/createdAt.)

### OpenTUI gotchas (cause real, hard-to-spot bugs)

- **Stable keys in `<scrollbox>`**: children must key by flat position (`key={`row-${i}`}`).
  Reused/duplicate keys (e.g. keying on `task.id`) leave ghost rows after search-clear,
  delete, or filter changes.
- **Sibling `<text>` coalesce**: consecutive plain `<text>` siblings merge — wrap each
  logical row in its own `<box>`.
- **Yoga shrink**: rows in a scrollbox that overflows get compressed unless pinned with
  `flexShrink:0` + explicit `height`. Both task and category rows are pinned for uniform
  spacing — keep them that way.
- `<textarea>` value is read via the ref's `.plainText`, not a controlled `value`.
- No native click-count; double-click is detected by timing (`lastClick` ref in `app.tsx`).
