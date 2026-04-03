import { describe, expect, it } from "vitest";

import { formatJson, parseJsonErrorPosition, syntaxHighlightJson } from "./jsonFormatter";

describe("json formatter utilities", () => {
  it("formats JSON with configurable indentation", () => {
    const result = formatJson('{"b":2,"a":1}', 2, false);

    expect(result.error).toBeNull();
    expect(result.raw).toBe(`{
  "b": 2,
  "a": 1
}`);
  });

  it("minifies JSON when requested", () => {
    const result = formatJson(
      `{
      "a": 1,
      "b": 2
    }`,
      2,
      true
    );

    expect(result.raw).toBe('{"a":1,"b":2}');
  });

  it("returns parse errors for invalid JSON", () => {
    const result = formatJson('{"a":1', 2, false);

    expect(result.error).toContain("JSON parse error:");
  });

  it("extracts line or position details from parser messages", () => {
    expect(parseJsonErrorPosition("Unexpected token at line 4")).toBe(4);
    expect(parseJsonErrorPosition("Unexpected token at position 12")).toBe(12);
  });

  it("wraps highlighted JSON tokens in span elements", () => {
    expect(syntaxHighlightJson('{"a":true}')).toContain("<span");
  });
});
