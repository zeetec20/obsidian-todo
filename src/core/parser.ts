import { type Status, type Task, DEFAULT_STATUS, isStatus } from "./types.ts";

const HEADING_RE = /^##\s+(.*)$/;
const META_RE = /^([A-Za-z][\w-]*):\s?(.*)$/;
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

/**
 * Parse a TODO.md into tasks. Each `## ` heading starts a task block: the
 * heading is the name, contiguous `key: value` lines after it are metadata,
 * and the remainder (after a blank line) is the markdown description.
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
    const name = headingMatch[1]!.trim();
    i++;

    // Metadata: contiguous key: value lines directly after the heading.
    const extra: Record<string, string> = {};
    let id = "";
    let due: string | undefined;
    let status: Status = DEFAULT_STATUS;
    let tags: string[] = [];
    let createdAt: string | undefined;
    let updatedAt: string | undefined;
    while (i < lines.length) {
      const line = lines[i]!;
      if (line.trim() === "") break;
      const m = line.match(META_RE);
      if (!m) break;
      const key = m[1]!;
      const val = m[2]!.trim();
      if (key === "id") id = val;
      else if (key === "due") due = val || undefined;
      else if (key === "status") status = isStatus(val) ? val : DEFAULT_STATUS;
      else if (key === "tags") tags = parseTags(val);
      else if (key === "created") createdAt = val || undefined;
      else if (key === "updated") updatedAt = val || undefined;
      else if (!KNOWN_KEYS.has(key)) extra[key] = val;
      i++;
    }

    // Skip a single blank separator line.
    if (i < lines.length && lines[i]!.trim() === "") i++;

    // Body: everything until the next heading.
    const bodyLines: string[] = [];
    while (i < lines.length && !HEADING_RE.test(lines[i]!)) {
      bodyLines.push(lines[i]!);
      i++;
    }
    const description = bodyLines.join("\n").replace(/\s+$/, "");

    tasks.push({
      id,
      name,
      due,
      status,
      tags,
      description,
      createdAt,
      updatedAt,
      category,
      filePath,
      extra,
    });
  }

  return tasks;
}

/** Serialize tasks back into TODO.md text. Inverse of {@link parseTodoFile}. */
export function serializeTasks(tasks: Task[]): string {
  const blocks = tasks.map((t) => {
    const lines: string[] = [`## ${t.name}`];
    if (t.id) lines.push(`id: ${t.id}`);
    if (t.due) lines.push(`due: ${t.due}`);
    lines.push(`status: ${t.status}`);
    if (t.tags.length) lines.push(`tags: ${serializeTags(t.tags)}`);
    if (t.createdAt) lines.push(`created: ${t.createdAt}`);
    if (t.updatedAt) lines.push(`updated: ${t.updatedAt}`);
    for (const [k, v] of Object.entries(t.extra)) lines.push(`${k}: ${v}`);
    const body = t.description.replace(/\s+$/, "");
    if (body) {
      lines.push("");
      lines.push(body);
    }
    return lines.join("\n");
  });
  return blocks.join("\n\n") + "\n";
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
