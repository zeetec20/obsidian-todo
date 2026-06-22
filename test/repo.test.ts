import { describe, expect, test } from "bun:test";
import { mkdtemp } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import type { Task } from "../src/core/types.ts";
import {
  addTask,
  createCategoryTodo,
  deleteCategory,
  deleteTask,
  filterTasks,
  listCategories,
  loadAllTasks,
  updateTask,
} from "../src/core/repo.ts";

async function vault() {
  return mkdtemp(join(tmpdir(), "otodo-repo-"));
}

describe("repo mutations", () => {
  test("addTask creates new category dir + assigns id", async () => {
    const v = await vault();
    const t = await addTask(v, { name: "First", category: "Work" }, []);
    expect(t.id).toBe("#WRK-1");
    expect(t.status).toBe("backlog");

    const all = await loadAllTasks(v);
    expect(all).toHaveLength(1);
    expect(all[0]!.name).toBe("First");
    expect(all[0]!.category).toBe("Work");
  });

  test("addTask sets createdAt", async () => {
    const v = await vault();
    const t = await addTask(v, { name: "A", category: "Work" }, []);
    expect(t.createdAt).toBeTruthy();
    expect(Number.isNaN(Date.parse(t.createdAt!))).toBe(false);
    const all = await loadAllTasks(v);
    expect(all[0]!.createdAt).toBe(t.createdAt);
  });

  test("listCategories includes an empty-TODO.md dir", async () => {
    const v = await vault();
    await createCategoryTodo(v, "Empty");
    await addTask(v, { name: "A", category: "Work" }, []);
    expect(await listCategories(v)).toEqual(["Empty", "Work"]);
  });

  test("ids increment per acronym across adds", async () => {
    const v = await vault();
    const a = await addTask(v, { name: "A", category: "Work" }, []);
    const all1 = await loadAllTasks(v);
    const b = await addTask(v, { name: "B", category: "Work" }, all1);
    expect(a.id).toBe("#WRK-1");
    expect(b.id).toBe("#WRK-2");
  });

  test("updateTask edits in place", async () => {
    const v = await vault();
    const t = await addTask(v, { name: "A", category: "Work" }, []);
    await updateTask({ ...t, status: "done", description: "done now" });
    const all = await loadAllTasks(v);
    expect(all[0]!.status).toBe("done");
    expect(all[0]!.description).toBe("done now");
    expect(all[0]!.id).toBe("#WRK-1");
  });

  test("deleteTask removes the task, keeps the file", async () => {
    const v = await vault();
    const a = await addTask(v, { name: "A", category: "Work" }, []);
    const all1 = await loadAllTasks(v);
    await addTask(v, { name: "B", category: "Work" }, all1);
    await deleteTask(a);
    const all = await loadAllTasks(v);
    expect(all).toHaveLength(1);
    expect(all[0]!.name).toBe("B");
  });

  test("createCategoryTodo makes an empty TODO.md", async () => {
    const v = await vault();
    const fp = await createCategoryTodo(v, "Ideas");
    expect(fp.endsWith(join("Ideas", "TODO.md"))).toBe(true);
    expect(await loadAllTasks(v)).toHaveLength(0);
    const t = await addTask(v, { name: "X", category: "Ideas" }, []);
    expect(t.id).toBe("#IDS-1");
  });

  test("deleteCategory removes empty dir + its TODO.md", async () => {
    const v = await vault();
    await createCategoryTodo(v, "Empty");
    expect(await listCategories(v)).toEqual(["Empty"]);
    const r = await deleteCategory(v, "Empty");
    expect(r.dirRemoved).toBe(true);
    expect(await listCategories(v)).toEqual([]);
  });
});

describe("filterTasks created-date range", () => {
  function task(name: string, createdAt?: string): Task {
    return {
      id: `#W-${name}`,
      name,
      status: "backlog",
      tags: [],
      description: "",
      createdAt,
      category: "Work",
      filePath: "/x/Work/TODO.md",
      extra: {},
    };
  }

  test("createdFrom/createdTo bound inclusively, exclude tasks with no createdAt", () => {
    const all = [
      task("early", "2026-01-01T08:00:00.000Z"),
      task("mid", "2026-06-15T08:00:00.000Z"),
      task("late", "2026-12-31T08:00:00.000Z"),
      task("none", undefined),
    ];

    const inRange = filterTasks(all, { createdFrom: "2026-06-01", createdTo: "2026-06-30" });
    expect(inRange.map((t) => t.name)).toEqual(["mid"]);

    const fromOnly = filterTasks(all, { createdFrom: "2026-06-15" });
    expect(fromOnly.map((t) => t.name).sort()).toEqual(["late", "mid"]);

    const toOnly = filterTasks(all, { createdTo: "2026-06-15" });
    expect(toOnly.map((t) => t.name).sort()).toEqual(["early", "mid"]);
  });
});
