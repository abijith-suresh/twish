import { describe, expect, it } from "vitest";

import { getToolErrorMessage } from "./ToolErrorFallback";

describe("tool error fallback helpers", () => {
  it("hides error details in production mode", () => {
    expect(getToolErrorMessage(new Error("boom"), true)).toBeNull();
  });

  it("returns readable error details in development mode", () => {
    expect(getToolErrorMessage(new Error("boom"), false)).toBe("boom");
    expect(getToolErrorMessage("bad", false)).toBe("Unknown tool error");
  });
});
