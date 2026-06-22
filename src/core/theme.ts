import type { Status } from "./types.ts";

export interface Theme {
  name: string;
  bg?: string;
  fg?: string;
  border: string;
  accent: string;
  muted: string;
  selectedBg: string;
  selectedFg: string;
  status: Record<Status, string>;
}

export type Mode = "auto" | "light" | "dark";

export const THEME_NAMES = [
  "obsidian",
  "tokyonight",
  "everforest",
  "ayu",
  "catppuccin",
  "catppuccin-macchiato",
  "gruvbox",
  "kanagawa",
  "nord",
  "matrix",
  "one-dark",
] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

/** Compact palette builder. */
function pal(
  bg: string,
  fg: string,
  border: string,
  accent: string,
  muted: string,
  selectedBg: string,
  selectedFg: string,
  backlog: string,
  todo: string,
  doing: string,
  review: string,
  done: string,
): Omit<Theme, "name"> {
  return {
    bg,
    fg,
    border,
    accent,
    muted,
    selectedBg,
    selectedFg,
    status: { backlog, todo, doing, review, done },
  };
}

const PALETTES: Record<ThemeName, { dark: Omit<Theme, "name">; light: Omit<Theme, "name"> }> = {
  obsidian: {
    dark: pal("#1e1e1e", "#dcddde", "#3b3b3b", "#a882ff", "#7a7a7a", "#483699", "#ffffff", "#7a7a7a", "#7aa2f7", "#e0af68", "#bb9af7", "#9ece6a"),
    light: pal("#ffffff", "#1e1e1e", "#d4d4d4", "#7c3aed", "#9a9a9a", "#d8c9ff", "#1e1e1e", "#9a9a9a", "#3b82f6", "#b8860b", "#8b5cf6", "#3f9142"),
  },
  tokyonight: {
    dark: pal("#1a1b26", "#c0caf5", "#414868", "#7aa2f7", "#565f89", "#283457", "#c0caf5", "#565f89", "#7aa2f7", "#e0af68", "#bb9af7", "#9ece6a"),
    light: pal("#e1e2e7", "#3760bf", "#a8aecb", "#2e7de9", "#8990b3", "#b7c1e3", "#3760bf", "#8990b3", "#2e7de9", "#8c6c3e", "#9854f1", "#587539"),
  },
  everforest: {
    dark: pal("#2d353b", "#d3c6aa", "#475258", "#a7c080", "#859289", "#475258", "#d3c6aa", "#859289", "#7fbbb3", "#dbbc7f", "#d699b6", "#a7c080"),
    light: pal("#fdf6e3", "#5c6a72", "#e0dcc7", "#8da101", "#a6b0a0", "#e6e2cc", "#5c6a72", "#a6b0a0", "#3a94c5", "#dfa000", "#df69ba", "#8da101"),
  },
  ayu: {
    dark: pal("#0b0e14", "#bfbdb6", "#1d2026", "#39bae6", "#565b66", "#1c2733", "#bfbdb6", "#565b66", "#39bae6", "#ffb454", "#d2a6ff", "#aad94c"),
    light: pal("#fcfcfc", "#5c6166", "#e7e8e9", "#399ee6", "#9da0a2", "#d1e4f4", "#5c6166", "#9da0a2", "#399ee6", "#f2ae49", "#a37acc", "#86b300"),
  },
  catppuccin: {
    dark: pal("#1e1e2e", "#cdd6f4", "#45475a", "#cba6f7", "#6c7086", "#313244", "#cdd6f4", "#6c7086", "#89b4fa", "#f9e2af", "#cba6f7", "#a6e3a1"),
    light: pal("#eff1f5", "#4c4f69", "#ccd0da", "#8839ef", "#9ca0b0", "#dce0e8", "#4c4f69", "#9ca0b0", "#1e66f5", "#df8e1d", "#8839ef", "#40a02b"),
  },
  "catppuccin-macchiato": {
    dark: pal("#24273a", "#cad3f5", "#494d64", "#c6a0f6", "#6e738d", "#363a4f", "#cad3f5", "#6e738d", "#8aadf4", "#eed49f", "#c6a0f6", "#a6da95"),
    light: pal("#eff1f5", "#4c4f69", "#ccd0da", "#8839ef", "#9ca0b0", "#dce0e8", "#4c4f69", "#9ca0b0", "#1e66f5", "#df8e1d", "#8839ef", "#40a02b"),
  },
  gruvbox: {
    dark: pal("#282828", "#ebdbb2", "#504945", "#fabd2f", "#928374", "#3c3836", "#ebdbb2", "#928374", "#83a598", "#fabd2f", "#d3869b", "#b8bb26"),
    light: pal("#fbf1c7", "#3c3836", "#d5c4a1", "#b57614", "#a89984", "#ebdbb2", "#3c3836", "#a89984", "#076678", "#b57614", "#8f3f71", "#79740e"),
  },
  kanagawa: {
    dark: pal("#1f1f28", "#dcd7ba", "#54546d", "#7e9cd8", "#727169", "#2d4f67", "#dcd7ba", "#727169", "#7e9cd8", "#e6c384", "#957fb8", "#98bb6c"),
    light: pal("#f2ecbc", "#545464", "#d5cea3", "#4d699b", "#8a8980", "#dcd5ac", "#545464", "#8a8980", "#4d699b", "#cc6d00", "#624c83", "#6f894e"),
  },
  nord: {
    dark: pal("#2e3440", "#d8dee9", "#434c5e", "#88c0d0", "#616e88", "#3b4252", "#eceff4", "#616e88", "#81a1c1", "#ebcb8b", "#b48ead", "#a3be8c"),
    light: pal("#eceff4", "#2e3440", "#d8dee9", "#5e81ac", "#7b88a1", "#d8dee9", "#2e3440", "#7b88a1", "#5e81ac", "#b48a00", "#9d6fa0", "#5a8a4a"),
  },
  matrix: {
    dark: pal("#000000", "#00ff00", "#003b00", "#00ff66", "#008f11", "#003b00", "#00ff00", "#008f11", "#00cc33", "#39ff14", "#00ffaa", "#00ff00"),
    light: pal("#e8ffe8", "#003b00", "#9fdf9f", "#008f11", "#4f8f4f", "#bff0bf", "#003b00", "#4f8f4f", "#0a7d0a", "#3a8f00", "#008f5a", "#006b00"),
  },
  "one-dark": {
    dark: pal("#282c34", "#abb2bf", "#3e4451", "#61afef", "#5c6370", "#3e4451", "#abb2bf", "#5c6370", "#61afef", "#e5c07b", "#c678dd", "#98c379"),
    light: pal("#fafafa", "#383a42", "#d4d4d4", "#4078f2", "#a0a1a7", "#e5e5e6", "#383a42", "#a0a1a7", "#4078f2", "#c18401", "#a626a4", "#50a14f"),
  },
};

/** Detect the OS appearance (macOS). Defaults to dark on error/non-darwin. */
export function detectSystemMode(): "light" | "dark" {
  if (process.platform !== "darwin") return "dark";
  try {
    const out = Bun.spawnSync(["defaults", "read", "-g", "AppleInterfaceStyle"]);
    return out.stdout.toString().trim() === "Dark" ? "dark" : "light";
  } catch {
    return "dark";
  }
}

/** Resolve a concrete palette from a theme name + mode (auto → system). */
export function resolveTheme(
  name: string | undefined,
  mode: Mode | undefined,
  sysMode: "light" | "dark",
): Theme {
  const key = (THEME_NAMES.includes(name as ThemeName) ? name : "obsidian") as ThemeName;
  const variant = (mode ?? "auto") === "auto" ? sysMode : (mode as "light" | "dark");
  return { name: key, ...PALETTES[key][variant] };
}
