# otodo — Obsidian TODO TUI

Scan an Obsidian vault for `TODO.md` files, browse/filter/create/delete the tasks
inside them, in a terminal UI built on [OpenTUI](https://opentui.com) + Bun.

## Install

### Homebrew (macOS)

```bash
brew install zeetec20/otodo/otodo
# or:  brew tap zeetec20/otodo && brew install otodo
```

Self-contained binary (Bun runtime bundled, no dependencies). Upgrade with
`brew upgrade otodo`.

### From source

```bash
bun install
bun link          # optional: exposes the `otodo` binary globally
```

## Usage

```bash
otodo                       # launch the TUI (asks for a vault on first run)
otodo new                   # launch the TUI and open the new-task form
otodo list [filters]        # print tasks to stdout (no TUI)
otodo rm <id> [--yes]       # delete a task by id
otodo vault <path>          # set the Obsidian vault directory
otodo theme <name>          # obsidian | tokyonight | everforest | ayu | catppuccin
                            #   | catppuccin-macchiato | gruvbox | kanagawa | nord
                            #   | matrix | one-dark
otodo --help

# list filters
otodo list --status doing --tag auth --category Work --due overdue --json
```

Run from source without linking: `bun run src/index.ts <args>`.

## How tasks are stored

One `TODO.md` per category folder; the **folder name is the category**. Each
task is a block:

```markdown
## Fix login bug
id: #WRK-1
due: 2026-07-01
status: doing
tags: [auth, urgent]
created: 2026-06-01T10:00:00.000Z

Description in **markdown**.
![shot](./img.png)
```

- `id` is auto-generated as `#{ACRONYM}-{n}` (acronym from the category, counter
  per acronym). Stable once assigned.
- `status` ∈ `backlog | todo | doing | review | done` (default `backlog`), each
  shown in its own color in the list and detail pane.
- `created` is set automatically on creation and shown as relative time
  (`5m`, `3h`, `2d`, `1y`) in the list and detail.
- Unknown metadata keys are preserved on rewrite, so manual Obsidian edits and
  TUI edits coexist.

## TUI

Top bar shows `otodo` + the vault name + task count. Tasks are **grouped by
category** and **numbered per category**. Each task spans two lines:

```
Work
▌ 1. #WRK-1  Fix login bug
     ● doing  ·  2026-07-01 (Wed)  ·  2026-06-20 - 1d
  2. #WRK-2  Deploy
     ● backlog  ·  -  ·  2026-06-19 - 2d
```

Title is colored by status; line 2 carries an explicit status badge, due (with
weekday) and created (`date - age`). Tags show only in the detail pane. The
selected row is marked `▌` (bold) so it matches your terminal palette under the
`terminal` theme (no hardcoded blue).

A **status bar** under the list shows `All` + per-status counts; `h`/`l` (or
`←`/`→`) move the focused status tab and filter the list to it.

`d` opens a centered **delete modal** (`[Delete] [Cancel]` — Tab/←→ + Enter, or
`y`/`n`/`Esc`).

In the **new/edit form**: Tab/Enter move between fields (Enter acts like Tab),
ending on `[Save]`/`[Cancel]` buttons. Category is a dropdown of folders that
contain a `TODO.md` plus `＋ New category…` (reveals a name field right after it).
The due field is a segmented date picker: `→`/digit/arrow on the empty field
accepts today; `←/→` move year/month/day; `↑/↓` adjust; type digits (no `-`);
`Backspace` clears a segment; `Delete` clears the whole date.

### Keybindings

`j/k` (`g/G` top/bottom) move · `enter` edit task / toggle category · `space`
collapse category · `h/l` (`←/→`) status tab · `n` new · `e` edit description in
`$EDITOR` · `E` edit fields · `s` change status · `d` delete (task, or empty
category) · `y` copy task · `i` open image externally · `/` search · `c` filter by
category · `f` filter by created-date range · `x` clear filters · `r` rescan ·
`V` switch vault · `t` theme picker · `?` help · `q` quit.

## Config

`~/.config/obsidian-todo/config.json` (respects `$XDG_CONFIG_HOME`):

```json
{
  "vaults": ["/path/to/Vault"],
  "lastVault": "/path/to/Vault",
  "theme": "obsidian",
  "mode": "auto",
  "editor": "nvim"
}
```

Multiple vaults are supported (chosen on the launch screen). Default theme is
`obsidian`; `mode` is `auto` (follows the OS light/dark appearance), or force
`light`/`dark`. Every theme ships light + dark variants. The legacy single
`vaultPath` key is migrated automatically.

Description editing opens `$EDITOR` (or `config.editor`, falling back to `nano`).
Image preview opens the image in the OS default viewer (`open` / `xdg-open`);
inline terminal pixel rendering is not provided by the OpenTUI version pinned here.

## Tests

```bash
bun test
```
