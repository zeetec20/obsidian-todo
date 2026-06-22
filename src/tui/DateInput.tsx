import { useEffect, useState } from "react";
import { TextAttributes } from "@opentui/core";
import { useKeyboard } from "@opentui/react";
import { useTheme } from "./theme.tsx";

type Seg = 0 | 1 | 2; // year, month, day

function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

function clampDay(y: number, m: number, d: number): number {
  return Math.min(Math.max(1, d), daysInMonth(y, m));
}

function iso(y: number, m: number, d: number): string {
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseISO(v: string): { y: number; m: number; d: number } | null {
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return { y: +m[1]!, m: +m[2]!, d: +m[3]! };
}

/**
 * Segmented date editor. Empty by default (shows today as a dim hint). `→` /
 * digit / arrow on empty accepts today and starts editing. Arrows move/adjust
 * segments, digits type without manual separators, Backspace clears a segment,
 * Delete clears the whole date. Emits `YYYY-MM-DD` or `""`.
 */
export function DateInput({
  value,
  focused,
  onChange,
}: {
  value: string;
  focused: boolean;
  onChange: (iso: string) => void;
}) {
  const theme = useTheme();
  const today = new Date();
  const init = parseISO(value);
  const [empty, setEmpty] = useState(!init);
  const [y, setY] = useState(init?.y ?? today.getFullYear());
  const [m, setM] = useState(init?.m ?? today.getMonth() + 1);
  const [d, setD] = useState(init?.d ?? today.getDate());
  const [seg, setSeg] = useState<Seg>(0);
  const [buf, setBuf] = useState("");

  useEffect(() => {
    onChange(empty ? "" : iso(y, m, d));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [empty, y, m, d]);

  function fillToday() {
    setY(today.getFullYear());
    setM(today.getMonth() + 1);
    setD(today.getDate());
    setEmpty(false);
  }

  function bump(dir: 1 | -1) {
    setBuf("");
    if (seg === 0) {
      const ny = Math.max(1, y + dir);
      setY(ny);
      setD((cur) => clampDay(ny, m, cur));
    } else if (seg === 1) {
      const nm = ((m - 1 + dir + 12) % 12) + 1;
      setM(nm);
      setD((cur) => clampDay(y, nm, cur));
    } else {
      const dim = daysInMonth(y, m);
      setD(((d - 1 + dir + dim) % dim) + 1);
    }
  }

  function typeDigit(ch: string) {
    const max = seg === 0 ? 4 : 2;
    const next = (buf + ch).slice(-max);
    const n = parseInt(next, 10);
    if (seg === 0) {
      setY(Math.max(1, n));
      setD((cur) => clampDay(Math.max(1, n), m, cur));
    } else if (seg === 1) {
      const nm = Math.min(Math.max(1, n), 12);
      setM(nm);
      setD((cur) => clampDay(y, nm, cur));
    } else {
      setD(clampDay(y, m, Math.max(1, n)));
    }
    if (next.length >= max) {
      setBuf("");
      setSeg((s) => (Math.min(2, s + 1) as Seg));
    } else {
      setBuf(next);
    }
  }

  useKeyboard((key) => {
    if (!focused) return;
    if (key.name === "tab" || key.name === "return" || key.name === "enter" || key.name === "escape")
      return; // form handles these

    const ch = key.name || key.sequence;
    const digit = /^[0-9]$/.test(ch) ? ch : null;

    if (empty) {
      if (key.name === "right" || key.name === "up" || key.name === "down" || digit) {
        fillToday();
        setSeg(0);
        if (digit) typeDigit(digit);
      }
      return;
    }

    if (key.name === "delete" || key.name === "backspace") {
      // Clear the whole date (both Del and Backspace) back to the empty placeholder.
      setEmpty(true);
      setBuf("");
      setSeg(0);
    } else if (key.name === "left") {
      setBuf("");
      setSeg((s) => (Math.max(0, s - 1) as Seg));
    } else if (key.name === "right") {
      setBuf("");
      setSeg((s) => (Math.min(2, s + 1) as Seg));
    } else if (key.name === "up") bump(1);
    else if (key.name === "down") bump(-1);
    else if (digit) typeDigit(digit);
  });

  const segStyle = (n: Seg) =>
    focused && seg === n
      ? { fg: theme.accent, attributes: TextAttributes.BOLD | TextAttributes.UNDERLINE }
      : { fg: theme.fg };

  if (empty) {
    return (
      <text>
        <span fg={theme.muted}>YYYY-MM-DD</span>
        <span fg={theme.muted}>{focused ? "   (→ to accept today)" : "   (empty)"}</span>
      </text>
    );
  }

  return (
    <text>
      <span {...segStyle(0)}>{String(y).padStart(4, "0")}</span>
      <span fg={theme.muted}>-</span>
      <span {...segStyle(1)}>{String(m).padStart(2, "0")}</span>
      <span fg={theme.muted}>-</span>
      <span {...segStyle(2)}>{String(d).padStart(2, "0")}</span>
      {focused ? <span fg={theme.muted}>{"   ←→ move · ↑↓ adjust · Del clear"}</span> : null}
    </text>
  );
}
