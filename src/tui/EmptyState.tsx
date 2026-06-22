import { TextAttributes } from "@opentui/core";
import { useTheme } from "./theme.tsx";

/** Centered ASCII illustration + title + hint, for empty panes. */
export function EmptyState({
  art,
  title,
  hint,
}: {
  art: string[];
  title: string;
  hint?: string;
}) {
  const theme = useTheme();
  return (
    <box
      style={{
        flexGrow: 1,
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {art.map((line, i) => (
        <box key={i} style={{ flexDirection: "row" }}>
          <text fg={theme.muted}>{line}</text>
        </box>
      ))}
      <box style={{ flexDirection: "row", marginTop: 1 }}>
        <text fg={theme.accent} attributes={TextAttributes.BOLD}>
          {title}
        </text>
      </box>
      {hint ? (
        <box style={{ flexDirection: "row" }}>
          <text fg={theme.muted}>{hint}</text>
        </box>
      ) : null}
    </box>
  );
}

/** Clipboard / checklist illustration for an empty task list. */
export const LIST_ART = [
  "╭───────────────╮",
  "│  •  ───────   │",
  "│  •  ─────     │",
  "│  •  ───────   │",
  "╰───────────────╯",
];

/** Document illustration for the detail pane with nothing selected. */
export const DETAIL_ART = [
  "╭─────────────╮",
  "│  ─────────  │",
  "│  ───────    │",
  "│  ─────────  │",
  "│  ──────     │",
  "╰─────────────╯",
];
