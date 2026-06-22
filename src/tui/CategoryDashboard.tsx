import { TextAttributes } from "@opentui/core";
import { STATUSES, type Task } from "../core/types.ts";
import { useTheme } from "./theme.tsx";
import { ICON } from "./icons.ts";

function bar(ratio: number, width = 12): string {
  const filled = Math.round(ratio * width);
  return "▰".repeat(filled) + "▱".repeat(Math.max(0, width - filled));
}

function maxDate(tasks: Task[], pick: (t: Task) => string | undefined): string {
  let best = "";
  for (const t of tasks) {
    const v = pick(t);
    if (v && v > best) best = v;
  }
  return best ? best.slice(0, 10) : "-";
}

/** Mini dashboard for a category: per-status breakdown + last created/updated. */
export function CategoryDashboard({ category, tasks }: { category: string; tasks: Task[] }) {
  const theme = useTheme();
  const total = tasks.length;
  const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<string, number>;
  for (const t of tasks) counts[t.status] = (counts[t.status] ?? 0) + 1;

  return (
    <box
      style={{
        flexGrow: 1,
        flexDirection: "column",
        padding: 1,
        borderStyle: "rounded",
        borderColor: theme.border,
        backgroundColor: theme.bg,
      }}
      title=" category "
    >
      <text attributes={TextAttributes.BOLD} fg={theme.accent}>
        {ICON.folder + " " + category}
      </text>
      <box style={{ flexDirection: "row", marginTop: 1 }}>
        <text fg={theme.muted}>{`${total} task${total === 1 ? "" : "s"} total`}</text>
      </box>

      <box style={{ flexDirection: "column", marginTop: 1 }}>
        {STATUSES.map((s) => {
          const n = counts[s] ?? 0;
          const ratio = total ? n / total : 0;
          const pct = Math.round(ratio * 100);
          return (
            <box key={s} style={{ flexDirection: "row" }}>
              <text fg={theme.status[s]}>{("● " + s).padEnd(10)}</text>
              <text fg={theme.muted}>{String(n).padStart(2) + "  "}</text>
              <text fg={theme.status[s]}>{bar(ratio)}</text>
              <text fg={theme.muted}>{"  " + String(pct).padStart(3) + "%"}</text>
            </box>
          );
        })}
      </box>

      <box style={{ flexDirection: "column", marginTop: 1 }}>
        <box style={{ flexDirection: "row" }}>
          <text fg={theme.muted}>{"Last created".padEnd(14)}</text>
          <text fg={theme.fg}>{maxDate(tasks, (t) => t.createdAt)}</text>
        </box>
        <box style={{ flexDirection: "row" }}>
          <text fg={theme.muted}>{"Last updated".padEnd(14)}</text>
          <text fg={theme.fg}>{maxDate(tasks, (t) => t.updatedAt ?? t.createdAt)}</text>
        </box>
      </box>

      <box style={{ flexDirection: "row", marginTop: 1 }}>
        <text fg={theme.muted}>press </text>
        <text fg={theme.accent}>d</text>
        <text fg={theme.muted}> to delete this category (empty only)</text>
      </box>
    </box>
  );
}
