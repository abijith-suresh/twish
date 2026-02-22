import { type Change, diffLines } from "diff";
import React, { useMemo } from "react";

interface DiffRow {
  left: string | null;
  right: string | null;
  leftLineNum: number | null;
  rightLineNum: number | null;
  type: "equal" | "added" | "removed" | "changed";
}

function buildRows(changes: Change[]): DiffRow[] {
  const rows: DiffRow[] = [];
  let leftLine = 1;
  let rightLine = 1;

  // Pair up removed/added blocks for aligned rows
  let i = 0;
  while (i < changes.length) {
    const change = changes[i];

    if (!change.added && !change.removed) {
      // Equal lines
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
    } else if (change.removed && i + 1 < changes.length && changes[i + 1].added) {
      // Paired removed + added — align side by side
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
          type: "changed",
        });
      }
      i += 2;
    } else if (change.removed) {
      // Only removed, no paired addition
      const lines = change.value.replace(/\n$/, "").split("\n");
      for (const line of lines) {
        rows.push({
          left: line,
          right: null,
          leftLineNum: leftLine++,
          rightLineNum: null,
          type: "removed",
        });
      }
      i++;
    } else {
      // Only added, no paired removal
      const lines = change.value.replace(/\n$/, "").split("\n");
      for (const line of lines) {
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
  }

  return rows;
}

interface Props {
  original: string;
  modified: string;
}

export default function DiffView({ original, modified }: Props) {
  const { rows, stats } = useMemo(() => {
    const changes = diffLines(original, modified);
    const diffRows = buildRows(changes);
    const added = changes.filter((c) => c.added).reduce((sum, c) => sum + (c.count ?? 0), 0);
    const removed = changes.filter((c) => c.removed).reduce((sum, c) => sum + (c.count ?? 0), 0);
    return { rows: diffRows, stats: { added, removed } };
  }, [original, modified]);

  const hasChanges = stats.added > 0 || stats.removed > 0;

  if (!hasChanges && original === modified) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-slate-500">
        No differences found.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-col">
      {/* Stats bar */}
      <div className="flex shrink-0 items-center gap-4 border-b border-slate-800 bg-slate-900/50 px-4 py-2 text-xs">
        <span className="font-medium text-slate-400">Diff</span>
        {stats.added > 0 && (
          <span className="text-green-400">
            +{stats.added} line{stats.added !== 1 ? "s" : ""}
          </span>
        )}
        {stats.removed > 0 && (
          <span className="text-red-400">
            -{stats.removed} line{stats.removed !== 1 ? "s" : ""}
          </span>
        )}
        {!hasChanges && <span className="text-slate-500">Identical</span>}
      </div>

      {/* Diff table */}
      <div className="min-h-0 flex-1 overflow-auto font-mono text-xs">
        <table className="w-full border-collapse">
          <colgroup>
            <col className="w-10" />
            <col className="w-[calc(50%-2.5rem)]" />
            <col className="w-10" />
            <col className="w-[calc(50%-2.5rem)]" />
          </colgroup>
          <tbody>
            {rows.map((row, idx) => {
              const isRemoved = row.type === "removed" || row.type === "changed";
              const isAdded = row.type === "added" || row.type === "changed";

              return (
                <tr key={idx} className="border-b border-slate-800/50">
                  {/* Left line number */}
                  <td
                    className={[
                      "select-none px-2 py-0.5 text-right text-slate-600",
                      isRemoved && row.left !== null ? "bg-red-950/40" : "",
                      row.left === null ? "bg-slate-900/30" : "",
                    ]
                      .join(" ")
                      .trim()}
                  >
                    {row.leftLineNum}
                  </td>
                  {/* Left content */}
                  <td
                    className={[
                      "px-3 py-0.5 whitespace-pre",
                      isRemoved && row.left !== null
                        ? "bg-red-950/40 text-red-200"
                        : "text-slate-300",
                      row.left === null ? "bg-slate-900/30" : "",
                    ]
                      .join(" ")
                      .trim()}
                  >
                    {row.left !== null && (
                      <>
                        {isRemoved && (
                          <span className="mr-2 text-red-500" aria-hidden="true">
                            -
                          </span>
                        )}
                        {row.left}
                      </>
                    )}
                  </td>

                  {/* Divider */}
                  <td
                    className={[
                      "select-none px-2 py-0.5 text-right text-slate-600",
                      isAdded && row.right !== null ? "bg-green-950/40" : "",
                      row.right === null ? "bg-slate-900/30" : "",
                    ]
                      .join(" ")
                      .trim()}
                  >
                    {row.rightLineNum}
                  </td>
                  {/* Right content */}
                  <td
                    className={[
                      "px-3 py-0.5 whitespace-pre",
                      isAdded && row.right !== null
                        ? "bg-green-950/40 text-green-200"
                        : "text-slate-300",
                      row.right === null ? "bg-slate-900/30" : "",
                    ]
                      .join(" ")
                      .trim()}
                  >
                    {row.right !== null && (
                      <>
                        {isAdded && (
                          <span className="mr-2 text-green-500" aria-hidden="true">
                            +
                          </span>
                        )}
                        {row.right}
                      </>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
