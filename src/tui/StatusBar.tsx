import { TextAttributes } from "@opentui/core";
import { STATUSES, type Status, type Task } from "../core/types.ts";
import { statusCounts } from "./format.ts";
import { useTheme } from "./theme.tsx";

/** Tabs index: 0 = All, 1..n = STATUSES[i-1]. */
export const STATUS_TABS = STATUSES.length + 1;

export function tabStatus(tab: number): Status | undefined {
  return tab === 0 ? undefined : STATUSES[tab - 1];
}

export function StatusBar({
  tasks,
  tab,
  focused,
  onSelect,
}: {
  tasks: Task[];
  tab: number;
  focused: boolean;
  onSelect?: (tab: number) => void;
}) {
  const theme = useTheme();
  const counts = statusCounts(tasks);
  const total = tasks.length;
  const tabs: { label: string; count: number; color: string }[] = [
    { label: "All", count: tasks.length, color: theme.accent },
    ...STATUSES.map((s) => ({ label: s, count: counts[s], color: theme.status[s] })),
  ];

  return (
    <box style={{ flexDirection: "row", paddingLeft: 1, paddingRight: 1 }}>
      {tabs.map((t, i) => {
        const active = i === tab;
        // Progress bar for each status (not All): count vs total.
        const showBar = i !== 0;
        const ratio = total ? t.count / total : 0;
        const filled = Math.round(ratio * 4);
        const bar = showBar ? " " + "▰".repeat(filled) + "▱".repeat(4 - filled) : "";
        return (
          <box key={t.label} onMouseDown={() => onSelect?.(i)} style={{ flexDirection: "row" }}>
            <text
              attributes={active ? TextAttributes.BOLD : undefined}
              fg={active ? t.color : theme.muted}
            >
              {(active ? (focused ? "▌" : "·") : " ") + `${t.label} ${t.count}`}
            </text>
            {showBar ? (
              <text fg={active ? t.color : theme.muted}>{bar + "   "}</text>
            ) : (
              <text fg={theme.muted}>{"   "}</text>
            )}
          </box>
        );
      })}
    </box>
  );
}
