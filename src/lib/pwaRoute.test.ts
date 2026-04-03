import { describe, expect, it } from "vitest";

import {
  getPwaRouteBootstrapScript,
  getRestorableToolRoute,
  getStandaloneRouteRecovery,
  LAST_TOOL_ROUTE_STORAGE_KEY,
  shouldPersistToolRoute,
} from "./pwaRoute";

describe("pwaRoute", () => {
  it("accepts only registered tool routes for restore", () => {
    expect(getRestorableToolRoute("/tools/diff")).toBe("/tools/diff");
    expect(getRestorableToolRoute("/")).toBeNull();
    expect(getRestorableToolRoute("/tools/not-real")).toBeNull();
  });

  it("recovers the last tool route only for standalone launches from home", () => {
    expect(getStandaloneRouteRecovery("/", "/tools/regex-tester", true)).toBe(
      "/tools/regex-tester"
    );
    expect(getStandaloneRouteRecovery("/", "/tools/not-real", true)).toBeNull();
    expect(getStandaloneRouteRecovery("/tools/diff", "/tools/regex-tester", true)).toBeNull();
    expect(getStandaloneRouteRecovery("/", "/tools/regex-tester", false)).toBeNull();
  });

  it("persists only registered tool routes", () => {
    expect(shouldPersistToolRoute("/tools/json-formatter")).toBe(true);
    expect(shouldPersistToolRoute("/")).toBe(false);
    expect(shouldPersistToolRoute("/tools/not-real")).toBe(false);
  });

  it("embeds the route recovery bootstrap inputs", () => {
    const script = getPwaRouteBootstrapScript();

    expect(script).toContain(LAST_TOOL_ROUTE_STORAGE_KEY);
    expect(script).toContain("/tools/diff");
    expect(script).toContain("window.location.replace(storedPathname)");
    expect(script).toContain('document.addEventListener("astro:page-load", persistRoute)');
  });
});
