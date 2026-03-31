export type ThemeName = "dracula" | "catppuccin" | "nord" | "gruvbox";

const STORAGE_KEY = "unwrapped-theme";
const DEFAULT_THEME: ThemeName = "dracula";

export const THEMES: { name: ThemeName; label: string }[] = [
  { name: "dracula", label: "Dracula" },
  { name: "catppuccin", label: "Catppuccin" },
  { name: "nord", label: "Nord" },
  { name: "gruvbox", label: "Gruvbox" },
];

export function getTheme(): ThemeName {
  if (typeof localStorage === "undefined") return DEFAULT_THEME;
  return (localStorage.getItem(STORAGE_KEY) as ThemeName) ?? DEFAULT_THEME;
}

export function setTheme(theme: ThemeName): void {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
}

export function initTheme(): void {
  setTheme(getTheme());
}
