import { useState } from "react";
import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useTheme } from "./theme.tsx";

export interface SelectOption {
  label: string;
  value: string;
  hint?: string;
}

/**
 * Generic options-only modal. `↑↓`/`j k` move, `Enter` selects (applies
 * immediately — no buttons), `Esc` cancels. Wrap in <Overlay>.
 */
export function SelectModal({
  title,
  options,
  current,
  onSelect,
  onCancel,
}: {
  title: string;
  options: SelectOption[];
  current?: string;
  onSelect: (value: string) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const start = Math.max(0, options.findIndex((o) => o.value === current));
  const [idx, setIdx] = useState(start);

  useKeyboard((key) => {
    if (key.name === "up" || key.name === "k") setIdx((i) => (i - 1 + options.length) % options.length);
    else if (key.name === "down" || key.name === "j") setIdx((i) => (i + 1) % options.length);
    else if (key.name === "return" || key.name === "enter") {
      const o = options[idx];
      if (o) onSelect(o.value);
    } else if (key.name === "escape") onCancel();
  });

  return (
    <box
      style={{
        flexDirection: "column",
        padding: 2,
        minWidth: 36,
        borderStyle: "rounded",
        borderColor: theme.accent,
        backgroundColor: theme.bg,
      }}
      title={` ${title} `}
    >
      {options.map((o, i) => {
        const on = i === idx;
        return (
          <box
            key={o.value}
            onMouseDown={() => onSelect(o.value)}
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <text
              fg={on ? theme.accent : theme.fg}
              attributes={on ? TextAttributes.BOLD : undefined}
            >
              {(on ? "▌ " : "  ") + o.label}
            </text>
            {o.hint ? <text fg={theme.muted}>{"  " + o.hint}</text> : null}
          </box>
        );
      })}
      <text fg={theme.muted}>{"\n↑↓ move · Enter select · Esc cancel"}</text>
    </box>
  );
}
