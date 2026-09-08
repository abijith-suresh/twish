import { fireEvent, render, waitFor } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/clipboard", () => ({
  copyToClipboard: vi.fn(),
}));

import { copyToClipboard } from "@/lib/clipboard";
import CopyButton from "./CopyButton";

const copyToClipboardMock = vi.mocked(copyToClipboard);

describe("CopyButton", () => {
  it("renders with the default label and copies the given text", async () => {
    copyToClipboardMock.mockResolvedValue(true);
    const { getByRole } = render(() => <CopyButton text="secret value" />);

    const button = getByRole("button", { name: "Copy" });
    fireEvent.click(button);

    await waitFor(() => expect(copyToClipboardMock).toHaveBeenCalledWith("secret value"));
    await waitFor(() => expect(getByRole("button", { name: "Copied!" })).toBeInTheDocument());
  });

  it("shows no copied feedback when the clipboard write fails", async () => {
    copyToClipboardMock.mockResolvedValue(false);
    const { getByRole } = render(() => <CopyButton text="value" label="Copy hash" />);

    fireEvent.click(getByRole("button", { name: "Copy hash" }));

    await waitFor(() => expect(copyToClipboardMock).toHaveBeenCalled());
    expect(getByRole("button", { name: "Copy hash" })).toBeInTheDocument();
  });

  it("resets the copied state after the feedback window", async () => {
    vi.useFakeTimers();
    copyToClipboardMock.mockResolvedValue(true);
    const { getByRole, findByText } = render(() => <CopyButton text="value" />);
    fireEvent.click(getByRole("button", { name: "Copy" }));

    await vi.advanceTimersByTimeAsync(0);
    expect(await findByText("Copied!")).toBeInTheDocument();

    await vi.advanceTimersByTimeAsync(2000);
    expect(getByRole("button", { name: "Copy" })).toBeInTheDocument();

    vi.useRealTimers();
  });
});
