import { describe, expect, it } from "vitest";

import {
  decodeBase64ToBytes,
  decodeBase64ToText,
  encodeBytesToBase64,
  encodeTextToBase64,
  processBase64Input,
  toBase64Url,
} from "./base64";

describe("base64 utilities", () => {
  it("encodes and decodes standard base64 text", () => {
    const encoded = encodeTextToBase64("hello world", "standard");

    expect(encoded).toBe("aGVsbG8gd29ybGQ=");
    expect(decodeBase64ToText(encoded, "standard")).toBe("hello world");
  });

  it("encodes and decodes base64url text", () => {
    const encoded = encodeTextToBase64("hello?", "url");

    expect(encoded).toBe(toBase64Url("aGVsbG8/"));
    expect(decodeBase64ToText(encoded, "url")).toBe("hello?");
  });

  it("encodes bytes directly for file workflows", () => {
    expect(encodeBytesToBase64(new Uint8Array([0, 255, 16]), "standard")).toBe("AP8Q");
  });

  it("decodes binary output for file workflows", () => {
    expect(Array.from(decodeBase64ToBytes("AP8Q", "standard"))).toEqual([0, 255, 16]);
  });

  it("reports invalid text decode input", () => {
    expect(processBase64Input("a", "decode", "standard", "text")).toEqual({
      ok: false,
      error:
        "Invalid input for the selected Base64 variant, or the decoded bytes are not valid UTF-8 text.",
    });
  });

  it("returns a byte summary for binary decode workflows", () => {
    const result = processBase64Input("AP8Q", "decode", "standard", "file");

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.outputKind).toBe("bytes");
      expect(result.value).toContain("3 bytes");
      expect(result.value).toContain("00 ff 10");
    }
  });
});
