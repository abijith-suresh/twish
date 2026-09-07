import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it, vi } from "vitest";

import ToolErrorFallback from "./ToolErrorFallback";

describe("ToolErrorFallback", () => {
  it("renders the tool name, guidance, and a retry button", () => {
    const { getByRole, getByText } = render(() => (
      <ToolErrorFallback toolName="JWT Decoder" error={new Error("exploded")} onRetry={() => {}} />
    ));

    expect(getByRole("alert")).toBeInTheDocument();
    expect(getByText("JWT Decoder could not be loaded")).toBeInTheDocument();
    expect(getByRole("button", { name: "Retry tool" })).toBeInTheDocument();
  });

  it("shows the error message in dev and hides it in production", () => {
    const dev = render(() => (
      <ToolErrorFallback toolName="Diff" error={new Error("secret detail")} />
    ));
    expect(dev.getByText("secret detail")).toBeInTheDocument();
    dev.unmount();
  });

  it("omits the retry button when no retry handler is given", () => {
    const { queryByRole } = render(() => <ToolErrorFallback toolName="Diff" />);
    expect(queryByRole("button", { name: "Retry tool" })).toBeNull();
  });

  it("invokes the retry handler on click", () => {
    const onRetry = vi.fn();
    const { getByRole } = render(() => <ToolErrorFallback toolName="Diff" onRetry={onRetry} />);

    fireEvent.click(getByRole("button", { name: "Retry tool" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
