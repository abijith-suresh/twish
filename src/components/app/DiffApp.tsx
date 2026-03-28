import { createEffect, createMemo, createSignal, For, onCleanup, onMount, Show } from "solid-js";
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

const STORAGE_KEYS = {
  leftContent: "twish:left-content",
  rightContent: "twish:right-content",
  leftLang: "twish:left-lang",
  rightLang: "twish:right-lang",
  changesOnly: "twish:changes-only",
} as const;

function safeLocalStorageGet(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore storage errors (private browsing, quota exceeded, etc.)
  }
}

function safeLocalStorageRemove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function sanitizeErrorMessage(message: string): string {
  if (message.includes("Unexpected token")) return "Invalid syntax: check your file format";
  if (message.includes("YAMLException")) return "Invalid YAML syntax";
  return "Could not parse file — falling back to text diff";
}

export default function DiffApp() {
  const [leftContent, setLeftContent] = createSignal(
    safeLocalStorageGet(STORAGE_KEYS.leftContent) ?? ""
  );
  const [rightContent, setRightContent] = createSignal(
    safeLocalStorageGet(STORAGE_KEYS.rightContent) ?? ""
  );
  const [leftLang, setLeftLang] = createSignal<Language>(
    (safeLocalStorageGet(STORAGE_KEYS.leftLang) as Language | null) ?? "text"
  );
  const [rightLang, setRightLang] = createSignal<Language>(
    (safeLocalStorageGet(STORAGE_KEYS.rightLang) as Language | null) ?? "text"
  );
  const [diffData, setDiffData] = createSignal<{ original: string; modified: string } | null>(null);
  const [changesOnly, setChangesOnly] = createSignal(
    safeLocalStorageGet(STORAGE_KEYS.changesOnly) === "false" ? false : true
  );
  const [pending, setPending] = createSignal(false);
  const [focusedPanel, setFocusedPanel] = createSignal<"left" | "right">("left");
  const [leftFileName, setLeftFileName] = createSignal<string | null>(null);
  const [rightFileName, setRightFileName] = createSignal<string | null>(null);

  // Persisted setters
  function handleLeftContent(val: string) {
    setLeftContent(val);
    safeLocalStorageSet(STORAGE_KEYS.leftContent, val);
  }
  function handleRightContent(val: string) {
    setRightContent(val);
    safeLocalStorageSet(STORAGE_KEYS.rightContent, val);
  }
  function handleLeftLang(lang: Language) {
    setLeftLang(lang);
    safeLocalStorageSet(STORAGE_KEYS.leftLang, lang);
  }
  function handleRightLang(lang: Language) {
    setRightLang(lang);
    safeLocalStorageSet(STORAGE_KEYS.rightLang, lang);
  }

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

  // Update document title when filenames change
  createEffect(() => {
    const left = leftFileName();
    const right = rightFileName();
    if (left && right) {
      document.title = `${left} vs ${right} — twish`;
    } else if (left ?? right) {
      document.title = `${left ?? right} — twish`;
    } else {
      document.title = "twish — local config compare";
    }
  });

  function handleSwap() {
    const prevLeft = leftContent();
    const prevRight = rightContent();
    const prevLeftLang = leftLang();
    const prevRightLang = rightLang();
    handleLeftContent(prevRight);
    handleRightContent(prevLeft);
    handleLeftLang(prevRightLang);
    handleRightLang(prevLeftLang);
    // Swap filenames too
    const prevLeftName = leftFileName();
    const prevRightName = rightFileName();
    setLeftFileName(prevRightName);
    setRightFileName(prevLeftName);
  }

  function handleClear() {
    if (!window.confirm("Clear both editors? This cannot be undone.")) return;
    handleLeftContent("");
    handleRightContent("");
    setLeftFileName(null);
    setRightFileName(null);
    setDiffData(null);
    setPending(false);
    // Also clear persisted storage
    safeLocalStorageRemove(STORAGE_KEYS.leftContent);
    safeLocalStorageRemove(STORAGE_KEYS.rightContent);
    safeLocalStorageRemove(STORAGE_KEYS.leftLang);
    safeLocalStorageRemove(STORAGE_KEYS.rightLang);
    setLeftLang("text");
    setRightLang("text");
    safeLocalStorageRemove(STORAGE_KEYS.changesOnly);
    setChangesOnly(true);
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

    // Warn before unload if editors have content
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (leftContent() || rightContent()) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    onCleanup(() => window.removeEventListener("beforeunload", handleBeforeUnload));
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

  const changeCount = createMemo(() => {
    return rows().filter((r) => r.type === "added" || r.type === "removed" || r.type === "changed")
      .length;
  });

  function handleChangesOnly(val: boolean) {
    safeLocalStorageSet(STORAGE_KEYS.changesOnly, String(val));
    setChangesOnly(val);
  }

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

  const strategy = createMemo(() => preparedCompare()?.strategy);

  return (
    <div class="flex flex-col h-full overflow-hidden bg-cat-bg">
      {/* Word-diff inline styles */}
      <style>{`
        .diff-word-removed { background: rgba(243,139,168,0.35); border-radius: 2px; }
        .diff-word-added  { background: rgba(166,227,161,0.35); border-radius: 2px; }
      `}</style>

      {/* Toolbar */}
      <div class="flex items-center gap-3 flex-shrink-0 px-4 py-2 bg-cat-surface0 border-b border-cat-surface1">
        <span class="font-mono text-xs text-cat-blue font-semibold tracking-widest uppercase">
          Live diff
        </span>

        <Show when={pending()}>
          <span
            role="status"
            aria-live="polite"
            class="text-xs text-cat-subtext0 flex items-center gap-1"
          >
            <span class="animate-spin inline-block">↻</span> updating…
          </span>
        </Show>

        <div class="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={handleSwap}
            class="btn-secondary text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cat-blue focus-visible:ring-offset-1 focus-visible:ring-offset-cat-base"
          >
            Swap ⇄
          </button>
          <button
            type="button"
            onClick={handleClear}
            class="btn-secondary text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cat-blue focus-visible:ring-offset-1 focus-visible:ring-offset-cat-base"
          >
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
            onValueChange={handleLeftContent}
            onLanguageChange={handleLeftLang}
            panelId="left"
            onFocus={() => setFocusedPanel("left")}
            focused={focusedPanel() === "left"}
            onRegisterOpenFile={(fn) => {
              openLeftFile = fn;
            }}
            onFileOpen={(name) => setLeftFileName(name)}
          />
        </div>

        {/* Center diff panel */}
        <div class="flex flex-col border-r border-cat-surface1 min-w-[300px]" style="flex: 1.2;">
          {/* Diff panel header */}
          <div class="flex items-center gap-3 flex-shrink-0 px-3 py-2 bg-cat-surface0 border-b border-cat-surface1">
            <span class="font-mono text-xs text-cat-subtext0 uppercase tracking-widest">Diff</span>
            <Show when={strategy() === "json" || strategy() === "yaml" || strategy() === "env"}>
              <span
                class="font-mono text-xs text-cat-blue cursor-help"
                title="Keys are sorted and whitespace normalized before comparing — small formatting differences won't show as changes"
              >
                Normalized {strategy()}
              </span>
            </Show>
            <Show when={diffData() && (stats().added > 0 || stats().removed > 0)}>
              <span class="font-mono text-xs text-cat-green">+{stats().added}</span>
              <span class="font-mono text-xs text-cat-red">-{stats().removed}</span>
            </Show>
            <Show when={diffData() && stats().added === 0 && stats().removed === 0}>
              <span class="font-mono text-xs text-cat-overlay0">Identical</span>
            </Show>
            <div class="ml-auto flex items-center gap-2">
              <Show when={changeCount() > 0}>
                <span class="text-xs text-cat-subtext0">
                  {changeCount()} {changeCount() === 1 ? "change" : "changes"}
                </span>
              </Show>
              <button
                type="button"
                onClick={jumpToNextChange}
                disabled={changeCount() === 0}
                class="btn-secondary text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cat-blue focus-visible:ring-offset-1 focus-visible:ring-offset-cat-base disabled:opacity-40 disabled:cursor-not-allowed"
                title="Jump to next change"
              >
                ↓ Next
              </button>
              {/* Changes only toggle */}
              <div class="flex items-center gap-1.5 select-none">
                <button
                  type="button"
                  role="switch"
                  aria-checked={changesOnly()}
                  aria-labelledby="changes-only-label"
                  onClick={() => handleChangesOnly(!changesOnly())}
                  class={[
                    "relative inline-flex w-8 h-4 border transition-colors cursor-pointer",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cat-blue focus-visible:ring-offset-2 focus-visible:ring-offset-cat-base",
                    changesOnly()
                      ? "bg-cat-blue border-cat-blue"
                      : "bg-cat-surface1 border-cat-surface1",
                  ].join(" ")}
                >
                  <span
                    class={[
                      "absolute top-0.5 w-3 h-3 bg-white transition-transform",
                      changesOnly() ? "translate-x-3.5" : "translate-x-0.5",
                    ].join(" ")}
                  />
                </button>
                <span
                  id="changes-only-label"
                  class="font-mono text-xs text-cat-subtext0 cursor-pointer"
                  onClick={() => handleChangesOnly(!changesOnly())}
                >
                  Changes only
                </span>
              </div>
            </div>
          </div>

          {/* Diff table */}
          <div ref={diffPanelRef} class="flex-1 min-h-0 overflow-auto font-mono text-xs">
            <Show when={(preparedCompare()?.errors.length ?? 0) > 0}>
              <div
                role="alert"
                aria-live="assertive"
                class="border-b border-cat-surface1 bg-cat-surface0 border-l-4 border-l-cat-red px-3 py-2 flex items-start gap-2 transition-all"
              >
                <span class="text-cat-red text-sm flex-shrink-0" aria-hidden="true">
                  ⚠
                </span>
                <div class="text-cat-red text-xs">
                  <For each={preparedCompare()?.errors ?? []}>
                    {(error) => (
                      <p>
                        {error.side}: {sanitizeErrorMessage(error.message)}
                      </p>
                    )}
                  </For>
                </div>
              </div>
            </Show>
            <Show
              when={diffData()}
              fallback={
                <div class="flex items-center justify-center h-full">
                  <div class="flex flex-col items-center justify-center gap-4 text-center p-8">
                    <div class="text-cat-overlay0 text-sm space-y-2">
                      <p class="text-cat-subtext0 font-medium font-sans">
                        No content to compare yet
                      </p>
                      <p class="font-sans">Paste text or code into either panel</p>
                      <p class="font-sans">— or —</p>
                      <p class="font-sans">Drag &amp; drop a file onto an editor</p>
                      <p class="mt-2 font-sans">
                        <kbd class="px-1.5 py-0.5 text-xs bg-cat-surface0 border border-cat-surface1 rounded font-mono">
                          Ctrl+O
                        </kbd>{" "}
                        to open a file into the{" "}
                        <span class="text-cat-blue">
                          {focusedPanel() === "right" ? "right" : "left"}
                        </span>{" "}
                        panel
                      </p>
                    </div>
                  </div>
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
                <table class="diff-table table-fixed w-full">
                  <colgroup>
                    <col class="col-linenum" />
                    <col class="col-content" />
                    <col class="col-linenum" />
                    <col class="col-content" />
                  </colgroup>
                  <tbody>
                    <For each={filteredRows()}>
                      {({ row, sourceIndex }, i) => {
                        // Separator row
                        if (row.type === "separator") {
                          return (
                            <tr class="hunk-separator">
                              <td
                                colspan="4"
                                class="text-center text-cat-overlay0 text-xs py-0.5 bg-cat-surface0 border-y border-cat-surface1"
                              >
                                ···
                              </td>
                            </tr>
                          );
                        }

                        const isRemoved = row.type === "removed" || row.type === "changed";
                        const isAdded = row.type === "added" || row.type === "changed";
                        return (
                          <tr class="diff-row" data-row={i()} data-source-row={sourceIndex}>
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
                                "diff-content overflow-hidden max-w-0",
                                isRemoved && row.left !== null ? "diff-content--removed" : "",
                                row.left === null ? "diff-cell--empty" : "",
                              ]
                                .join(" ")
                                .trim()}
                            >
                              {row.left !== null && (
                                <>
                                  {isRemoved && (
                                    <span
                                      class="diff-marker diff-marker--removed"
                                      aria-hidden="true"
                                    >
                                      -
                                    </span>
                                  )}
                                  {row.leftHtml ? <span innerHTML={row.leftHtml} /> : row.left}
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
                                "diff-content overflow-hidden max-w-0",
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
                                  {row.rightHtml ? <span innerHTML={row.rightHtml} /> : row.right}
                                </>
                              )}
                            </td>
                          </tr>
                        );
                      }}
                    </For>
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
            onValueChange={handleRightContent}
            onLanguageChange={handleRightLang}
            panelId="right"
            onFocus={() => setFocusedPanel("right")}
            focused={focusedPanel() === "right"}
            onRegisterOpenFile={(fn) => {
              openRightFile = fn;
            }}
            onFileOpen={(name) => setRightFileName(name)}
          />
        </div>
      </div>
    </div>
  );
}
