import { describe, expect, test } from "bun:test";
import { mkdtemp, mkdir, writeFile } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { parseTodoFile, serializeTasks, extractImages } from "../src/core/parser.ts";
import { acronym, nextId } from "../src/core/id.ts";
import { findTodoFiles, categoryOf } from "../src/core/scanner.ts";
import { filterTasks } from "../src/core/repo.ts";
import { createdCol, dayName, relativeTime, statusCounts } from "../src/tui/format.ts";
import type { Task } from "../src/core/types.ts";

const SAMPLE = `## Fix login bug
id: #WRK-1
due: 2026-07-01
status: doing
tags: [auth, urgent]
priority: high

Description in **markdown**.
![shot](./img.png)

## Deploy v2
id: #WRK-2
status: backlog
`;

const SAMPLE_TABLE = `## 1. Fix login bug
| id | due | status | tags | created | updated | priority |
|---|---|---|---|---|---|---|
| #WRK-1 | 2026-07-01 | doing | [auth, urgent] | - | - | high |

Description in **markdown**.
![shot](./img.png)

---

## 2. Deploy v2
| id | due | status | tags | created | updated |
|---|---|---|---|---|---|
| #WRK-2 | - | backlog | - | - | - |
`;

describe("parser", () => {
  test("parses legacy key:value tasks", () => {
    const tasks = parseTodoFile(SAMPLE, "Work", "/v/Work/TODO.md");
    expect(tasks).toHaveLength(2);
    const [a, b] = tasks;
    expect(a!.name).toBe("Fix login bug");
    expect(a!.id).toBe("#WRK-1");
    expect(a!.due).toBe("2026-07-01");
    expect(a!.status).toBe("doing");
    expect(a!.tags).toEqual(["auth", "urgent"]);
    expect(a!.extra).toEqual({ priority: "high" });
    expect(a!.description).toContain("**markdown**");
    expect(a!.category).toBe("Work");
    expect(b!.status).toBe("backlog");
    expect(b!.description).toBe("");
  });

  test("parses table-format tasks", () => {
    const tasks = parseTodoFile(SAMPLE_TABLE, "Work", "/v/Work/TODO.md");
    expect(tasks).toHaveLength(2);
    const [a, b] = tasks;
    expect(a!.name).toBe("Fix login bug");
    expect(a!.id).toBe("#WRK-1");
    expect(a!.due).toBe("2026-07-01");
    expect(a!.status).toBe("doing");
    expect(a!.tags).toEqual(["auth", "urgent"]);
    expect(a!.extra).toEqual({ priority: "high" });
    expect(a!.description).toContain("**markdown**");
    expect(b!.status).toBe("backlog");
    expect(b!.description).toBe("");
  });

  test("serializes to horizontal table format with dividers and counters", () => {
    const tasks = parseTodoFile(SAMPLE, "Work", "/v/Work/TODO.md");
    const text = serializeTasks(tasks);
    expect(text).toContain("## 1. Fix login bug");
    expect(text).toContain("## 2. Deploy v2");
    expect(text).toContain("---");
    expect(text).toContain("| id | due | status | tags |");
    expect(text).toContain("| #WRK-1 |");
    expect(text).toContain("| doing |");
    expect(text).toContain("| [auth, urgent] |");
    expect(text).toContain("| priority |");
  });

  test("round-trips (idempotent, preserves unknown keys)", () => {
    const tasks = parseTodoFile(SAMPLE, "Work", "/v/Work/TODO.md");
    const text = serializeTasks(tasks);
    const reparsed = parseTodoFile(text, "Work", "/v/Work/TODO.md");
    expect(serializeTasks(reparsed)).toBe(text);
    expect(reparsed).toEqual(tasks);
  });

  test("round-trips a task with a created timestamp", () => {
    const src = `## A\nid: #WRK-1\nstatus: todo\ncreated: 2026-06-01T10:00:00.000Z\n`;
    const tasks = parseTodoFile(src, "Work", "/v/Work/TODO.md");
    expect(tasks[0]!.createdAt).toBe("2026-06-01T10:00:00.000Z");
    const text = serializeTasks(tasks);
    expect(text).toContain("| 2026-06-01T10:00:00.000Z |");
    expect(serializeTasks(parseTodoFile(text, "Work", "/v/Work/TODO.md"))).toBe(text);
  });

  test("extractImages finds refs", () => {
    expect(extractImages("![a](x.png) text ![](y.jpg)")).toEqual([
      { alt: "a", path: "x.png" },
      { alt: "", path: "y.jpg" },
    ]);
  });
});

