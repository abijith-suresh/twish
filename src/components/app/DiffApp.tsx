import { createEffect, createMemo, createSignal, onCleanup, onMount, Show } from "solid-js";
import {
  createDiffRows,
  DIFF_CONTEXT,
  type DiffRow,
  filterRowsWithContext,
  getChangeSourceIndices,
  getDiffStats,
} from "@/lib/diff";
import { type Language } from "@/lib/language";
import { prepareStructuredCompare } from "@/lib/structuredCompare";
import EditorPanel from "./EditorPanel";

export default function DiffApp() {
  const [leftContent, setLeftContent] = createSignal("");
  const [rightContent, setRightContent] = createSignal("");
  const [leftLang, setLeftLang] = createSignal<Language>("text");
  const [rightLang, setRightLang] = createSignal<Language>("text");
  const [diffData, setDiffData] = createSignal<{ original: string; modified: string } | null>(null);
  const [changesOnly, setChangesOnly] = createSignal(true);
  const [pending, setPending] = createSignal(false);
  const [focusedPanel, setFocusedPanel] = createSignal<"left" | "right">("left");

  let openLeftFile: (() => void) | undefined;
  let openRightFile: (() => void) | undefined;

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  createEffect(() => {
    const _left = leftContent();
    const _right = rightContent();

    if (_left.length === 0 && _right.length === 0) {
      if (debounceTimer !== undefined) clearTimeout(debounceTimer);
      setDiffData(null);
      setPending(false);
      return;
    }

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
      if (e.ctrlKey && !e.shiftKey && e.key === "o") {
        e.preventDefault();
        if (focusedPanel() === "right") {
          openRightFile?.();
        } else {
          openLeftFile?.();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    onCleanup(() => document.removeEventListener("keydown", handleKeyDown));
  });

  const preparedCompare = createMemo(() => {
    const d = diffData();
    if (!d) return null;

    return prepareStructuredCompare({
      original: d.original,
      modified: d.modified,
      leftLanguage: leftLang(),
      rightLanguage: rightLang(),
    });
  });

  const rows = createMemo((): DiffRow[] => {
    const prepared = preparedCompare();
    if (!prepared) return [];
    return createDiffRows(prepared.original, prepared.modified);
  });

  const filteredRows = createMemo(() => {
    return filterRowsWithContext(rows(), changesOnly(), DIFF_CONTEXT);
  });

  const stats = createMemo(() => {
    return getDiffStats(rows());
  });

  // eslint-disable-next-line no-unassigned-vars
  let diffPanelRef!: HTMLDivElement;
  let changeIndices: number[] = [];
  let currentChangeIdx = -1;

  createEffect(() => {
    changeIndices = getChangeSourceIndices(rows());
    currentChangeIdx = -1;
  });

  function jumpToNextChange() {
    if (changeIndices.length === 0) return;
    currentChangeIdx = (currentChangeIdx + 1) % changeIndices.length;
    const targetSourceIndex = changeIndices[currentChangeIdx];
    const row = diffPanelRef?.querySelector(`[data-source-row="${targetSourceIndex}"]`);
    row?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <div class="flex flex-col h-full overflow-hidden bg-cat-bg">
      {/* Toolbar */}
      <div class="flex items-center gap-3 flex-shrink-0 px-4 py-2 bg-cat-surface0 border-b border-cat-surface1">
        <span class="font-mono text-xs text-cat-blue font-semibold tracking-widest uppercase">
          Live diff
        </span>
        <span
          class="font-mono text-xs text-cat-overlay0 transition-opacity"
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
        <div class="flex flex-1 min-w-0 flex-col border-r border-cat-surface1">
          <EditorPanel
            label="Original"
            value={leftContent()}
            language={leftLang()}
            onValueChange={setLeftContent}
            onLanguageChange={setLeftLang}
            panelId="left"
            onFocus={() => setFocusedPanel("left")}
            onRegisterOpenFile={(fn) => {
              openLeftFile = fn;
            }}
          />
        </div>

        {/* Center diff panel */}
        <div class="flex flex-col border-r border-cat-surface1" style="flex: 1.2; min-width: 0;">
          {/* Diff panel header */}
          <div class="flex items-center gap-3 flex-shrink-0 px-3 py-2 bg-cat-surface0 border-b border-cat-surface1">
            <span class="font-mono text-xs text-cat-subtext0 uppercase tracking-widest">Diff</span>
            <Show when={preparedCompare()?.strategy === "json"}>
              <span class="font-mono text-xs text-cat-blue">Normalized JSON</span>
            </Show>
            <Show when={diffData() && (stats().added > 0 || stats().removed > 0)}>
              <span class="font-mono text-xs text-cat-green">+{stats().added}</span>
              <span class="font-mono text-xs text-cat-red">-{stats().removed}</span>
            </Show>
            <Show when={diffData() && stats().added === 0 && stats().removed === 0}>
              <span class="font-mono text-xs text-cat-overlay0">Identical</span>
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
                    changesOnly() ? "bg-cat-blue border-cat-blue" : "bg-cat-bg border-cat-surface1",
                  ].join(" ")}
                >
                  <span
                    class={[
                      "absolute top-0.5 w-3 h-3 bg-cat-bg transition-transform",
                      changesOnly() ? "translate-x-3.5" : "translate-x-0.5",
                    ].join(" ")}
                  />
                </button>
                <span class="font-mono text-xs text-cat-subtext0">Changes only</span>
              </label>
            </div>
          </div>

          {/* Diff table */}
          <div ref={diffPanelRef} class="flex-1 min-h-0 overflow-auto font-mono text-xs">
            <Show when={(preparedCompare()?.errors.length ?? 0) > 0}>
              <div class="border-b border-cat-surface1 bg-cat-bg px-3 py-2 font-mono text-[11px] text-cat-red">
                Falling back to raw text diff.{" "}
                {preparedCompare()
                  ?.errors.map((error) => `${error.side}: ${error.message}`)
                  .join(" | ")}
              </div>
            </Show>
            <Show
              when={diffData()}
              fallback={
                <div class="flex items-center justify-center h-full font-mono text-xs text-cat-overlay0">
                  Start typing to compare.
                </div>
              }
            >
              <Show
                when={filteredRows().length > 0}
                fallback={
                  <div class="flex items-center justify-center h-full font-mono text-xs text-cat-overlay0">
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
                    {filteredRows().map(({ row, sourceIndex }, i) => {
                      const isRemoved = row.type === "removed" || row.type === "changed";
                      const isAdded = row.type === "added" || row.type === "changed";
                      return (
                        <tr class="diff-row" data-row={i} data-source-row={sourceIndex}>
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
            onFocus={() => setFocusedPanel("right")}
            onRegisterOpenFile={(fn) => {
              openRightFile = fn;
            }}
          />
        </div>
      </div>
    </div>
  );
}
