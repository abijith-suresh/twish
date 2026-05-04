import { describe, expect, it } from "vitest";

import { hashBytes, hashBytesWithAlgorithms, hashText, hashTextWithAlgorithms } from "./hash";

describe("hash", () => {
  it("computes a stable SHA-256 digest", async () => {
    await expect(hashText("hello", "SHA-256")).resolves.toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    );
  });

  it("hashes raw bytes with the same digest as equivalent text bytes", async () => {
    const bytes = new TextEncoder().encode("hello");

    await expect(hashBytes(bytes, "SHA-256")).resolves.toBe(
      "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
    );
  });

  it("computes all supported digests for text", async () => {
    const results = await hashTextWithAlgorithms("hello");

    expect(results.map((result) => result.algorithm)).toEqual([
      "SHA-1",
      "SHA-256",
      "SHA-384",
      "SHA-512",
    ]);
    expect(results.map((result) => result.hex.length)).toEqual([40, 64, 96, 128]);
  });

  it("computes all supported digests for bytes", async () => {
    const results = await hashBytesWithAlgorithms(new Uint8Array([0, 255, 16]));

    expect(results.map((result) => result.algorithm)).toEqual([
      "SHA-1",
      "SHA-256",
      "SHA-384",
      "SHA-512",
    ]);
    expect(results.map((result) => result.hex.length)).toEqual([40, 64, 96, 128]);
  });
});
