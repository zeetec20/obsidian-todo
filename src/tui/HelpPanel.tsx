import { TextAttributes } from "@opentui/core";
import { useTerminalDimensions } from "@opentui/react";
import { CLI_DOCS, KEYMAP_GROUPS } from "./keymap.ts";
import { useTheme } from "./theme.tsx";

export function HelpPanel() {
  const theme = useTheme();
  const { width } = useTerminalDimensions();
  const panelWidth = Math.min(70, Math.max(30, width - 6));

  return (
    <box
      style={{
        flexDirection: "column",
        padding: 2,
        width: panelWidth,
        maxHeight: "90%",
        borderStyle: "rounded",
        borderColor: theme.accent,
        backgroundColor: theme.bg,
      }}
      title=" Help "
    >
      {/* Single column; rows are flexShrink:0 so text never wraps — scrollX/scrollY reveal overflow. */}
      <scrollbox
        scrollX
        verticalScrollbarOptions={{ showArrows: false }}
        horizontalScrollbarOptions={{ showArrows: false }}
        style={{ flexGrow: 1 }}
      >
        {KEYMAP_GROUPS.map((group) => (
          <box key={group.title} style={{ flexDirection: "column", marginBottom: 1 }}>
            <box style={{ flexDirection: "row" }}>
              <text attributes={TextAttributes.BOLD} fg={theme.accent}>
                {group.title}
              </text>
            </box>
            {group.items.map((b) => (
              <box key={b.keys} style={{ flexDirection: "row", flexShrink: 0 }}>
                <text fg={theme.status.doing} style={{ flexShrink: 0 }}>
                  {("  " + b.keys).padEnd(16)}
                </text>
                <text fg={theme.fg} style={{ flexShrink: 0 }}>
                  {b.desc}
                </text>
              </box>
            ))}
          </box>
        ))}

        <box style={{ flexDirection: "row" }}>
          <text attributes={TextAttributes.BOLD} fg={theme.accent}>
            CLI
          </text>
        </box>
        {CLI_DOCS.map((d) => (
          <box key={d.cmd} style={{ flexDirection: "row", flexShrink: 0 }}>
            <text fg={theme.status.todo} style={{ flexShrink: 0 }}>
              {d.cmd.padEnd(22)}
            </text>
            <text fg={theme.muted} style={{ flexShrink: 0 }}>
              {d.desc}
            </text>
          </box>
        ))}
      </scrollbox>

      <box style={{ flexDirection: "row", marginTop: 1 }}>
        <text fg={theme.muted}>Press ? or Esc · ↑↓ scroll</text>
      </box>
    </box>
  );
}
