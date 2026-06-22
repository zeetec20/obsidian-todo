import { mkdir, rm, rmdir } from "fs/promises";
import { join } from "path";
import { parseTodoFile, serializeTasks } from "./parser.ts";
import { categoryOf, findTodoFiles } from "./scanner.ts";
import { nextId } from "./id.ts";
import {
  DEFAULT_STATUS,
  type Filter,
  type NewTaskInput,
  type Task,
} from "./types.ts";

/** Scan the vault and parse every task across all TODO.md files. */
export async function loadAllTasks(vault: string): Promise<Task[]> {
  const files = await findTodoFiles(vault);
  const tasks: Task[] = [];
  for (const file of files) {
    const text = await Bun.file(file).text();
    tasks.push(...parseTodoFile(text, categoryOf(file), file));
  }
  return tasks;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function filterTasks(tasks: Task[], f: Filter): Task[] {
  const today = todayISO();
  return tasks.filter((t) => {
    if (f.status && t.status !== f.status) return false;
    if (f.category && t.category !== f.category) return false;
    if (f.tag && !t.tags.includes(f.tag)) return false;
    if (f.due) {
      if (f.due === "today" && t.due !== today) return false;
      else if (f.due === "overdue") {
        if (!t.due || t.due >= today) return false;
      } else if (f.due !== "today" && f.due !== "overdue" && t.due !== f.due) {
        return false;
      }
    }
    if (f.createdFrom || f.createdTo) {
      const c = t.createdAt?.slice(0, 10);
      if (!c) return false;
      if (f.createdFrom && c < f.createdFrom) return false;
      if (f.createdTo && c > f.createdTo) return false;
    }
    if (f.search) {
      const q = f.search.toLowerCase();
      const hay = `${t.id} ${t.name} ${t.description} ${t.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

/** Path to a category's TODO.md within the vault. */
export function categoryFilePath(vault: string, category: string): string {
  return join(vault, category, "TODO.md");
}

/** Read just the tasks of one TODO.md (empty list if missing). */
async function readFileTasks(filePath: string, category: string): Promise<Task[]> {
  const file = Bun.file(filePath);
  if (!(await file.exists())) return [];
  return parseTodoFile(await file.text(), category, filePath);
}

async function writeFileTasks(filePath: string, tasks: Task[]): Promise<void> {
  await mkdir(join(filePath, ".."), { recursive: true });
  await Bun.write(filePath, serializeTasks(tasks));
}

/**
 * Create a task. Works for both an existing category dir and a brand-new one
 * (the dir + TODO.md are created on demand). `allTasks` is used only to compute
 * a vault-unique id, so callers should pass the current full task list.
 */
export async function addTask(
  vault: string,
  input: NewTaskInput,
  allTasks: Task[],
): Promise<Task> {
  const filePath = categoryFilePath(vault, input.category);
  const existing = await readFileTasks(filePath, input.category);
  const task: Task = {
    id: nextId(input.category, allTasks),
    name: input.name,
    due: input.due,
    status: input.status ?? DEFAULT_STATUS,
    tags: input.tags ?? [],
    description: input.description ?? "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    category: input.category,
    filePath,
    extra: {},
  };
  await writeFileTasks(filePath, [...existing, task]);
  return task;
}

/** Rewrite a task in place (matched by id within its file). Stamps updatedAt. */
export async function updateTask(task: Task): Promise<void> {
  const stamped = { ...task, updatedAt: new Date().toISOString() };
  const tasks = await readFileTasks(stamped.filePath, stamped.category);
  const idx = tasks.findIndex((t) => t.id === stamped.id);
  if (idx === -1) tasks.push(stamped);
  else tasks[idx] = stamped;
  await writeFileTasks(stamped.filePath, tasks);
}

/** Remove a task from its file (the file is kept even if it becomes empty). */
export async function deleteTask(task: Task): Promise<void> {
  const tasks = await readFileTasks(task.filePath, task.category);
  const remaining = tasks.filter((t) => t.id !== task.id);
  await writeFileTasks(task.filePath, remaining);
}

/**
 * Delete a category: remove its TODO.md, then rmdir the directory if it is now
 * empty (other files like images are left in place — the dir is kept). Returns
 * whether the directory itself was removed.
 */
export async function deleteCategory(
  vault: string,
  category: string,
): Promise<{ dirRemoved: boolean }> {
  const filePath = categoryFilePath(vault, category);
  await rm(filePath, { force: true });
  const dir = join(vault, category);
  try {
    await rmdir(dir); // fails if not empty
    return { dirRemoved: true };
  } catch {
    return { dirRemoved: false };
  }
}

/** Create an empty TODO.md for a new category directory. */
export async function createCategoryTodo(
  vault: string,
  category: string,
): Promise<string> {
  const filePath = categoryFilePath(vault, category);
  const file = Bun.file(filePath);
  if (!(await file.exists())) await writeFileTasks(filePath, []);
  return filePath;
}

/** Distinct category names currently present in the vault. */
export function categoriesOf(tasks: Task[]): string[] {
  return [...new Set(tasks.map((t) => t.category))].sort();
}

/**
 * Every category dir that actually contains a TODO.md (valid structure),
 * including empty ones — unlike {@link categoriesOf} which only sees parsed tasks.
 */
export async function listCategories(vault: string): Promise<string[]> {
  const files = await findTodoFiles(vault);
  return [...new Set(files.map(categoryOf))].sort();
}
