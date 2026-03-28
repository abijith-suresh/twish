import { describe, expect, it } from "vitest";

import { normalizeJsonForDiff, prepareStructuredCompare } from "./structuredCompare";

describe("structured compare utilities", () => {
  it("normalizes JSON with stable key ordering", () => {
    const result = normalizeJsonForDiff('{"z":1,"a":2,"nested":{"b":1,"a":2}}');

    expect(result).toEqual({
      ok: true,
      output: '{\n  "a": 2,\n  "nested": {\n    "a": 2,\n    "b": 1\n  },\n  "z": 1\n}',
    });
  });

  it("preserves array order while normalizing nested values", () => {
    const result = normalizeJsonForDiff('{"items":[{"b":1,"a":2},{"d":4,"c":3}]}');

    expect(result).toEqual({
      ok: true,
      output:
        '{\n  "items": [\n    {\n      "a": 2,\n      "b": 1\n    },\n    {\n      "c": 3,\n      "d": 4\n    }\n  ]\n}',
    });
  });

  it("treats empty JSON inputs as valid empty content", () => {
    expect(normalizeJsonForDiff("   ")).toEqual({ ok: true, output: "" });
  });

  it("uses normalized JSON when both sides parse successfully", () => {
    const result = prepareStructuredCompare({
      original: '{"b":2,"a":1}',
      modified: '{"a":1,"b":2}',
      leftLanguage: "json",
      rightLanguage: "json",
    });

    expect(result).toEqual({
      original: '{\n  "a": 1,\n  "b": 2\n}',
      modified: '{\n  "a": 1,\n  "b": 2\n}',
      strategy: "json",
      errors: [],
    });
  });

  it("falls back to text diff and reports invalid JSON errors", () => {
    const result = prepareStructuredCompare({
      original: '{"a":1',
      modified: '{"a":1,"b":2}',
      leftLanguage: "json",
      rightLanguage: "json",
    });

    expect(result.strategy).toBe("text");
    expect(result.original).toBe('{"a":1');
    expect(result.modified).toBe('{"a":1,"b":2}');
    expect(result.errors).toEqual([
      {
        side: "left",
        message: expect.any(String),
      },
    ]);
  });

  it("keeps raw text mode when both panels are not JSON", () => {
    const result = prepareStructuredCompare({
      original: "A=1\nB=2",
      modified: "A=1\nB=3",
      leftLanguage: "text",
      rightLanguage: "text",
    });

    expect(result).toEqual({
      original: "A=1\nB=2",
      modified: "A=1\nB=3",
      strategy: "text",
      errors: [],
    });
  });
});
