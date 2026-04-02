// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_THEME, getTheme, initTheme, setTheme, THEME_STORAGE_KEY } from "./theme";

describe("theme browser runtime", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("reads the default theme when storage is empty", () => {
    expect(getTheme()).toBe(DEFAULT_THEME);
  });

  it("ignores invalid stored themes", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "broken-theme");

    expect(getTheme()).toBe(DEFAULT_THEME);
  });

  it("persists and applies the selected theme", () => {
    setTheme("nord");

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("nord");
    expect(document.documentElement.getAttribute("data-theme")).toBe("nord");
  });

  it("initializes the document theme from storage", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "gruvbox");

    initTheme();

    expect(document.documentElement.getAttribute("data-theme")).toBe("gruvbox");
  });
});
