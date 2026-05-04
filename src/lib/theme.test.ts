import { describe, expect, it } from "vitest";

import { DEFAULT_THEME, getThemeBootstrapScript, isThemeName, resolveTheme } from "./theme";

describe("theme utilities", () => {
  it("recognizes the single dark theme as valid", () => {
    expect(isThemeName("dark")).toBe(true);
    expect(isThemeName("catppuccin")).toBe(false);
    expect(isThemeName("invalid-theme")).toBe(false);
    expect(isThemeName(null)).toBe(false);
  });

  it("always resolves to the dark theme", () => {
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("not-a-theme")).toBe(DEFAULT_THEME);
    expect(resolveTheme(null)).toBe(DEFAULT_THEME);
  });

  it("generates a bootstrap script that sets data-theme to dark", () => {
    const script = getThemeBootstrapScript();

    expect(script).toContain("data-theme");
    expect(script).toContain("dark");
    expect(script).toContain("document.documentElement.setAttribute");
  });
});
