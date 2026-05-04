import { THEME_STORAGE_KEY } from "./localPersistence";

/**
 * The product now ships a single dark theme. The multi-theme infrastructure
 * (data-attribute, bootstrap script, CSS custom properties) is preserved for
 * forward compatibility, but there is only one palette.
 */
export type ThemeName = "dark";

export const DEFAULT_THEME: ThemeName = "dark";

export const THEMES: { name: ThemeName; label: string }[] = [{ name: "dark", label: "Dark" }];

export const VALID_THEMES = THEMES.map((theme) => theme.name);

export function isThemeName(value: string | null | undefined): value is ThemeName {
  return typeof value === "string" && VALID_THEMES.includes(value as ThemeName);
}

export function resolveTheme(value: string | null | undefined): ThemeName {
  return isThemeName(value) ? value : DEFAULT_THEME;
}

export function getThemeBootstrapScript(): string {
  return `(function () {
  document.documentElement.setAttribute("data-theme", "dark");
})();`;
}

export function getTheme(): ThemeName {
  return DEFAULT_THEME;
}

export function applyTheme(_theme: ThemeName): void {
  document.documentElement.setAttribute("data-theme", "dark");
}

export function setTheme(_theme: ThemeName): void {
  applyTheme(DEFAULT_THEME);

  try {
    localStorage.setItem(THEME_STORAGE_KEY, DEFAULT_THEME);
  } catch {
    // Ignore storage access failures after updating the active theme.
  }
}

export function initTheme(): void {
  applyTheme(DEFAULT_THEME);
}
