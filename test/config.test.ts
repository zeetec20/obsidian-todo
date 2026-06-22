import { describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { addVault, removeVault, validateVault, type Config } from "../src/core/config.ts";
import { resolveTheme } from "../src/core/theme.ts";

async function tmp() {
  return mkdtemp(join(tmpdir(), "otodo-cfg-"));
}

describe("validateVault", () => {
  test("rejects missing path", async () => {
    const r = await validateVault(join(tmpdir(), "otodo-does-not-exist-xyz"));
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("Path does not exist");
  });

  test("rejects a file", async () => {
    const dir = await tmp();
    const file = join(dir, "note.md");
    await writeFile(file, "x");
    const r = await validateVault(file);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("Not a directory");
  });

  test("rejects a dir without .obsidian/", async () => {
    const dir = await tmp();
    const r = await validateVault(dir);
    expect(r.ok).toBe(false);
    expect(r.reason).toContain(".obsidian");
  });

  test("accepts a dir with .obsidian/", async () => {
    const dir = await tmp();
    await mkdir(join(dir, ".obsidian"));
    const r = await validateVault(dir);
    expect(r.ok).toBe(true);
  });
});

describe("addVault", () => {
  test("appends + sets lastVault, de-dupes", () => {
    let cfg: Config = {};
    cfg = addVault(cfg, "/a");
    expect(cfg.vaults).toEqual(["/a"]);
    expect(cfg.lastVault).toBe("/a");

    cfg = addVault(cfg, "/b");
    expect(cfg.vaults).toEqual(["/a", "/b"]);
    expect(cfg.lastVault).toBe("/b");

    cfg = addVault(cfg, "/a");
    expect(cfg.vaults).toEqual(["/a", "/b"]);
    expect(cfg.lastVault).toBe("/a");
  });

  test("removeVault drops it and reassigns lastVault", () => {
    let cfg: Config = { vaults: ["/a", "/b"], lastVault: "/a" };
    cfg = removeVault(cfg, "/a");
    expect(cfg.vaults).toEqual(["/b"]);
    expect(cfg.lastVault).toBe("/b");
    cfg = removeVault(cfg, "/b");
    expect(cfg.vaults).toEqual([]);
    expect(cfg.lastVault).toBeUndefined();
  });
});

describe("resolveTheme", () => {
  test("auto follows system mode; explicit overrides; unknown falls back to obsidian", () => {
    const autoDark = resolveTheme("tokyonight", "auto", "dark");
    const autoLight = resolveTheme("tokyonight", "auto", "light");
    expect(autoDark.bg).not.toBe(autoLight.bg);

    const forcedLight = resolveTheme("tokyonight", "light", "dark");
    expect(forcedLight.bg).toBe(autoLight.bg);

    expect(resolveTheme("nonexistent", "dark", "dark").name).toBe("obsidian");
  });
});
