import { type Change, diffLines, diffWords } from "diff";

export interface DiffRow {
  left: string | null;
  right: string | null;
  leftLineNum: number | null;
  rightLineNum: number | null;
  type: "equal" | "added" | "removed" | "changed" | "separator";
  /** HTML markup for intra-line word diff (only set for "changed" rows) */
  leftHtml?: string;
  rightHtml?: string;
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

/**
 * Escape a string for safe innerHTML insertion.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Build intra-line word-level diff HTML for a pair of changed lines.
 */
function buildWordDiffHtml(
  leftText: string,
  rightText: string
): { leftHtml: string; rightHtml: string } {
  const wordChanges = diffWords(leftText, rightText);
  let leftHtml = "";
  let rightHtml = "";

  for (const part of wordChanges) {
    const escaped = escapeHtml(part.value);
    if (part.removed) {
      leftHtml += `<mark class="diff-word-removed">${escaped}</mark>`;
    } else if (part.added) {
      rightHtml += `<mark class="diff-word-added">${escaped}</mark>`;
    } else {
      leftHtml += escaped;
      rightHtml += escaped;
    }
  }

  return { leftHtml, rightHtml };
}

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
        const rowType = hasLeft && hasRight ? "changed" : hasLeft ? "removed" : "added";

        const row: DiffRow = {
          left: hasLeft ? removedLines[j] : null,
          right: hasRight ? addedLines[j] : null,
          leftLineNum: hasLeft ? leftLine++ : null,
          rightLineNum: hasRight ? rightLine++ : null,
          type: rowType,
        };

        // Add intra-line word diff for "changed" rows (both sides have content)
        if (rowType === "changed" && row.left !== null && row.right !== null) {
          const { leftHtml, rightHtml } = buildWordDiffHtml(row.left, row.right);
          row.leftHtml = leftHtml;
          row.rightHtml = rightHtml;
        }

        rows.push(row);
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

/**
 * Returns true if consecutive indexed rows have non-contiguous line numbers
 * (indicating a gap caused by filtering).
 */
function hasGap(a: IndexedDiffRow, b: IndexedDiffRow): boolean {
  // Check source indices — if they aren't adjacent, there's a gap.
  return b.sourceIndex - a.sourceIndex > 1;
}

const SEPARATOR_ROW: DiffRow = {
  left: null,
  right: null,
  leftLineNum: null,
  rightLineNum: null,
  type: "separator",
};

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

  const filtered = indexedRows.filter(({ sourceIndex }) => changedIdx.has(sourceIndex));

  // Insert separator rows between non-contiguous hunks
  const result: IndexedDiffRow[] = [];
  for (let i = 0; i < filtered.length; i++) {
    if (i > 0 && hasGap(filtered[i - 1], filtered[i])) {
      // Use a sentinel sourceIndex that won't collide
      result.push({ row: SEPARATOR_ROW, sourceIndex: -1 });
    }
    result.push(filtered[i]);
  }

  return result;
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
