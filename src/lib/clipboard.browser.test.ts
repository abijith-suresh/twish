// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { copyToClipboard } from "./clipboard";

describe("clipboard browser runtime", () => {
  let clipboardWriteText: ReturnType<typeof vi.fn>;
  let execCommand: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clipboardWriteText = vi.fn().mockResolvedValue(undefined);
    execCommand = vi.fn().mockReturnValue(true);

    Object.defineProperty(window, "isSecureContext", {
      value: true,
      configurable: true,
    });

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: clipboardWriteText },
      configurable: true,
    });

    document.execCommand = execCommand as typeof document.execCommand;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses navigator.clipboard in secure contexts", async () => {
    await expect(copyToClipboard("hello")).resolves.toBe(true);
    expect(clipboardWriteText).toHaveBeenCalledWith("hello");
  });

  it("falls back to execCommand outside secure contexts", async () => {
    Object.defineProperty(window, "isSecureContext", {
      value: false,
      configurable: true,
    });

    await expect(copyToClipboard("fallback")).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
  });

  it("returns false when both clipboard strategies fail", async () => {
    clipboardWriteText.mockRejectedValue(new Error("denied"));

    await expect(copyToClipboard("fail")).resolves.toBe(false);
  });
});
