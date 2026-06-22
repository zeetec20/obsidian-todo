import { createContext, useContext } from "react";
import { resolveTheme, type Theme } from "../core/theme.ts";

const ThemeContext = createContext<Theme>(resolveTheme("obsidian", "dark", "dark"));

export const ThemeProvider = ThemeContext.Provider;

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
