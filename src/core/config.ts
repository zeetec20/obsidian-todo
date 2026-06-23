import { mkdir, stat } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

export interface Config {
  /** Known vault paths (most-recently-used last). */
  vaults?: string[];
  /** Last opened vault path. */
  lastVault?: string;
  /** Legacy single-vault path (migrated into vaults/lastVault on load). */
  vaultPath?: string;
  editor?: string;
  theme?: string;
  /** "auto" follows the OS appearance; else forced light/dark. */
  mode?: "auto" | "light" | "dark";
}

/** Expand a leading `~` to the user's home directory. */
export function expandHome(path: string): string {
  const p = path.trim();
  if (p === "~") return homedir();
  if (p.startsWith("~/")) return join(homedir(), p.slice(2));
  return p;
}

const baseDir =
  process.env.XDG_CONFIG_HOME && process.env.XDG_CONFIG_HOME.trim()
    ? process.env.XDG_CONFIG_HOME
    : join(homedir(), ".config");

export const CONFIG_DIR = join(baseDir, "obsidian-todo");
export const CONFIG_FILE = join(CONFIG_DIR, "config.json");

export async function loadConfig(): Promise<Config> {
  try {
    const file = Bun.file(CONFIG_FILE);
    if (!(await file.exists())) return {};
    return migrate((await file.json()) as Config);
  } catch {
    return {};
  }
}

/** Migrate a legacy single-`vaultPath` config into the vaults/lastVault model. */
function migrate(config: Config): Config {
  const { vaultPath, ...rest } = config;
  if (vaultPath && (!rest.vaults || rest.vaults.length === 0)) {
    return {
      ...rest,
      vaults: [vaultPath],
      lastVault: rest.lastVault ?? vaultPath,
    };
  }
  return rest;
}

/** Add a vault path to the config (de-duped) and mark it as the last opened. */
export function addVault(config: Config, path: string): Config {
  const p = expandHome(path);
  const vaults = [...new Set([...(config.vaults ?? []), p])];
  return { ...config, vaults, lastVault: p };
}

/** Remove a vault path from the config; clears lastVault if it matched. */
export function removeVault(config: Config, path: string): Config {
  const vaults = (config.vaults ?? []).filter((v) => v !== path);
  const lastVault = config.lastVault === path ? vaults[vaults.length - 1] : config.lastVault;
  return { ...config, vaults, lastVault };
}

export interface VaultCheck {
  ok: boolean;
  reason?: string;
}

/** Validate a vault path: must exist, be a directory, contain `.obsidian/`. */
export async function validateVault(path: string): Promise<VaultCheck> {
  const p = expandHome(path);
  if (!p) return { ok: false, reason: "Enter a path" };
  let s;
  try {
    s = await stat(p);
  } catch {
    return { ok: false, reason: "Path does not exist" };
  }
  if (!s.isDirectory()) return { ok: false, reason: "Not a directory" };
  try {
    const o = await stat(join(p, ".obsidian"));
    if (!o.isDirectory()) throw new Error();
  } catch {
    return { ok: false, reason: "No .obsidian folder — not an Obsidian vault" };
  }
  return { ok: true };
}

export async function saveConfig(config: Config): Promise<void> {
  await mkdir(CONFIG_DIR, { recursive: true });
  await Bun.write(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n");
}

/** Resolve the editor command: config.editor > $EDITOR > $VISUAL > nano. */
export function resolveEditor(config: Config): string {
  return (
    config.editor ||
    process.env.EDITOR ||
    process.env.VISUAL ||
    "nano"
  );
}
