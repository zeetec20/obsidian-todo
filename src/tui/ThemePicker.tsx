import { useState } from "react";
import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { THEME_NAMES, type Mode } from "../core/theme.ts";
import { useTheme } from "./theme.tsx";

const MODES: Mode[] = ["auto", "light", "dark"];

/**
 * Modal theme picker. `↑/↓` pick theme + live-preview, `←/→` cycle mode
 * (auto/light/dark), `Enter` saves, `Esc` reverts. Wrap in <Overlay>.
 */
export function ThemePicker({
  current,
  currentMode,
  onPreview,
  onSave,
  onCancel,
}: {
  current: string;
  currentMode: Mode;
  onPreview: (name: string, mode: Mode) => void;
  onSave: (name: string, mode: Mode) => void;
  onCancel: () => void;
}) {
  const theme = useTheme();
  const start = Math.max(0, THEME_NAMES.indexOf(current as (typeof THEME_NAMES)[number]));
  const [idx, setIdx] = useState(start);
  const [mode, setMode] = useState<Mode>(currentMode);

  function move(nextIdx: number, nextMode: Mode) {
    setIdx(nextIdx);
    setMode(nextMode);
    onPreview(THEME_NAMES[nextIdx]!, nextMode);
  }

  useKeyboard((key) => {
    if (key.name === "up" || key.name === "k") move((idx - 1 + THEME_NAMES.length) % THEME_NAMES.length, mode);
    else if (key.name === "down" || key.name === "j") move((idx + 1) % THEME_NAMES.length, mode);
    else if (key.name === "left" || key.name === "right" || key.name === "m") {
      const dir = key.name === "left" ? -1 : 1;
      move(idx, MODES[(MODES.indexOf(mode) + dir + MODES.length) % MODES.length]!);
    } else if (key.name === "return" || key.name === "enter") onSave(THEME_NAMES[idx]!, mode);
    else if (key.name === "escape") onCancel();
  });

  return (
    <box
      style={{
        flexDirection: "column",
        padding: 2,
        minWidth: 32,
        borderStyle: "rounded",
        borderColor: theme.accent,
        backgroundColor: theme.bg,
      }}
      title=" Theme "
    >
      {THEME_NAMES.map((name, i) => (
        <box key={name} onMouseDown={() => move(i, mode)} style={{ flexDirection: "row" }}>
          <text
            fg={i === idx ? theme.accent : theme.muted}
            attributes={i === idx ? TextAttributes.BOLD : undefined}
          >
            {(i === idx ? "▌ " : "  ") + name}
          </text>
        </box>
      ))}
      <box style={{ flexDirection: "row", marginTop: 1 }}>
        <text fg={theme.muted}>Mode  </text>
        {MODES.map((m) => (
          <box key={m} onMouseDown={() => move(idx, m)} style={{ flexDirection: "row" }}>
            <text
              fg={m === mode ? theme.accent : theme.muted}
              attributes={m === mode ? TextAttributes.BOLD : undefined}
            >
              {(m === mode ? "[" + m + "] " : " " + m + "  ")}
            </text>
          </box>
        ))}
      </box>
      <text fg={theme.muted}>{"\n↑↓ theme · ←→ mode · Enter save · Esc"}</text>
    </box>
  );
}
