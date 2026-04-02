export type ThemeName = "dracula" | "catppuccin" | "nord" | "gruvbox";

export const THEME_STORAGE_KEY = "unwrapped-theme";
export const DEFAULT_THEME: ThemeName = "catppuccin";

export const THEMES: { name: ThemeName; label: string }[] = [
  { name: "dracula", label: "Dracula" },
  { name: "catppuccin", label: "Catppuccin" },
  { name: "nord", label: "Nord" },
  { name: "gruvbox", label: "Gruvbox" },
];

export const VALID_THEMES = THEMES.map((theme) => theme.name);

export function isThemeName(value: string | null | undefined): value is ThemeName {
  return typeof value === "string" && VALID_THEMES.includes(value as ThemeName);
}

export function resolveTheme(value: string | null | undefined): ThemeName {
  return isThemeName(value) ? value : DEFAULT_THEME;
}

export function getThemeBootstrapScript(): string {
  const validThemes = JSON.stringify(VALID_THEMES);

  return `(function () {
  const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};
  const defaultTheme = ${JSON.stringify(DEFAULT_THEME)};
  const validThemes = ${validThemes};
  const stored = localStorage.getItem(storageKey);
  const theme = validThemes.includes(stored) ? stored : defaultTheme;
  document.documentElement.setAttribute("data-theme", theme);
})();`;
}

export function getTheme(): ThemeName {
  if (typeof localStorage === "undefined") return DEFAULT_THEME;
  return resolveTheme(localStorage.getItem(THEME_STORAGE_KEY));
}

export function setTheme(theme: ThemeName): void {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_STORAGE_KEY, theme);
}

export function initTheme(): void {
  setTheme(getTheme());
}
