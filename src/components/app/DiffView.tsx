import { type Change, diffLines } from "diff";
import { createMemo, For, Show } from "solid-js";

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
    } else if (change.removed && i + 1 < changes.length && changes[i + 1].added) {
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

export default function DiffView(props: Props) {
  const result = createMemo(() => {
    const changes = diffLines(props.original, props.modified);
    const rows = buildRows(changes);
    const added = changes.filter((c) => c.added).reduce((sum, c) => sum + (c.count ?? 0), 0);
    const removed = changes.filter((c) => c.removed).reduce((sum, c) => sum + (c.count ?? 0), 0);
    return { rows, stats: { added, removed } };
  });

  const hasChanges = () => result().stats.added > 0 || result().stats.removed > 0;

  return (
    <Show
      when={hasChanges() || props.original !== props.modified}
      fallback={<div class="diff-empty">No differences found.</div>}
    >
      <div class="diff-wrap">
        {/* Stats bar */}
        <div class="diff-stats">
          <span class="diff-stats-label">DIFF</span>
          <Show when={result().stats.added > 0}>
            <span class="diff-added">
              +{result().stats.added} line{result().stats.added !== 1 ? "s" : ""}
            </span>
          </Show>
          <Show when={result().stats.removed > 0}>
            <span class="diff-removed">
              -{result().stats.removed} line{result().stats.removed !== 1 ? "s" : ""}
            </span>
          </Show>
          <Show when={!hasChanges()}>
            <span class="diff-identical">Identical</span>
          </Show>
        </div>

        {/* Diff table */}
        <div class="diff-table-wrap">
          <table class="diff-table">
            <colgroup>
              <col class="col-linenum" />
              <col class="col-content" />
              <col class="col-linenum" />
              <col class="col-content" />
            </colgroup>
            <tbody>
              <For each={result().rows}>
                {(row) => {
                  const isRemoved = row.type === "removed" || row.type === "changed";
                  const isAdded = row.type === "added" || row.type === "changed";

                  return (
                    <tr class="diff-row">
                      <td
                        class={[
                          "diff-linenum",
                          isRemoved && row.left !== null ? "diff-linenum--removed" : "",
                          row.left === null ? "diff-cell--empty" : "",
                        ]
                          .join(" ")
                          .trim()}
                      >
                        {row.leftLineNum}
                      </td>
                      <td
                        class={[
                          "diff-content",
                          isRemoved && row.left !== null ? "diff-content--removed" : "",
                          row.left === null ? "diff-cell--empty" : "",
                        ]
                          .join(" ")
                          .trim()}
                      >
                        <Show when={row.left !== null}>
                          <Show when={isRemoved}>
                            <span class="diff-marker diff-marker--removed" aria-hidden="true">
                              -
                            </span>
                          </Show>
                          {row.left}
                        </Show>
                      </td>

                      <td
                        class={[
                          "diff-linenum",
                          isAdded && row.right !== null ? "diff-linenum--added" : "",
                          row.right === null ? "diff-cell--empty" : "",
                        ]
                          .join(" ")
                          .trim()}
                      >
                        {row.rightLineNum}
                      </td>
                      <td
                        class={[
                          "diff-content",
                          isAdded && row.right !== null ? "diff-content--added" : "",
                          row.right === null ? "diff-cell--empty" : "",
                        ]
                          .join(" ")
                          .trim()}
                      >
                        <Show when={row.right !== null}>
                          <Show when={isAdded}>
                            <span class="diff-marker diff-marker--added" aria-hidden="true">
                              +
                            </span>
                          </Show>
                          {row.right}
                        </Show>
                      </td>
                    </tr>
                  );
                }}
              </For>
            </tbody>
          </table>
        </div>
      </div>
    </Show>
  );
}
