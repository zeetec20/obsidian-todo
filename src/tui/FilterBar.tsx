import type { Filter } from "../core/types.ts";
import { useTheme } from "./theme.tsx";
import { ICON } from "./icons.ts";

/** Active filter chips below the status tabs. Renders nothing when none active. */
export function FilterBar({
  filter,
  search,
}: {
  filter: Filter;
  search?: string;
}) {
  const theme = useTheme();
  const chips: string[] = [];
  if (filter.category) chips.push(`${ICON.folder}  ${filter.category}`);
  if (filter.createdFrom || filter.createdTo) {
    chips.push(
      `${ICON.calendar}  ${filter.createdFrom ?? "*"}→${filter.createdTo ?? "*"}`,
    );
  }
  if (search) chips.push(`${ICON.search}  ${search}`);
  if (chips.length === 0) return null;

  return (
    <box style={{ flexDirection: "row", gap: 3 }}>
      {chips.map((c) => (
        <text key={c} fg={theme.accent}>
          {c}
        </text>
      ))}
      <text fg={theme.muted}>
        <span fg={theme.muted}>{ICON.clear}</span>
        <span fg={theme.accent}> x </span>
        <span fg={theme.muted}>clear</span>
      </text>
    </box>
  );
}
