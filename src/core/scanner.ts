import { readdir } from "fs/promises";
import { basename, dirname, join } from "path";

const SKIP_DIRS = new Set([".obsidian", ".git", ".trash", "node_modules"]);
const TODO_NAME = "todo.md";

/** Recursively find every TODO.md (case-insensitive) under the vault. */
export async function findTodoFiles(vault: string): Promise<string[]> {
  const found: string[] = [];

  async function walk(dir: string): Promise<void> {
    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
        await walk(full);
      } else if (entry.isFile() && entry.name.toLowerCase() === TODO_NAME) {
        found.push(full);
      }
    }
  }

  await walk(vault);
  return found.sort();
}

/** Category for a TODO.md = its parent directory name. */
export function categoryOf(todoPath: string): string {
  return basename(dirname(todoPath));
}
