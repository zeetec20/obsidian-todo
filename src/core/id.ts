import type { Task } from "./types.ts";

/**
 * Build the id acronym for a category.
 * - multi-word → uppercase initials ("Side Project" → "SP")
 * - single word → first letter + de-voweled, first 3 chars ("Work" → "WRK");
 *   falls back to first 3 chars if de-voweling leaves fewer than 3.
 */
export function acronym(category: string): string {
  const words = category.trim().split(/[\s_\-]+/).filter(Boolean);
  if (words.length === 0) return "GEN";
  if (words.length === 1) {
    const upper = words[0]!.toUpperCase();
    const deVoweled = upper[0]! + upper.slice(1).replace(/[AEIOU]/g, "");
    return (deVoweled.length >= 3 ? deVoweled : upper).slice(0, 3);
  }
  return words.map((w) => w[0]!).join("").toUpperCase();
}

/**
 * Next free id for a category: `#{ACRONYM}-{n}` where n is one past the
 * highest existing counter for that acronym across all known tasks.
 */
export function nextId(category: string, existing: Task[]): string {
  const acr = acronym(category);
  const re = new RegExp(`^#${acr}-(\\d+)$`);
  let max = 0;
  for (const t of existing) {
    const m = t.id.match(re);
    if (m) max = Math.max(max, parseInt(m[1]!, 10));
  }
  return `#${acr}-${max + 1}`;
}
