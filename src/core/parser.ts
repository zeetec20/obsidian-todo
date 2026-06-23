import { type Status, type Task, DEFAULT_STATUS, isStatus } from "./types.ts";

const HEADING_RE = /^##\s+(.*)$/;
const META_RE = /^([A-Za-z][\w-]*):\s?(.*)$/;
const TABLE_ROW_RE = /^\|/;
const TABLE_SEP_RE = /^\|[-:| ]+\|/;
const TABLE_DATA_RE = /^\|\s*([^|]+?)\s*\|\s*(.*?)\s*\|/;
const KNOWN_KEYS = new Set(["id", "due", "status", "tags", "created", "updated"]);

function parseTags(raw: string): string[] {
  const inner = raw.trim().replace(/^\[/, "").replace(/\]$/, "");
  return inner
    .split(",")
    .map((t) => t.trim().replace(/^#/, ""))
    .filter(Boolean);
}

function serializeTags(tags: string[]): string {
  return `[${tags.join(", ")}]`;
}

function assignMeta(
  key: string,
  val: string,
  state: {
    id: string; due: string | undefined; status: Status;
    tags: string[]; createdAt: string | undefined; updatedAt: string | undefined;
    extra: Record<string, string>;
  },
) {
  if (val === "-") return; // placeholder for absent optional fields
  if (key === "id") state.id = val;
  else if (key === "due") state.due = val || undefined;
  else if (key === "status") state.status = isStatus(val) ? val : DEFAULT_STATUS;
  else if (key === "tags") state.tags = parseTags(val);
  else if (key === "created") state.createdAt = val || undefined;
  else if (key === "updated") state.updatedAt = val || undefined;
  else if (!KNOWN_KEYS.has(key)) state.extra[key] = val;
}

/**
 * Parse a TODO.md into tasks. Supports three formats:
 * - Horizontal table: `| id | due | status | ... |` header + one data row per task
 * - Vertical table (legacy): `| Field | Value |` rows
 * - Legacy key:value: `key: value` lines
 */
export function parseTodoFile(
  text: string,
  category: string,
  filePath: string,
): Task[] {
  const lines = text.split(/\r?\n/);
  const tasks: Task[] = [];

  let i = 0;
  // Skip preamble until first heading.
  while (i < lines.length && !HEADING_RE.test(lines[i]!)) i++;

  while (i < lines.length) {
    const headingMatch = lines[i]!.match(HEADING_RE);
    if (!headingMatch) {
      i++;
      continue;
    }
    const name = headingMatch[1]!.trim().replace(/^\d+\.\s+/, "");
    i++;

    const meta = {
      id: "",
      due: undefined as string | undefined,
      status: DEFAULT_STATUS as Status,
      tags: [] as string[],
      createdAt: undefined as string | undefined,
      updatedAt: undefined as string | undefined,
      extra: {} as Record<string, string>,
    };

    if (i < lines.length && TABLE_ROW_RE.test(lines[i]!)) {
      const headerLine = lines[i]!;
      i++;
      const firstCell = headerLine.match(TABLE_DATA_RE)?.[1]?.trim() ?? "";

      if (/^field$/i.test(firstCell)) {
        // Vertical table (legacy new format): | Field | Value | rows.
        while (i < lines.length && lines[i]!.trim() !== "") {
          const line = lines[i++]!;
          if (TABLE_SEP_RE.test(line)) continue;
          const m = line.match(TABLE_DATA_RE);
          if (!m) continue;
          const key = m[1]!.trim();
          if (/^field$/i.test(key)) continue;
          assignMeta(key, m[2]!.trim(), meta);
        }
      } else {
        // Horizontal table: header row already consumed, skip separator, parse data row.
        const headers = headerLine.split("|").map((s) => s.trim()).filter(Boolean);
        if (i < lines.length && TABLE_SEP_RE.test(lines[i]!)) i++;
        while (i < lines.length && lines[i]!.trim() !== "" && TABLE_ROW_RE.test(lines[i]!)) {
          const values = lines[i++]!.split("|").map((s) => s.trim()).filter(Boolean);
          headers.forEach((key, idx) => assignMeta(key, values[idx] ?? "-", meta));
        }
      }
    } else {
      // Legacy key:value format.
      while (i < lines.length) {
        const line = lines[i]!;
        if (line.trim() === "") break;
        const m = line.match(META_RE);
        if (!m) break;
        assignMeta(m[1]!, m[2]!.trim(), meta);
        i++;
      }
    }

    // Skip a single blank separator line.
    if (i < lines.length && lines[i]!.trim() === "") i++;

    // Body: everything until the next heading.
    const bodyLines: string[] = [];
    while (i < lines.length && !HEADING_RE.test(lines[i]!)) {
      bodyLines.push(lines[i]!);
      i++;
    }
    const description = bodyLines.join("\n").replace(/\n+---\s*$/, "").replace(/\s+$/, "");

    tasks.push({
      id: meta.id,
      name,
      due: meta.due,
      status: meta.status,
      tags: meta.tags,
      description,
      createdAt: meta.createdAt,
      updatedAt: meta.updatedAt,
      category,
      filePath,
      extra: meta.extra,
    });
  }

  return tasks;
}

/** Serialize tasks back into TODO.md text using horizontal markdown table per task. */
export function serializeTasks(tasks: Task[]): string {
  const blocks = tasks.map((t, idx) => {
    const n = idx + 1;
    const extraKeys = Object.keys(t.extra);
    const headers = ["id", "due", "status", "tags", "created", "updated", ...extraKeys];
    const values = [
      t.id || "-",
      t.due || "-",
      t.status,
      t.tags.length ? serializeTags(t.tags) : "-",
      t.createdAt || "-",
      t.updatedAt || "-",
      ...extraKeys.map((k) => t.extra[k] ?? "-"),
    ];
    const lines: string[] = [
      `## ${n}. ${t.name}`,
      "| " + headers.join(" | ") + " |",
      "|" + headers.map(() => "---|").join(""),
      "| " + values.join(" | ") + " |",
    ];
    const body = t.description.replace(/\s+$/, "");
    if (body) {
      lines.push("");
      lines.push(body);
    }
    return lines.join("\n");
  });
  return blocks.join("\n\n---\n\n") + "\n";
}

/** Extract image references (`![alt](path)`) from a markdown body. */
export function extractImages(markdown: string): { alt: string; path: string }[] {
  const re = /!\[([^\]]*)\]\(([^)]+)\)/g;
  const out: { alt: string; path: string }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown))) {
    out.push({ alt: m[1]!, path: m[2]!.trim() });
  }
  return out;
}
