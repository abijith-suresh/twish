import { describe, expect, it } from "vitest";

import {
  DEFAULT_THEME,
  getThemeBootstrapScript,
  isThemeName,
  resolveTheme,
  THEME_STORAGE_KEY,
} from "./theme";

describe("theme utilities", () => {
  it("recognizes valid theme names", () => {
    expect(isThemeName("dracula")).toBe(true);
    expect(isThemeName("catppuccin")).toBe(true);
    expect(isThemeName("invalid-theme")).toBe(false);
    expect(isThemeName(null)).toBe(false);
  });

  it("falls back to the default theme for invalid values", () => {
    expect(resolveTheme("nord")).toBe("nord");
    expect(resolveTheme("not-a-theme")).toBe(DEFAULT_THEME);
    expect(resolveTheme(null)).toBe(DEFAULT_THEME);
  });

  it("generates a bootstrap script with the shared storage key and default theme", () => {
    const script = getThemeBootstrapScript();

    expect(script).toContain(THEME_STORAGE_KEY);
    expect(script).toContain(DEFAULT_THEME);
    expect(script).toContain("document.documentElement.setAttribute");
  });
});
