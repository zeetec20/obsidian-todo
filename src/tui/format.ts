import { STATUSES, type Status, type Task } from "../core/types.ts";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Compact relative time: "just now", "5m", "3h", "2d", "4w", "1y". */
export function relativeTime(iso: string | undefined): string {
  if (!iso) return "—";
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "—";
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 60) return "just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d`;
  const wk = Math.floor(day / 7);
  if (day < 365) return `${wk}w`;
  return `${Math.floor(day / 365)}y`;
}

/** Returns "overdue" | "today" | "" for a task's due date. */
export function dueState(t: Task): "overdue" | "today" | "" {
  if (!t.due) return "";
  const today = todayISO();
  if (t.due < today) return "overdue";
  if (t.due === today) return "today";
  return "";
}

/** Three-letter weekday for a YYYY-MM-DD date, or "" if unparseable/empty. */
export function dayName(due: string | undefined): string {
  if (!due) return "";
  const m = due.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return "";
  return DAYS[new Date(+m[1]!, +m[2]! - 1, +m[3]!).getDay()] ?? "";
}

/** Created column: "2026-06-20 - 1d" (date part + relative age), or "-". */
export function createdCol(iso: string | undefined): string {
  if (!iso) return "-";
  const date = iso.slice(0, 10);
  const relativeTimeText = relativeTime(iso);

  return `${date} - ${relativeTimeText} ${relativeTimeText === "just now" ? "" : "ago"}`;
}

/** Count tasks per status. */
export function statusCounts(tasks: Task[]): Record<Status, number> {
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<
    Status,
    number
  >;
  for (const t of tasks) counts[t.status]++;
  return counts;
}
