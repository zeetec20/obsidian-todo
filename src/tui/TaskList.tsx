import { useEffect, useRef, useState } from "react";
import { TextAttributes, type ScrollBoxRenderable } from "@opentui/core";
import type { Task } from "../core/types.ts";
import { useTheme } from "./theme.tsx";
import { createdCol, dayName, dueState } from "./format.ts";
import { EmptyState, LIST_ART } from "./EmptyState.tsx";
import { ICON } from "./icons.ts";

export type ListRow =
  | { type: "category"; category: string; count: number; collapsed: boolean }
  | { type: "task"; task: Task; n: number };

function truncate(s: string, max: number): string {
  if (max <= 1 || s.length <= max) return s;
  return s.slice(0, Math.max(1, max - 1)) + "…";
}

export function TaskList({
  rows,
  selectedIndex,
  focused,
  maxTitle,
  maxMeta,
  onPick,
}: {
  rows: ListRow[];
  selectedIndex: number;
  focused: boolean;
  maxTitle: number;
  maxMeta: number;
  onPick: (index: number) => void;
}) {
  const theme = useTheme();
  const scrollRef = useRef<ScrollBoxRenderable>(null);
  const isTerminal = theme.name === "terminal";
  const [blinkOn, setBlinkOn] = useState(true);

  useEffect(() => {
    scrollRef.current?.scrollChildIntoView(`row-${selectedIndex}`);
  }, [selectedIndex, rows.length]);

  useEffect(() => {
    if (!focused) { setBlinkOn(true); return; }
    const id = setInterval(() => setBlinkOn((b) => !b), 530);
    return () => clearInterval(id);
  }, [focused]);

  return (
    <scrollbox
      ref={scrollRef}
      style={{ flexGrow: 1 }}
      scrollX={false}
      verticalScrollbarOptions={{ showArrows: false }}
    >
      {rows.length === 0 ? (
        <EmptyState art={LIST_ART} title="No tasks here" hint="press  n  to create one" />
      ) : (
        rows.map((row, i) => {
          const selected = i === selectedIndex;
          if (row.type === "category") {
            const themedSel = selected && !isTerminal;
            const caret = row.collapsed ? "▸" : "▾";
            return (
              <box
                key={`row-${i}-cat`}
                id={`row-${i}`}
                onMouseDown={() => onPick(i)}
                style={{
                  flexDirection: "row",
                  marginTop: 1,
                  height: 1,
                  flexShrink: 0,
                  backgroundColor: themedSel ? theme.selectedBg : undefined,
                }}
              >
                <text
                  attributes={TextAttributes.BOLD}
                  fg={selected ? (focused ? theme.accent : theme.fg) : theme.accent}
                >
                  {(selected ? "▌ " : "  ") + `${caret} ${ICON.folder} ${row.category} (${row.count})`}
                </text>
              </box>
            );
          }

          const t = row.task;
          const themedSel = selected && !isTerminal;
          const due = dueState(t);
          const dueColor =
            due === "overdue" ? theme.status.doing : due === "today" ? theme.accent : theme.muted;
          const dueText = t.due ? `${t.due} (${dayName(t.due)})` : "-";
          // Keep line 2 to a single line (uniform row height): truncate the trailing
          // created column so the whole meta line fits maxMeta.
          const statusStr = "● " + t.status;
          const sep = "  ·  ";
          let createdStr = createdCol(t.createdAt);
          const fixed = 6 + statusStr.length + sep.length + dueText.length + sep.length;
          const room = maxMeta - fixed;
          if (room < createdStr.length) {
            createdStr = room <= 1 ? "" : truncate(createdStr, room);
          }

          return (
            <box
              key={`row-${i}-task`}
              id={`row-${i}`}
              onMouseDown={() => onPick(i)}
              style={{
                flexDirection: "column",
                width: "100%",
                height: 2,
                flexShrink: 0,
                backgroundColor: themedSel ? theme.selectedBg : undefined,
              }}
            >
              <text
                attributes={selected ? TextAttributes.BOLD : undefined}
                fg={themedSel ? theme.selectedFg : theme.fg}
              >
                <span fg={selected ? (focused ? theme.accent : theme.muted) : theme.muted}>
                  {(selected ? (focused && !blinkOn ? "  " : "▌ ") : "  ") + `${row.n}. `}
                </span>
                <span fg={theme.muted}>{t.id + "  "}</span>
                <span fg={themedSel ? theme.selectedFg : theme.status[t.status]}>
                  {truncate(t.name, maxTitle)}
                </span>
              </text>
              <text fg={theme.muted}>
                {"      "}
                <span fg={themedSel ? theme.selectedFg : theme.status[t.status]}>
                  {statusStr}
                </span>
                {sep}
                <span fg={dueColor}>{dueText}</span>
                {createdStr ? sep + createdStr : ""}
              </text>
            </box>
          );
        })
      )}
    </scrollbox>
  );
}
