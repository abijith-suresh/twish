// @vitest-environment jsdom

import { describe, expect, it } from "vitest";

import { readImportedFile } from "./fileImport";

describe("file import browser runtime", () => {
  it("reads text files through browser File APIs", async () => {
    const file = new File(["hello world"], "hello.txt", { type: "text/plain" });
    Object.defineProperty(file, "text", {
      value: () => Promise.resolve("hello world"),
    });

    const result = await readImportedFile(file, { as: "text" });

    expect(result).toEqual({
      ok: true,
      file: {
        name: "hello.txt",
        size: 11,
        type: "text/plain",
      },
      value: "hello world",
      decision: { status: "accept" },
    });
  });

  it("reads binary files through browser File APIs", async () => {
    const file = new File([new Uint8Array([1, 2, 3])], "bytes.bin", {
      type: "application/octet-stream",
    });
    Object.defineProperty(file, "arrayBuffer", {
      value: () => Promise.resolve(Uint8Array.from([1, 2, 3]).buffer),
    });

    const result = await readImportedFile(file, { as: "bytes" });

    expect(result.ok).toBe(true);

    if (!result.ok) {
      throw new Error("expected binary import to succeed");
    }

    expect(Array.from(result.value)).toEqual([1, 2, 3]);
  });
});
