import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import { type Change, diffLines } from "diff";
import EditorPanel from "./EditorPanel";
import { type Language } from "./LanguageSelector";

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
        rows.push({
          left: j < removedLines.length ? removedLines[j] : null,
          right: j < addedLines.length ? addedLines[j] : null,
          leftLineNum: j < removedLines.length ? leftLine++ : null,
          rightLineNum: j < addedLines.length ? rightLine++ : null,
          type: "changed",
        });
      }
      i += 2;
    } else if (change.removed) {
      for (const line of change.value.replace(/\n$/, "").split("\n")) {
        rows.push({ left: line, right: null, leftLineNum: leftLine++, rightLineNum: null, type: "removed" });
      }
      i++;
    } else {
      for (const line of change.value.replace(/\n$/, "").split("\n")) {
        rows.push({ left: null, right: line, leftLineNum: null, rightLineNum: rightLine++, type: "added" });
      }
      i++;
    }
  }
  return rows;
}

const CONTEXT = 3;

export default function DiffApp() {
  const [leftContent, setLeftContent] = createSignal("");
  const [rightContent, setRightContent] = createSignal("");
  const [leftLang, setLeftLang] = createSignal<Language>("text");
  const [rightLang, setRightLang] = createSignal<Language>("text");
  const [diffData, setDiffData] = createSignal<{ original: string; modified: string } | null>(null);
  const [changesOnly, setChangesOnly] = createSignal(true);
  const [pending, setPending] = createSignal(false);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  createEffect(() => {
    const _left = leftContent();
    const _right = rightContent();
    setPending(true);
    if (debounceTimer !== undefined) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      setDiffData({ original: _left, modified: _right });
      setPending(false);
    }, 400);
  });

  onCleanup(() => {
    if (debounceTimer !== undefined) clearTimeout(debounceTimer);
  });

  function handleSwap() {
    const prevLeft = leftContent();
    const prevRight = rightContent();
    const prevLeftLang = leftLang();
    const prevRightLang = rightLang();
    setLeftContent(prevRight);
    setRightContent(prevLeft);
    setLeftLang(prevRightLang);
    setRightLang(prevLeftLang);
  }

  function handleClear() {
    setLeftContent("");
    setRightContent("");
    setDiffData(null);
    setPending(false);
  }

  onMount(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        handleClear();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    onCleanup(() => document.removeEventListener("keydown", handleKeyDown));
  });

  const rows = createMemo((): DiffRow[] => {
    const d = diffData();
    if (!d) return [];
    const changes = diffLines(d.original, d.modified);
    return buildRows(changes);
  });

  const filteredRows = createMemo((): DiffRow[] => {
    if (!changesOnly()) return rows();
    const allRows = rows();
    const changedIdx = new Set<number>();
    allRows.forEach((row, i) => {
      if (row.type !== "equal") {
        for (let c = Math.max(0, i - CONTEXT); c <= Math.min(allRows.length - 1, i + CONTEXT); c++) {
          changedIdx.add(c);
        }
      }
    });
    return allRows.filter((_, i) => changedIdx.has(i));
  });

  const stats = createMemo(() => {
    const all = rows();
    const added = all.filter((r) => r.type === "added" || r.type === "changed").length;
    const removed = all.filter((r) => r.type === "removed" || r.type === "changed").length;
    return { added, removed };
  });

  // eslint-disable-next-line no-unassigned-vars
  let diffPanelRef!: HTMLDivElement;
  let changeIndices: number[] = [];
  let currentChangeIdx = -1;

  createEffect(() => {
    const allRows = rows();
    changeIndices = allRows.reduce<number[]>((acc, row, i) => {
      if (row.type !== "equal") acc.push(i);
      return acc;
    }, []);
    currentChangeIdx = -1;
  });

  function jumpToNextChange() {
    if (changeIndices.length === 0) return;
    currentChangeIdx = (currentChangeIdx + 1) % changeIndices.length;
    const row = diffPanelRef?.querySelector(`[data-row="${changeIndices[currentChangeIdx]}"]`);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div class="flex flex-col h-full overflow-hidden bg-dusk-bg">
      {/* Toolbar */}
      <div class="flex items-center gap-3 flex-shrink-0 px-4 py-2 bg-dusk-surface border-b border-dusk-border">
        <span class="font-mono text-xs text-dusk-amber font-semibold tracking-widest uppercase">
          Live diff
        </span>
        <span
          class="font-mono text-xs text-dusk-subtle transition-opacity"
          style={{ opacity: pending() ? "1" : "0" }}
          aria-live="polite"
        >
          ⟳ updating…
        </span>
        <div class="ml-auto flex items-center gap-2">
          <button type="button" onClick={handleSwap} class="btn-secondary text-xs">
            Swap ⇄
          </button>
          <button type="button" onClick={handleClear} class="btn-secondary text-xs">
            Clear
          </button>
        </div>
      </div>

      {/* 3-column content row */}
      <div class="flex flex-1 min-h-0 overflow-hidden">
        {/* Left editor */}
        <div class="flex flex-1 min-w-0 flex-col border-r border-dusk-border">
          <EditorPanel
            label="Original"
            value={leftContent()}
            language={leftLang()}
            onValueChange={setLeftContent}
            onLanguageChange={setLeftLang}
            panelId="left"
          />
        </div>

        {/* Center diff panel */}
        <div class="flex flex-col border-r border-dusk-border" style="flex: 1.2; min-width: 0;">
          {/* Diff panel header */}
          <div class="flex items-center gap-3 flex-shrink-0 px-3 py-2 bg-dusk-surface border-b border-dusk-border">
            <span class="font-mono text-xs text-dusk-muted uppercase tracking-widest">Diff</span>
            <Show when={diffData() && (stats().added > 0 || stats().removed > 0)}>
              <span class="font-mono text-xs text-green-400">+{stats().added}</span>
              <span class="font-mono text-xs text-red-400">-{stats().removed}</span>
            </Show>
            <Show when={diffData() && stats().added === 0 && stats().removed === 0}>
              <span class="font-mono text-xs text-dusk-subtle">Identical</span>
            </Show>
            <div class="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={jumpToNextChange}
                class="btn-secondary text-xs"
                title="Jump to next change"
              >
                ↓ Next
              </button>
              {/* Changes only toggle */}
              <label class="flex items-center gap-1.5 cursor-pointer select-none">
                <button
                  type="button"
                  role="switch"
                  aria-checked={changesOnly()}
                  onClick={() => setChangesOnly((v) => !v)}
                  class={[
                    "relative inline-flex w-8 h-4 border transition-colors",
                    changesOnly()
                      ? "bg-dusk-amber border-dusk-amber"
                      : "bg-dusk-bg border-dusk-border",
                  ].join(" ")}
                >
                  <span
                    class={[
                      "absolute top-0.5 w-3 h-3 bg-dusk-bg transition-transform",
                      changesOnly() ? "translate-x-3.5" : "translate-x-0.5",
                    ].join(" ")}
                  />
                </button>
                <span class="font-mono text-xs text-dusk-muted">Changes only</span>
              </label>
            </div>
          </div>

          {/* Diff table */}
          <div ref={diffPanelRef} class="flex-1 min-h-0 overflow-auto font-mono text-xs">
            <Show
              when={diffData()}
              fallback={
                <div class="flex items-center justify-center h-full font-mono text-xs text-dusk-subtle">
                  Start typing to compare.
                </div>
              }
            >
              <Show
                when={filteredRows().length > 0}
                fallback={
                  <div class="flex items-center justify-center h-full font-mono text-xs text-dusk-subtle">
                    No differences found.
                  </div>
                }
              >
                <table class="diff-table">
                  <colgroup>
                    <col class="col-linenum" />
                    <col class="col-content" />
                    <col class="col-linenum" />
                    <col class="col-content" />
                  </colgroup>
                  <tbody>
                    {filteredRows().map((row, i) => {
                      const isRemoved = row.type === "removed" || row.type === "changed";
                      const isAdded = row.type === "added" || row.type === "changed";
                      return (
                        <tr class="diff-row" data-row={i}>
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
                            {row.left !== null && (
                              <>
                                {isRemoved && (
                                  <span class="diff-marker diff-marker--removed" aria-hidden="true">
                                    -
                                  </span>
                                )}
                                {row.left}
                              </>
                            )}
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
                            {row.right !== null && (
                              <>
                                {isAdded && (
                                  <span class="diff-marker diff-marker--added" aria-hidden="true">
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
              </Show>
            </Show>
          </div>
        </div>

        {/* Right editor */}
        <div class="flex flex-1 min-w-0 flex-col">
          <EditorPanel
            label="Modified"
            value={rightContent()}
            language={rightLang()}
            onValueChange={setRightContent}
            onLanguageChange={setRightLang}
            panelId="right"
          />
        </div>
      </div>
    </div>
  );
}
