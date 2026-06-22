export type Status = "backlog" | "todo" | "doing" | "review" | "done";

export const STATUSES: Status[] = ["backlog", "todo", "doing", "review", "done"];
export const DEFAULT_STATUS: Status = "backlog";

export function isStatus(v: string): v is Status {
  return (STATUSES as string[]).includes(v);
}

export interface Task {
  /** Auto-generated id, e.g. "#WRK-1". Stable once assigned. */
  id: string;
  /** Task name (the `##` heading). */
  name: string;
  /** Optional due date, ISO `YYYY-MM-DD`. */
  due?: string;
  /** Workflow status. */
  status: Status;
  /** Optional tags. */
  tags: string[];
  /** Markdown description body. */
  description: string;
  /** Creation timestamp, ISO datetime. Set on creation; optional for legacy tasks. */
  createdAt?: string;
  /** Last-updated timestamp, ISO datetime. Set on edit/status change. */
  updatedAt?: string;
  /** Derived from parent directory name of the TODO.md. */
  category: string;
  /** Absolute path to the TODO.md that holds this task. */
  filePath: string;
  /** Unknown metadata keys, preserved on rewrite. */
  extra: Record<string, string>;
}

export interface Filter {
  status?: Status;
  tag?: string;
  category?: string;
  /** "today" | "overdue" | a `YYYY-MM-DD` exact match. */
  due?: string;
  /** Inclusive created-date range lower bound, `YYYY-MM-DD`. */
  createdFrom?: string;
  /** Inclusive created-date range upper bound, `YYYY-MM-DD`. */
  createdTo?: string;
  /** free-text match against name/description/tags. */
  search?: string;
}

/** Fields needed to create a task; id/category resolved by repo. */
export interface NewTaskInput {
  name: string;
  category: string;
  due?: string;
  status?: Status;
  tags?: string[];
  description?: string;
}
