import type { ReactNode } from "react";
import { TextAttributes } from "@opentui/core";
import { useTheme } from "./theme.tsx";

/** Full-screen centered overlay. Renders above siblings via absolute + zIndex. */
export function Modal({ title, children }: { title?: string; children: ReactNode }) {
  const theme = useTheme();
  return (
    <box
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <box
        style={{
          flexDirection: "column",
          padding: 2,
          gap: 1,
          minWidth: 40,
          borderStyle: "rounded",
          borderColor: theme.accent,
          backgroundColor: theme.bg,
        }}
        title={title ? ` ${title} ` : undefined}
      >
        {children}
      </box>
    </box>
  );
}

/** A focusable, clickable button: accent border/text when focused. */
export function Button({
  label,
  focused,
  danger,
  onClick,
}: {
  label: string;
  focused: boolean;
  danger?: boolean;
  onClick?: () => void;
}) {
  const theme = useTheme();
  const accent = danger ? theme.status.doing : theme.accent;
  return (
    <box
      onMouseDown={onClick}
      style={{
        paddingLeft: 2,
        paddingRight: 2,
        borderStyle: "rounded",
        borderColor: focused ? accent : theme.border,
      }}
    >
      <text attributes={focused ? TextAttributes.BOLD : undefined} fg={focused ? accent : theme.muted}>
        {label}
      </text>
    </box>
  );
}
