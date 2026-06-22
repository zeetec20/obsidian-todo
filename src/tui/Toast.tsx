import { TextAttributes } from "@opentui/core";
import { useTheme } from "./theme.tsx";

export type ToastKind = "info" | "success" | "error";
export interface ToastData {
  msg: string;
  kind: ToastKind;
}

/** Transient notification, top-right, above all overlays. Null = hidden. */
export function Toast({ toast }: { toast: ToastData | null }) {
  const theme = useTheme();
  if (!toast) return null;
  const color =
    toast.kind === "success"
      ? theme.status.done
      : toast.kind === "error"
        ? theme.status.doing
        : theme.accent;
  const icon = toast.kind === "success" ? "✓" : toast.kind === "error" ? "✗" : "ℹ";
  return (
    <box
      style={{
        position: "absolute",
        top: 1,
        right: 2,
        zIndex: 200,
        borderStyle: "rounded",
        borderColor: color,
        backgroundColor: theme.bg,
        paddingLeft: 1,
        paddingRight: 1,
      }}
    >
      <text fg={color} attributes={TextAttributes.BOLD}>
        {icon + "  " + toast.msg}
      </text>
    </box>
  );
}
