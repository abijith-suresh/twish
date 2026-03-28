import { type Change, diffLines } from "diff";

export interface DiffRow {
  left: string | null;
  right: string | null;
  leftLineNum: number | null;
  rightLineNum: number | null;
  type: "equal" | "added" | "removed" | "changed";
}

export interface IndexedDiffRow {
  row: DiffRow;
  sourceIndex: number;
}

export interface DiffStats {
  added: number;
  removed: number;
}

export const DIFF_CONTEXT = 3;

export function buildRows(changes: Change[]): DiffRow[] {
  const rows: DiffRow[] = [];
  let leftLine = 1;
  let rightLine = 1;
  let i = 0;

  while (i < changes.length) {
    const change = changes[i];

    if (!change.added && !change.removed) {
      const lines = change.value.replace(/\n$/, "").split("\n");
      for (const line of lines) {
        rows.push({
          left: line,
          right: line,
          leftLineNum: leftLine++,
          rightLineNum: rightLine++,
          type: "equal",
        });
      }
      i++;
      continue;
    }

    if (change.removed && i + 1 < changes.length && changes[i + 1].added) {
      const removedLines = change.value.replace(/\n$/, "").split("\n");
      const addedLines = changes[i + 1].value.replace(/\n$/, "").split("\n");
      const maxLen = Math.max(removedLines.length, addedLines.length);

      for (let j = 0; j < maxLen; j++) {
        const hasLeft = j < removedLines.length;
        const hasRight = j < addedLines.length;

        rows.push({
          left: hasLeft ? removedLines[j] : null,
          right: hasRight ? addedLines[j] : null,
          leftLineNum: hasLeft ? leftLine++ : null,
          rightLineNum: hasRight ? rightLine++ : null,
          type: hasLeft && hasRight ? "changed" : hasLeft ? "removed" : "added",
        });
      }

      i += 2;
      continue;
    }

    if (change.removed) {
      for (const line of change.value.replace(/\n$/, "").split("\n")) {
        rows.push({
          left: line,
          right: null,
          leftLineNum: leftLine++,
          rightLineNum: null,
          type: "removed",
        });
      }
      i++;
      continue;
    }

    for (const line of change.value.replace(/\n$/, "").split("\n")) {
      rows.push({
        left: null,
        right: line,
        leftLineNum: null,
        rightLineNum: rightLine++,
        type: "added",
      });
    }

    i++;
  }

  return rows;
}

export function createDiffRows(original: string, modified: string): DiffRow[] {
  return buildRows(diffLines(original, modified));
}

export function filterRowsWithContext(
  rows: DiffRow[],
  changesOnly: boolean,
  context = DIFF_CONTEXT
): IndexedDiffRow[] {
  const indexedRows = rows.map((row, sourceIndex) => ({ row, sourceIndex }));

  if (!changesOnly) {
    return indexedRows;
  }

  const changedIdx = new Set<number>();

  rows.forEach((row, index) => {
    if (row.type !== "equal") {
      for (
        let contextIndex = Math.max(0, index - context);
        contextIndex <= Math.min(rows.length - 1, index + context);
        contextIndex++
      ) {
        changedIdx.add(contextIndex);
      }
    }
  });

  return indexedRows.filter(({ sourceIndex }) => changedIdx.has(sourceIndex));
}

export function getDiffStats(rows: DiffRow[]): DiffStats {
  const added = rows.filter((row) => row.type === "added" || row.type === "changed").length;
  const removed = rows.filter((row) => row.type === "removed" || row.type === "changed").length;

  return { added, removed };
}

export function getChangeSourceIndices(rows: DiffRow[]): number[] {
  return rows.reduce<number[]>((acc, row, index) => {
    if (row.type !== "equal") {
      acc.push(index);
    }
    return acc;
  }, []);
}
