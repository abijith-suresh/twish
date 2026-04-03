import { describe, expect, it } from "vitest";

import { buildRegexResult, escapeHtml } from "./regex";

describe("regex utilities", () => {
  it("escapes HTML before highlighting", () => {
    expect(escapeHtml("<tag>&")).toBe("&lt;tag&gt;&amp;");
  });

  it("builds regex results with matches and highlighting", () => {
    const result = buildRegexResult("foo", new Set(["g"]), "foo bar foo");

    expect(result.error).toBeNull();
    expect(result.matches).toHaveLength(2);
    expect(result.highlighted).toContain("<mark");
  });

  it("captures named and unnamed groups", () => {
    const result = buildRegexResult("(?<word>foo)(bar)", new Set(["g"]), "foobar");

    expect(result.matches[0]?.groups).toEqual([
      { name: "word", value: "foo" },
      { name: null, value: "bar" },
    ]);
  });

  it("reports invalid regex patterns", () => {
    const result = buildRegexResult("(", new Set(["g"]), "foo");

    expect(result.error).toBeTruthy();
    expect(result.matches).toEqual([]);
  });
});
