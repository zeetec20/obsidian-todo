import { dirname, resolve } from "path";
import { TextAttributes, type SyntaxStyle } from "@opentui/core";
import { extractImages } from "../core/parser.ts";
import type { Task } from "../core/types.ts";
import { useTheme } from "./theme.tsx";
import { createdCol, dayName, dueState } from "./format.ts";
import { EmptyState, DETAIL_ART } from "./EmptyState.tsx";

export function TaskDetail({
  task,
  syntaxStyle,
}: {
  task: Task | undefined;
  syntaxStyle: SyntaxStyle;
}) {
  const theme = useTheme();

  if (!task) {
    return (
      <box
        style={{
          flexGrow: 1,
          padding: 1,
          borderStyle: "rounded",
          borderColor: theme.border,
        }}
      >
        <EmptyState
          art={DETAIL_ART}
          title="Nothing selected"
          hint="pick a task on the left"
        />
      </box>
    );
  }

  const images = extractImages(task.description);
  const due = dueState(task);
  const dueColor =
    due === "overdue"
      ? theme.status.doing
      : due === "today"
        ? theme.accent
        : theme.fg;

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
      title={` ${task.id} `}
    >
      <text
        attributes={TextAttributes.BOLD}
        fg={theme.status[task.status]}
        style={{ flexShrink: 0 }}
      >
        {task.name}
      </text>

      <box style={{ flexDirection: "column", marginTop: 1, flexShrink: 0 }}>
        <box style={{ flexDirection: "row" }}>
          <text fg={theme.muted}>{"Status".padEnd(10)}</text>
          <text fg={theme.status[task.status]}>{"● " + task.status}</text>
        </box>
        <box style={{ flexDirection: "row" }}>
          <text fg={theme.muted}>{"Category".padEnd(10)}</text>
          <text fg={theme.fg}>{task.category}</text>
        </box>
        <box style={{ flexDirection: "row" }}>
          <text fg={theme.muted}>{"Due".padEnd(10)}</text>
          <text fg={dueColor}>
            {(task.due ? `${task.due} (${dayName(task.due)})` : "-") +
              (due === "overdue"
                ? "  overdue"
                : due === "today"
                  ? "  today"
                  : "")}
          </text>
        </box>
        <box style={{ flexDirection: "row" }}>
          <text fg={theme.muted}>{"Tags".padEnd(10)}</text>
          <text fg={theme.muted}>
            {task.tags.length ? task.tags.map((t) => "#" + t).join("  ") : "-"}
          </text>
        </box>
        <box style={{ flexDirection: "row" }}>
          <text fg={theme.muted}>{"Created".padEnd(10)}</text>
          <text fg={theme.fg}>{createdCol(task.createdAt)}</text>
        </box>
      </box>

      <box
        style={{
          flexGrow: 1,
          flexDirection: "column",
          marginTop: 1,
          paddingX: 1,
          borderStyle: "rounded",
          borderColor: theme.border,
        }}
        title=" Description "
      >
        <scrollbox
          scrollX={false}
          verticalScrollbarOptions={{ showArrows: false }}
          style={{ flexGrow: 1 }}
        >
          {task.description.trim() ? (
            <markdown content={task.description} syntaxStyle={syntaxStyle} />
          ) : (
            <text fg={theme.muted}>(no description — press e to edit)</text>
          )}
        </scrollbox>
      </box>

      {images.length ? (
        <box
          style={{
            flexDirection: "column",
            borderStyle: "rounded",
            borderColor: theme.border,
            paddingLeft: 1,
          }}
        >
          <text fg={theme.muted}>images (press i to open):</text>
          {images.map((img, n) => (
            <text key={n} fg={theme.muted}>
              {"  " + resolve(dirname(task.filePath), img.path)}
            </text>
          ))}
        </box>
      ) : null}
    </box>
  );
}
