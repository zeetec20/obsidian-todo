import type { Status, Task } from "../core/types.ts";

const RESET = "\x1b[0m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";

const STATUS_ANSI: Record<Status, string> = {
  backlog: "\x1b[90m", // grey
  todo: "\x1b[34m", // blue
  doing: "\x1b[33m", // yellow
  review: "\x1b[35m", // magenta
  done: "\x1b[32m", // green
};

const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code: string, s: string) => (useColor ? code + s + RESET : s);

function pad(s: string, n: number): string {
  return s.length >= n ? s : s + " ".repeat(n - s.length);
}

/** Print tasks as JSON or a grouped, colorized table. */
export function printTasks(tasks: Task[], opts: { json?: boolean } = {}): void {
  if (opts.json) {
    process.stdout.write(
      JSON.stringify(
        tasks.map(({ filePath, extra, ...t }) => ({ ...t, filePath })),
        null,
        2,
      ) + "\n",
    );
    return;
  }

  if (tasks.length === 0) {
    process.stdout.write(c(DIM, "No tasks found.\n"));
    return;
  }

  const groups = new Map<string, Task[]>();
  for (const t of tasks) {
    const arr = groups.get(t.category) ?? [];
    arr.push(t);
    groups.set(t.category, arr);
  }

  const idW = Math.max(...tasks.map((t) => t.id.length), 2);
  const stW = 7; // longest status "backlog"
  const dueW = 10;

  for (const [category, list] of [...groups].sort()) {
    process.stdout.write(c(BOLD, `\n${category}\n`));
    for (const t of list) {
      const id = c(DIM, pad(t.id, idW));
      const st = c(STATUS_ANSI[t.status], pad(t.status, stW));
      const due = c(DIM, pad(t.due ?? "-", dueW));
      const tags = t.tags.length ? c(DIM, " " + t.tags.map((x) => "#" + x).join(" ")) : "";
      process.stdout.write(`  ${id}  ${st}  ${due}  ${t.name}${tags}\n`);
    }
  }
  process.stdout.write(c(DIM, `\n${tasks.length} task(s)\n`));
}
