import { describe, expect, it } from "vitest";

import { isDiffSessionState, shouldPersistDiffSession } from "./diffSession";

describe("diff session schema", () => {
  it("accepts valid diff session state", () => {
    expect(
      isDiffSessionState({
        leftContent: "a",
        rightContent: "b",
        leftLang: "json",
        rightLang: "yaml",
        changesOnly: true,
        leftFile: { name: "left.json", size: 10, type: "application/json" },
        rightFile: null,
      })
    ).toBe(true);
  });

  it("rejects invalid diff session state", () => {
    expect(
      isDiffSessionState({
        leftContent: "a",
        rightContent: "b",
        leftLang: "toml",
        rightLang: "yaml",
        changesOnly: true,
        leftFile: null,
        rightFile: null,
      })
    ).toBe(false);
  });

  it("caps persistence for overly large diff inputs", () => {
    expect(
      shouldPersistDiffSession({
        leftContent: "a".repeat(50_000),
        rightContent: "b".repeat(50_000),
      })
    ).toBe(true);
    expect(
      shouldPersistDiffSession({
        leftContent: "a".repeat(50_001),
        rightContent: "b".repeat(50_000),
      })
    ).toBe(false);
  });
});
