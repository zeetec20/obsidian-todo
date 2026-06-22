import { useKeyboard } from "@opentui/react";
import { useTheme } from "./theme.tsx";

export interface DropdownOption {
  label: string;
  value: string;
}

/**
 * Collapsed pill when unfocused (`value ▼`); expands a highlighted option list
 * when focused. `↑/↓` live-select via onChange. Enter/Tab are left to the parent
 * form (to advance focus).
 */
export function Dropdown({
  options,
  value,
  focused,
  onChange,
}: {
  options: DropdownOption[];
  value: string;
  focused: boolean;
  onChange: (value: string) => void;
}) {
  const theme = useTheme();
  const idx = Math.max(0, options.findIndex((o) => o.value === value));
  const current = options[idx];

  useKeyboard((key) => {
    if (!focused) return;
    if (key.name === "up") onChange(options[(idx - 1 + options.length) % options.length]!.value);
    else if (key.name === "down") onChange(options[(idx + 1) % options.length]!.value);
  });

  if (!focused) {
    return (
      <box style={{ borderStyle: "rounded", borderColor: theme.border, paddingLeft: 1, paddingRight: 1 }}>
        <text fg={theme.fg}>{(current?.label ?? value ?? "—") + "  ▼"}</text>
      </box>
    );
  }

  return (
    <box
      style={{
        flexDirection: "column",
        borderStyle: "rounded",
        borderColor: theme.accent,
        paddingLeft: 1,
        paddingRight: 1,
      }}
    >
      {options.map((o, i) => {
        const sel = i === idx;
        return (
          <box key={o.value} onMouseDown={() => onChange(o.value)} style={{ flexDirection: "row" }}>
            <text fg={sel ? theme.accent : theme.muted}>
              {(sel ? "▌ " : "  ") + o.label}
            </text>
          </box>
        );
      })}
      <text fg={theme.muted}>↑↓ choose</text>
    </box>
  );
}
