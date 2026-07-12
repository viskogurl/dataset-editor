export const THEME_STORAGE_KEY = "dataset-studio-theme";
export type Theme = "light" | "dark";

export function getPreferredTheme(): Theme {
  return globalThis.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function resolveStoredTheme(value: string | null): Theme {
  return value === "dark" || value === "light" ? value : getPreferredTheme();
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function readTheme(): Theme {
  return resolveStoredTheme(localStorage.getItem(THEME_STORAGE_KEY));
}

export function saveTheme(theme: Theme) {
  applyTheme(theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}
