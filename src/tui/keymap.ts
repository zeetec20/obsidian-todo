import { THEME_NAMES } from "../core/theme.ts";

export interface KeyBinding {
  keys: string;
  desc: string;
}

export interface KeyGroup {
  title: string;
  items: KeyBinding[];
}

export const KEYMAP_GROUPS: KeyGroup[] = [
  {
    title: "Navigation",
    items: [
      { keys: "j / ↓", desc: "Move down" },
      { keys: "k / ↑", desc: "Move up" },
      { keys: "g / G", desc: "Jump to first / last" },
      { keys: "click", desc: "Select row with the mouse" },
    ],
  },
  {
    title: "Tasks",
    items: [
      { keys: "enter", desc: "Edit task / toggle category" },
      { keys: "space", desc: "Collapse / expand category" },
      { keys: "E", desc: "Edit task fields" },
      { keys: "n", desc: "New task" },
      { keys: "e", desc: "Edit description in $EDITOR" },
      { keys: "s", desc: "Change status (quick)" },
      { keys: "d", desc: "Delete task — or category (on a category row)" },
      { keys: "y", desc: "Copy task to clipboard" },
      { keys: "i", desc: "Open image/file externally" },
    ],
  },
  {
    title: "Filter & view",
    items: [
      { keys: "/", desc: "Search" },
      { keys: "h / l  ←/→", desc: "Move status tab (filters list)" },
      { keys: "c", desc: "Filter by category (modal)" },
      { keys: "f", desc: "Filter by created-date range (modal)" },
      { keys: "x", desc: "Clear all filters" },
    ],
  },
  {
    title: "App",
    items: [
      { keys: "r", desc: "Rescan vault" },
      { keys: "V", desc: "Switch vault (back to picker)" },
      { keys: "t", desc: "Theme picker" },
      { keys: "?", desc: "Toggle this help" },
      { keys: "q", desc: "Quit" },
    ],
  },
];

export interface CliDoc {
  cmd: string;
  desc: string;
}

export const CLI_DOCS: CliDoc[] = [
  { cmd: "otodo", desc: "Launch the TUI" },
  { cmd: "otodo list", desc: "Print tasks to stdout (no TUI)" },
  { cmd: "  --status <s>", desc: "backlog|todo|doing|review|done" },
  { cmd: "  --tag <t>", desc: "Filter by tag" },
  { cmd: "  --category <c>", desc: "Filter by category" },
  { cmd: "  --due <d>", desc: "YYYY-MM-DD | today | overdue" },
  { cmd: "  --json", desc: "Machine-readable output" },
  { cmd: "otodo new", desc: "Quick create (TUI form)" },
  { cmd: "otodo rm <id>", desc: "Delete task by id (--yes to skip confirm)" },
  { cmd: "otodo vault <path>", desc: "Add/select a vault" },
  { cmd: "otodo theme <name>", desc: THEME_NAMES.join(" | ") },
];
