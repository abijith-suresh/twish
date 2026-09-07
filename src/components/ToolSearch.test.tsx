import { fireEvent, render } from "@solidjs/testing-library";
import { describe, expect, it } from "vitest";

import { tools } from "@/tools/registry";
import ToolSearch from "./ToolSearch";

describe("ToolSearch", () => {
  it("renders every registered tool with the curated tools ordered first", () => {
    const { getAllByRole } = render(() => <ToolSearch />);

    const options = getAllByRole("option");
    expect(options).toHaveLength(tools.length);
    expect(options[0]).toHaveTextContent("JSON Formatter");
  });

  it("filters results by name, description, and keywords", () => {
    const { getByRole, getAllByRole } = render(() => <ToolSearch />);
    const input = getByRole("combobox", { name: "Search tools" });

    fireEvent.input(input, { target: { value: "cron" } });
    let options = getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Cron Schedule");

    fireEvent.input(input, { target: { value: "sha256" } });
    options = getAllByRole("option");
    expect(options[0]).toHaveTextContent("Hash Generator");
  });

  it("shows an empty state when nothing matches", () => {
    const { getByRole, getByText } = render(() => <ToolSearch />);
    const input = getByRole("combobox", { name: "Search tools" });

    fireEvent.input(input, { target: { value: "blockchain" } });

    expect(getByText(/no tools match/i)).toBeInTheDocument();
  });

  it("moves the keyboard selection with arrow keys", () => {
    const { getByRole, getAllByRole } = render(() => <ToolSearch />);
    const input = getByRole("combobox", { name: "Search tools" });

    expect(input).not.toHaveAttribute("aria-activedescendant");

    fireEvent.keyDown(input, { key: "ArrowDown" });

    const options = getAllByRole("option");
    expect(input).toHaveAttribute("aria-activedescendant", options[0].id);
    expect(options[0]).toHaveAttribute("aria-selected", "true");
  });

  it("clears the query on Escape", () => {
    const { getByRole, queryByRole } = render(() => <ToolSearch />);
    const input = getByRole("combobox", { name: "Search tools" });

    fireEvent.input(input, { target: { value: "diff" } });
    expect(queryByRole("option")).not.toBeNull();

    fireEvent.keyDown(input, { key: "Escape" });

    expect(queryByRole("option", { selected: true })).toBeNull();
  });
});
