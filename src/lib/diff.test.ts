import { describe, expect, it } from "vitest";

import {
  createDiffRows,
  filterRowsWithContext,
  getChangeSourceIndices,
  getDiffStats,
} from "./diff";

describe("diff utilities", () => {
  it("builds paired changed rows for adjacent removed and added hunks", () => {
    const rows = createDiffRows("alpha\nbeta\n", "alpha\ngamma\n");

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ left: "alpha", right: "alpha", type: "equal" });
    expect(rows[1]).toMatchObject({ left: "beta", right: "gamma", type: "changed" });
  });

  it("keeps surplus lines in uneven replace hunks as added or removed rows", () => {
    const rows = createDiffRows("same\nold\n", "same\nnew\nextra\n");

    expect(rows).toHaveLength(3);
    expect(rows[1]).toMatchObject({ left: "old", right: "new", type: "changed" });
    expect(rows[2]).toMatchObject({ left: null, right: "extra", type: "added" });
  });

  it("preserves source indices when filtering changes only", () => {
    const rows = createDiffRows("a\nb\nc\nd\n", "a\nb\nx\nd\n");
    const filtered = filterRowsWithContext(rows, true, 0);

    expect(filtered).toEqual([
      {
        row: expect.objectContaining({ left: "c", right: "x", type: "changed" }),
        sourceIndex: 2,
      },
    ]);
  });

  it("returns all rows when changes-only mode is disabled", () => {
    const rows = createDiffRows("a\nb\n", "a\nc\n");
    const filtered = filterRowsWithContext(rows, false);

    expect(filtered).toHaveLength(rows.length);
    expect(filtered.map((entry) => entry.sourceIndex)).toEqual([0, 1]);
  });

  it("computes added and removed stats from rows", () => {
    const rows = createDiffRows("same\nold\n", "same\nnew\nextra\n");

    expect(getDiffStats(rows)).toEqual({ added: 2, removed: 1 });
  });

  it("returns original change indices for navigation", () => {
    const rows = createDiffRows("a\nb\nc\n", "a\nx\ny\n");

    expect(getChangeSourceIndices(rows)).toEqual([1, 2]);
  });
});
