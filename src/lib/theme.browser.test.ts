// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { THEME_STORAGE_KEY } from "./localPersistence";
import { DEFAULT_THEME, getTheme, initTheme, setTheme } from "./theme";

describe("theme browser runtime", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  it("always returns the single dark theme", () => {
    expect(getTheme()).toBe(DEFAULT_THEME);
    expect(DEFAULT_THEME).toBe("dark");
  });

  it("ignores stale stored theme values and returns dark", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "catppuccin");

    expect(getTheme()).toBe(DEFAULT_THEME);
  });

  it("persists and applies the dark theme", () => {
    setTheme("dark");

    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("falls back to the default theme when storage access throws", () => {
    const getItemSpy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(getTheme()).toBe(DEFAULT_THEME);

    getItemSpy.mockRestore();
  });

  it("applies the dark theme even when persistence fails", () => {
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(() => setTheme("dark")).not.toThrow();
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    setItemSpy.mockRestore();
  });

  it("initializes the document with the dark theme", () => {
    initTheme();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