describe("id", () => {
  test("acronym rules", () => {
    expect(acronym("Work")).toBe("WRK");
    expect(acronym("Side Project")).toBe("SP");
    expect(acronym("a-b-c")).toBe("ABC");
    expect(acronym("")).toBe("GEN");
  });

  test("nextId increments per acronym", () => {
    const tasks = [
      { id: "#WRK-1", category: "Work" },
      { id: "#WRK-3", category: "Work" },
      { id: "#SP-1", category: "Side Project" },
    ] as Task[];
    expect(nextId("Work", tasks)).toBe("#WRK-4");
    expect(nextId("Side Project", tasks)).toBe("#SP-2");
    expect(nextId("New Thing", tasks)).toBe("#NT-1");
  });
});

describe("scanner", () => {
  test("finds TODO.md, skips dotdirs, derives category", async () => {
    const root = await mkdtemp(join(tmpdir(), "otodo-scan-"));
    await mkdir(join(root, "Work"), { recursive: true });
    await mkdir(join(root, "Home"), { recursive: true });
    await mkdir(join(root, ".obsidian"), { recursive: true });
    await writeFile(join(root, "Work", "TODO.md"), "## a\nstatus: todo\n");
    await writeFile(join(root, "Home", "TODO.md"), "## b\nstatus: todo\n");
    await writeFile(join(root, ".obsidian", "TODO.md"), "## skip\n");
    const files = await findTodoFiles(root);
    expect(files).toHaveLength(2);
    expect(files.map(categoryOf).sort()).toEqual(["Home", "Work"]);
  });
});

describe("relativeTime", () => {
  const ago = (ms: number) => new Date(Date.now() - ms).toISOString();
  test("buckets", () => {
    expect(relativeTime(undefined)).toBe("—");
    expect(relativeTime(ago(10 * 1000))).toBe("just now");
    expect(relativeTime(ago(5 * 60 * 1000))).toBe("5m");
    expect(relativeTime(ago(3 * 3600 * 1000))).toBe("3h");
    expect(relativeTime(ago(2 * 86400 * 1000))).toBe("2d");
    expect(relativeTime(ago(14 * 86400 * 1000))).toBe("2w");
    expect(relativeTime(ago(400 * 86400 * 1000))).toBe("1y");
  });
});

describe("list formatters", () => {
  test("dayName", () => {
    expect(dayName("2026-06-21")).toBe("Sun");
    expect(dayName("2026-06-22")).toBe("Mon");
    expect(dayName(undefined)).toBe("");
    expect(dayName("bad")).toBe("");
  });
  test("createdCol", () => {
    expect(createdCol(undefined)).toBe("-");
    const iso = new Date(Date.now() - 2 * 86400 * 1000).toISOString();
    expect(createdCol(iso)).toBe(`${iso.slice(0, 10)} - 2d ago`);
  });
  test("statusCounts", () => {
    const tasks = [
      { status: "doing" },
      { status: "doing" },
      { status: "done" },
    ] as Task[];
    const c = statusCounts(tasks);
    expect(c.doing).toBe(2);
    expect(c.done).toBe(1);
    expect(c.backlog).toBe(0);
  });
});

describe("filter", () => {
  const tasks = [
    { name: "a", status: "doing", tags: ["x"], due: "2020-01-01", description: "" },
    { name: "b", status: "done", tags: ["y"], due: undefined, description: "find me" },
  ] as Task[];

  test("status + tag + search + overdue", () => {
    expect(filterTasks(tasks, { status: "doing" })).toHaveLength(1);
    expect(filterTasks(tasks, { tag: "y" })).toHaveLength(1);
    expect(filterTasks(tasks, { search: "find" })).toHaveLength(1);
    expect(filterTasks(tasks, { due: "overdue" })).toHaveLength(1);
  });
});
