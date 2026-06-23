import { useEffect, useState } from "react";
import { TextAttributes } from "@opentui/core";
import { useTheme } from "./theme.tsx";

// Block-letter "otodo" (ANSI Shadow). Rows padded to equal width at render time.
const ART = [
  " ██████╗ ████████╗ ██████╗ ██████╗  ██████╗ ",
  "██╔═══██╗╚══██╔══╝██╔═══██╗██╔══██╗██╔═══██╗",
  "██║   ██║   ██║   ██║   ██║██║  ██║██║   ██║",
  "╚██████╔╝   ██║   ╚██████╔╝██████╔╝╚██████╔╝",
  " ╚═════╝    ╚═╝    ╚═════╝ ╚═════╝  ╚═════╝ ",
];

const WIDTH = Math.max(...ART.map((r) => r.length));
const ROWS = ART.map((r) => r.padEnd(WIDTH, " "));
const WINDOW = 10; // width of the shimmer highlight band
const SPEED = 80; // ms per frame

/** Rich "otodo" wordmark with a left→right shimmer sweep. */
export function Wordmark() {
  const theme = useTheme();
  const [pos, setPos] = useState(0);

  useEffect(() => {
    const id = setInterval(
      () => setPos((p) => (p + 1) % (WIDTH + WINDOW)),
      SPEED,
    );
    return () => clearInterval(id);
  }, []);

  return (
    <box style={{ flexDirection: "column", alignItems: "center" }}>
      {ROWS.map((row, r) => (
        <box key={r} style={{ flexDirection: "row" }}>
          <text>
            {row.split("").map((ch, c) => {
              const d = pos - c; // distance behind the sweep head
              const lit = d >= 0 && d < WINDOW;
              return (
                <span
                  key={c}
                  fg={lit ? theme.accent : theme.muted}
                  attributes={lit && d < 3 ? TextAttributes.BOLD : undefined}
                >
                  {ch}
                </span>
              );
            })}
          </text>
        </box>
      ))}
      <text fg={theme.muted}>{"\nobsidian todo"}</text>
    </box>
  );
}
