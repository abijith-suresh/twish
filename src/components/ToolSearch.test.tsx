import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import { tools } from "@/tools/registry";
import ToolSearch from "./ToolSearch";

describe("ToolSearch", () => {
  it("renders every registered tool with the curated tools ordered first", () => {
    const { getAllByRole } = render(() => <ToolSearch />);

    const links = getAllByRole("link");
    expect(links).toHaveLength(tools.length);
    expect(links[0]).toHaveTextContent("JSON Formatter");
  });

  it("filters results by name, description, and keywords", () => {
    const { getByRole, getAllByRole } = render(() => <ToolSearch />);
    const input = getByRole("textbox", { name: "Search tools" });

    fireEvent.input(input, { target: { value: "cron" } });
    let links = getAllByRole("link");
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveTextContent("Cron Schedule");

    fireEvent.input(input, { target: { value: "sha256" } });
    links = getAllByRole("link");
    expect(links[0]).toHaveTextContent("Hash Generator");
  });

  it("shows an empty state when nothing matches", () => {
    const { getByRole, getByText } = render(() => <ToolSearch />);
    const input = getByRole("textbox", { name: "Search tools" });

    fireEvent.input(input, { target: { value: "blockchain" } });

    expect(getByText(/no tools match/i)).toBeInTheDocument();
  });

  it("moves the keyboard selection with arrow keys", () => {
    const { getByRole, getAllByRole } = render(() => <ToolSearch />);
    const input = getByRole("textbox", { name: "Search tools" });

    fireEvent.keyDown(input, { key: "ArrowDown" });

    const links = getAllByRole("link");
    expect(links[0]).toHaveClass("lp-row--active");
  });

  it("clears the query on Escape", () => {
    const { getByRole, getAllByRole } = render(() => <ToolSearch />);
    const input = getByRole("textbox", { name: "Search tools" });

    fireEvent.input(input, { target: { value: "diff" } });
    expect(getAllByRole("link")).toHaveLength(1);

    fireEvent.keyDown(input, { key: "Escape" });

    expect(input).toHaveValue("");
    expect(getAllByRole("link")).toHaveLength(tools.length);
  });
});
