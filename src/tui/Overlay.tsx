import type { ReactNode } from "react";

/**
 * Full-screen centered overlay (absolute + zIndex). No background fill, so the
 * live TUI shows through around the centered dialog.
 */
export function Overlay({ children }: { children: ReactNode }) {
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
      {children}
    </box>
  );
}
