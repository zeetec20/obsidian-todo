import { useEffect, useState } from "react";
import { useKeyboard } from "@opentui/react";
import { useTheme } from "./theme.tsx";
import { DateInput } from "./DateInput.tsx";
import { Button } from "./Modal.tsx";

/**
 * Due-date range filter modal: From / To segmented pickers + Apply / Clear.
 * Enter advances on date fields, acts on buttons; Tab moves; Esc cancels.
 */
export function DateRangeModal({
  from,
  to,
  onApply,
  onClear,
  onCancel,
  onError,
}: {
  from?: string;
  to?: string;
  onApply: (from?: string, to?: string) => void;
  onClear: () => void;
  onCancel: () => void;
  onError: (msg: string) => void;
}) {
  const theme = useTheme();
  const [f, setF] = useState(from ?? "");
  const [t, setT] = useState(to ?? "");
  const [focus, setFocus] = useState(0);
  const fields = ["from", "to", "apply", "clear"];
  const cur = fields[Math.min(focus, fields.length - 1)];
  const on = (k: string) => cur === k;
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  function validate(): string {
    if (f && f > today) return "From must be today or earlier";
    if (f && t && t < f) return "To must be on/after From";
    return "";
  }

  useEffect(() => {
    const err = validate();
    if (err) onError(err);
  }, [f, t]);

  function apply() {
    const err = validate();
    if (err) return onError(err);
    onApply(f || undefined, t || undefined);
  }

  useKeyboard((key) => {
    if (key.name === "escape") return onCancel();
    if (key.name === "tab") {
      setFocus((i) => {
        const len = fields.length;
        return key.shift ? (i - 1 + len) % len : (i + 1) % len;
      });
      return;
    }
    if (key.name === "return" || key.name === "enter") {
      if (cur === "apply") apply();
      else if (cur === "clear") onClear();
      else setFocus((i) => (i + 1) % fields.length);
    }
  });

  const label = (k: string, text: string) => (
    <text fg={on(k) ? theme.accent : theme.muted}>{text}</text>
  );
  const field = (k: string, value: string, set: (v: string) => void) => (
    <box
      style={{
        borderStyle: "rounded",
        borderColor: on(k) ? theme.accent : theme.border,
        paddingLeft: 1,
        paddingRight: 1,
      }}
    >
      <DateInput value={value} focused={on(k)} onChange={set} />
    </box>
  );

  return (
    <box
      style={{
        flexDirection: "column",
        padding: 2,
        minWidth: 44,
        borderStyle: "rounded",
        borderColor: theme.accent,
        backgroundColor: theme.bg,
      }}
      title=" Filter: created date range "
    >
      {label("from", "From")}
      {field("from", f, setF)}
      {label("to", "To")}
      {field("to", t, setT)}
      <box style={{ flexDirection: "row", gap: 2, marginTop: 1, justifyContent: "center" }}>
        <Button label="Apply" focused={on("apply")} onClick={apply} />
        <Button label="Clear" focused={on("clear")} onClick={onClear} />
      </box>
      <box style={{ alignItems: "center" }}>
        <text fg={theme.muted}>Tab/Enter next · Apply/Clear · Esc cancel</text>
      </box>
    </box>
  );
}
