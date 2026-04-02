import {
  batch,
  createEffect,
  createMemo,
  createSignal,
  For,
  onCleanup,
  onMount,
  Show,
} from "solid-js";

import {
  createDiffRows,
  filterRowsWithContext,
  getChangeSourceIndices,
  getDiffStats,
} from "@/lib/diff";
import { DEFAULT_IMPORT_MAX_BYTES, formatBytes, readImportedFile } from "@/lib/fileImport";
import { type Language, SUPPORTED_LANGUAGES } from "@/lib/language";
import { detectLanguage } from "@/lib/languageDetection";
import { clearSessionState, loadSessionState, saveSessionState } from "@/lib/session";
import { prepareStructuredCompare } from "@/lib/structuredCompare";
import {
  DIFF_SESSION_STORAGE_KEY,
  DIFF_SESSION_VERSION,
  type DiffFileMeta,
  isDiffSessionState,
  shouldPersistDiffSession,
} from "@/tools/diff/diffSession";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 400;
const DIFF_CONTEXT = 3;

const LANGUAGE_LABELS: Record<Language, string> = {
  text: "Text",
  json: "JSON",
  toml: "TOML",
  yaml: "YAML",
  env: ".env",
  ini: "INI",
  javascript: "JavaScript",
  typescript: "TypeScript",
  python: "Python",
  markdown: "Markdown",
  xml: "XML",
  html: "HTML",
  shell: "Shell",
  dockerfile: "Dockerfile",
};

const STRATEGY_LABELS: Record<string, string> = {
  json: "Normalized JSON",
  toml: "Normalized TOML",
  yaml: "Normalized YAML",
  env: "Normalized .env",
  text: "Text",
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface InputPanelProps {
  label: string;
  content: string;
  lang: Language;
  fileMeta: DiffFileMeta | null;
  onContentChange: (v: string) => void;
  onLangChange: (v: Language) => void;
  fileInputRef: (el: HTMLInputElement) => void;
  onFileLoad: (file: File) => void;
}

function InputPanel(props: InputPanelProps) {
  const [dragging, setDragging] = createSignal(false);

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    setDragging(true);
  }

  function handleDragLeave(e: DragEvent) {
    // Only clear when leaving the panel itself, not a child
    const related = e.relatedTarget as Node | null;
    const target = e.currentTarget as HTMLElement;
    if (!related || !target.contains(related)) {
      setDragging(false);
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files[0];
    if (file) props.onFileLoad(file);
  }

  let hiddenInput!: HTMLInputElement;

  function handleFileChange(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    if (file) props.onFileLoad(file);
    // Reset so same file can be re-opened
    (e.currentTarget as HTMLInputElement).value = "";
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        flex: "1 1 0",
        "min-width": "0",
        display: "flex",
        "flex-direction": "column",
        position: "relative",
        border: dragging() ? "2px dashed var(--accent-primary)" : "2px solid transparent",
        "border-radius": "0.5rem",
        transition: "border-color 0.15s",
      }}
    >
      {/* Drop overlay */}
      <Show when={dragging()}>
        <div
          style={{
            position: "absolute",
            inset: "0",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            background: "color-mix(in srgb, var(--accent-primary) 10%, transparent)",
            "border-radius": "0.4rem",
            "z-index": "10",
            "pointer-events": "none",
            "font-size": "1rem",
            "font-weight": "600",
            color: "var(--accent-primary)",
          }}
        >
          Drop file here
        </div>
      </Show>

      {/* Panel container */}
      <div
        style={{
          display: "flex",
          "flex-direction": "column",
          height: "100%",
          background: "var(--bg-secondary)",
          border: "1px solid var(--border)",
          "border-radius": "0.5rem",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            "align-items": "center",
            gap: "0.5rem",
            padding: "0.5rem 0.75rem",
            "border-bottom": "1px solid var(--border)",
            "flex-shrink": "0",
          }}
        >
          <span
            style={{
              "font-size": "0.75rem",
              "font-weight": "600",
              "letter-spacing": "0.06em",
              "text-transform": "uppercase",
              color: "var(--text-secondary)",
              "flex-shrink": "0",
            }}
          >
            {props.label}
          </span>

          <select
            value={props.lang}
            onChange={(e) => props.onLangChange(e.currentTarget.value as Language)}
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-primary)",
              border: "1px solid var(--border)",
              "border-radius": "0.25rem",
              padding: "0.2rem 0.4rem",
              "font-size": "0.75rem",
              cursor: "pointer",
              "margin-left": "auto",
            }}
          >
            <For each={SUPPORTED_LANGUAGES}>
              {(l) => <option value={l}>{LANGUAGE_LABELS[l]}</option>}
            </For>
          </select>

          <button
            onClick={() => hiddenInput.click()}
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              "border-radius": "0.25rem",
              padding: "0.2rem 0.5rem",
              "font-size": "0.75rem",
              cursor: "pointer",
              "flex-shrink": "0",
              "white-space": "nowrap",
            }}
          >
            Open file
          </button>

          <input
            ref={(el) => {
              hiddenInput = el;
              props.fileInputRef(el);
            }}
            type="file"
            style={{ display: "none" }}
            onChange={handleFileChange}
          />
        </div>

        <Show when={props.fileMeta}>
          {(fileMeta) => (
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                padding: "0.35rem 0.75rem",
                "border-bottom": "1px solid var(--border)",
                background: "color-mix(in srgb, var(--bg-tertiary) 70%, transparent)",
                color: "var(--text-muted)",
                "font-size": "0.75rem",
                "font-family": "var(--font-mono)",
              }}
            >
              <span>{fileMeta().name}</span>
              <span>{formatBytes(fileMeta().size)}</span>
            </div>
          )}
        </Show>

        {/* Textarea */}
        <textarea
          value={props.content}
          onInput={(e) => props.onContentChange(e.currentTarget.value)}
          placeholder={`Paste ${props.label.toLowerCase()} text here, or drop a file...`}
          spellcheck={false}
          autocomplete="off"
          style={{
            flex: "1 1 0",
            width: "100%",
            padding: "0.75rem",
            background: "transparent",
            color: "var(--text-primary)",
            border: "none",
            outline: "none",
            "font-family": "var(--font-mono)",
            "font-size": "0.8125rem",
            "line-height": "1.6",
            resize: "vertical",
            "min-height": "280px",
            "box-sizing": "border-box",
            "tab-size": "2",
          }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DiffTool() {
  // --- State signals --------------------------------------------------------
  const [leftContent, setLeftContent] = createSignal("");
  const [rightContent, setRightContent] = createSignal("");
  const [leftLang, setLeftLang] = createSignal<Language>("text");
  const [rightLang, setRightLang] = createSignal<Language>("text");
  const [changesOnly, setChangesOnly] = createSignal(true);
  const [pending, setPending] = createSignal(false);
  const [currentChangeIdx, setCurrentChangeIdx] = createSignal(0);
  const [fileError, setFileError] = createSignal<string | null>(null);
  const [fileNotice, setFileNotice] = createSignal<string | null>(null);
  const [leftFile, setLeftFile] = createSignal<DiffFileMeta | null>(null);
  const [rightFile, setRightFile] = createSignal<DiffFileMeta | null>(null);

  // diffData holds the committed snapshot used for computing the diff
  const [diffData, setDiffData] = createSignal<{
    original: string;
    modified: string;
    leftLang: Language;
    rightLang: Language;
  } | null>(null);

  // --- Debounced diff trigger -----------------------------------------------
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    const savedSession = loadSessionState({
      key: DIFF_SESSION_STORAGE_KEY,
      version: DIFF_SESSION_VERSION,
      isData: isDiffSessionState,
    });

    if (!savedSession) {
      return;
    }

    batch(() => {
      setLeftContent(savedSession.leftContent);
      setRightContent(savedSession.rightContent);
      setLeftLang(savedSession.leftLang);
      setRightLang(savedSession.rightLang);
      setChangesOnly(savedSession.changesOnly);
      setLeftFile(savedSession.leftFile);
      setRightFile(savedSession.rightFile);
    });
  });

  createEffect(() => {
    // Access reactive dependencies
    const left = leftContent();
    const right = rightContent();
    const ll = leftLang();
    const rl = rightLang();

    if (debounceTimer !== null) clearTimeout(debounceTimer);

    if (left === "" && right === "") {
      setPending(false);
      setDiffData(null);
      return;
    }

    setPending(true);
    debounceTimer = setTimeout(() => {
      batch(() => {
        setDiffData({ original: left, modified: right, leftLang: ll, rightLang: rl });
        setPending(false);
        setCurrentChangeIdx(0);
      });
    }, DEBOUNCE_MS);
  });

  createEffect(() => {
    const sessionState = {
      leftContent: leftContent(),
      rightContent: rightContent(),
      leftLang: leftLang(),
      rightLang: rightLang(),
      changesOnly: changesOnly(),
      leftFile: leftFile(),
      rightFile: rightFile(),
    };

    if (
      sessionState.leftContent === "" &&
      sessionState.rightContent === "" &&
      sessionState.leftFile === null &&
      sessionState.rightFile === null
    ) {
      clearSessionState(DIFF_SESSION_STORAGE_KEY);
      return;
    }

    if (!shouldPersistDiffSession(sessionState)) {
      clearSessionState(DIFF_SESSION_STORAGE_KEY);
      return;
    }

    saveSessionState({
      key: DIFF_SESSION_STORAGE_KEY,
      version: DIFF_SESSION_VERSION,
      data: sessionState,
    });
  });

  onCleanup(() => {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
  });

  // --- Memos ----------------------------------------------------------------
  const preparedCompare = createMemo(() => {
    const data = diffData();
    if (!data) return null;
    return prepareStructuredCompare({
      original: data.original,
      modified: data.modified,
      leftLanguage: data.leftLang,
      rightLanguage: data.rightLang,
    });
  });

  const rows = createMemo(() => {
    const compare = preparedCompare();
    if (!compare) return [];
    return createDiffRows(compare.original, compare.modified);
  });

  const filteredRows = createMemo(() => filterRowsWithContext(rows(), changesOnly(), DIFF_CONTEXT));

  const stats = createMemo(() => getDiffStats(rows()));

  const changeIndices = createMemo(() => getChangeSourceIndices(rows()));

  const strategy = createMemo(() => preparedCompare()?.strategy ?? "text");

  const structuredErrors = createMemo(() => preparedCompare()?.errors ?? []);

  const isEmpty = createMemo(() => leftContent() === "" && rightContent() === "");

  const isIdentical = createMemo(
    () => diffData() !== null && !pending() && stats().added === 0 && stats().removed === 0
  );

  // --- File handling --------------------------------------------------------
  async function handleFileLoad(side: "left" | "right", file: File) {
    setFileError(null);
    setFileNotice(null);

    const result = await readImportedFile(file, { as: "text" });

    if (!result.ok) {
      if (result.error.code === "file-too-large") {
        setFileError(
          `${file.name} is too large to open here. Maximum supported size is ${formatBytes(result.error.maxBytes)}.`
        );
      } else {
        setFileError(`${file.name} could not be read. ${result.error.message}.`);
      }
      return;
    }

    if (result.decision.status === "warn") {
      setFileNotice(
        `${file.name} is ${formatBytes(result.file.size)}. Large files may take longer to compare.`
      );
    }

    const lang = detectLanguage({ filename: file.name, content: result.value });
    if (side === "left") {
      batch(() => {
        setLeftContent(result.value);
        setLeftLang(lang);
        setLeftFile(result.file);
      });
    } else {
      batch(() => {
        setRightContent(result.value);
        setRightLang(lang);
        setRightFile(result.file);
      });
    }
  }

  // --- Next change navigation -----------------------------------------------
  function scrollToChange(idx: number) {
    const indices = changeIndices();
    if (indices.length === 0) return;
    const clamped = ((idx % indices.length) + indices.length) % indices.length;
    setCurrentChangeIdx(clamped);
    const sourceRow = indices[clamped];
    const el = document.querySelector(`[data-source-row="${sourceRow}"]`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function handleNextChange() {
    scrollToChange(currentChangeIdx() + 1);
  }

  // --- Swap -----------------------------------------------------------------
  function handleSwap() {
    batch(() => {
      const lc = leftContent();
      const rc = rightContent();
      const ll = leftLang();
      const rl = rightLang();
      const lf = leftFile();
      const rf = rightFile();
      setLeftContent(rc);
      setRightContent(lc);
      setLeftLang(rl);
      setRightLang(ll);
      setLeftFile(rf);
      setRightFile(lf);
    });
  }

  // --- Diff row styling helpers ---------------------------------------------
  function leftCellStyle(type: string): string {
    if (type === "removed") {
      return "background: color-mix(in srgb, var(--accent-error) 18%, transparent);";
    }
    if (type === "changed") {
      return "background: color-mix(in srgb, var(--accent-error) 12%, transparent);";
    }
    return "";
  }

  function rightCellStyle(type: string): string {
    if (type === "added") {
      return "background: color-mix(in srgb, var(--accent-success) 18%, transparent);";
    }
    if (type === "changed") {
      return "background: color-mix(in srgb, var(--accent-success) 12%, transparent);";
    }
    return "";
  }

  function lineNumStyle(type: string, side: "left" | "right"): string {
    const base =
      "user-select: none; text-align: right; padding: 0 0.5rem; min-width: 2.5rem; color: var(--text-muted); font-variant-numeric: tabular-nums; border-right: 1px solid var(--border); font-size: 0.75rem;";
    if (side === "left") return base + leftCellStyle(type);
    return base + rightCellStyle(type);
  }

  function contentCellStyle(type: string, side: "left" | "right"): string {
    const base =
      "padding: 0 0.75rem; white-space: pre; font-family: var(--font-mono); font-size: 0.8125rem; overflow: visible; width: 50%;";
    if (side === "left") return base + leftCellStyle(type);
    return base + rightCellStyle(type);
  }

  // Separator rows between context groups
  function isSeparator(sourceIndex: number, prevSourceIndex: number | undefined): boolean {
    if (!changesOnly()) return false;
    if (prevSourceIndex === undefined) return false;
    return sourceIndex > prevSourceIndex + 1;
  }

  // ---------------------------------------------------------------------------
  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "1rem",
        padding: "1.25rem 1.5rem",
        "font-family": "var(--font-sans)",
        width: "100%",
        "box-sizing": "border-box",
      }}
    >
      {/* -------------------------------------------------------------------- */}
      {/* Input panels (two columns)                                           */}
      {/* -------------------------------------------------------------------- */}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          "align-items": "stretch",
        }}
      >
        <InputPanel
          label="Original"
          content={leftContent()}
          lang={leftLang()}
          fileMeta={leftFile()}
          onContentChange={setLeftContent}
          onLangChange={setLeftLang}
          fileInputRef={(_el) => {}}
          onFileLoad={(file) => void handleFileLoad("left", file)}
        />
        <InputPanel
          label="Modified"
          content={rightContent()}
          lang={rightLang()}
          fileMeta={rightFile()}
          onContentChange={setRightContent}
          onLangChange={setRightLang}
          fileInputRef={(_el) => {}}
          onFileLoad={(file) => void handleFileLoad("right", file)}
        />
      </div>

      {/* -------------------------------------------------------------------- */}
      {/* Empty state                                                          */}
      {/* -------------------------------------------------------------------- */}
      <Show when={isEmpty()}>
        <div
          style={{
            "text-align": "center",
            color: "var(--text-muted)",
            "font-size": "0.9rem",
            padding: "2rem 1rem",
          }}
        >
          Paste two texts to compare, or open files with the buttons above.
        </div>
      </Show>

      <Show when={fileError()}>
        <div
          role="alert"
          style={{
            padding: "0.6rem 0.875rem",
            "border-radius": "0.375rem",
            border: "1px solid var(--accent-error)",
            background: "color-mix(in srgb, var(--accent-error) 10%, transparent)",
            color: "var(--accent-error)",
            "font-size": "0.8125rem",
          }}
        >
          {fileError()}
        </div>
      </Show>

      <Show when={fileNotice()}>
        <div
          style={{
            padding: "0.6rem 0.875rem",
            "border-radius": "0.375rem",
            border: "1px solid color-mix(in srgb, var(--accent-warning) 60%, transparent)",
            background: "color-mix(in srgb, var(--accent-warning) 10%, transparent)",
            color: "var(--accent-warning)",
            "font-size": "0.8125rem",
          }}
        >
          {fileNotice()}
        </div>
      </Show>

      {/* -------------------------------------------------------------------- */}
      {/* Toolbar (only when there's data or pending)                          */}
      {/* -------------------------------------------------------------------- */}
      <Show when={!isEmpty()}>
        <div
          style={{
            display: "flex",
            "flex-wrap": "wrap",
            "align-items": "center",
            gap: "0.5rem",
            padding: "0.625rem 0.875rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            "border-radius": "0.5rem",
          }}
        >
          {/* Strategy badge */}
          <span
            style={{
              "font-size": "0.7rem",
              "font-weight": "600",
              "letter-spacing": "0.07em",
              "text-transform": "uppercase",
              color: "var(--accent-primary)",
              background: "color-mix(in srgb, var(--accent-primary) 12%, transparent)",
              border: "1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent)",
              "border-radius": "0.25rem",
              padding: "0.2rem 0.5rem",
            }}
          >
            {STRATEGY_LABELS[strategy()] ?? "Text"}
          </span>

          {/* Pending spinner */}
          <Show when={pending()}>
            <span
              style={{
                "font-size": "0.8rem",
                color: "var(--text-muted)",
                "font-style": "italic",
              }}
            >
              Comparing...
            </span>
          </Show>

          {/* Identical label */}
          <Show when={isIdentical()}>
            <span
              style={{
                "font-size": "0.8rem",
                "font-weight": "500",
                color: "var(--accent-success)",
              }}
            >
              Identical
            </span>
          </Show>

          {/* Stats: +N / -N */}
          <Show when={!pending() && !isIdentical() && diffData() !== null}>
            <span
              style={{
                "font-size": "0.8rem",
                "font-weight": "600",
                color: "var(--accent-success)",
              }}
            >
              +{stats().added}
            </span>
            <span
              style={{
                "font-size": "0.8rem",
                "font-weight": "600",
                color: "var(--accent-error)",
              }}
            >
              -{stats().removed}
            </span>
          </Show>

          {/* Spacer */}
          <div style={{ flex: "1 1 0" }} />

          {/* Changes only toggle */}
          <label
            style={{
              display: "flex",
              "align-items": "center",
              gap: "0.35rem",
              cursor: "pointer",
              "font-size": "0.8rem",
              color: "var(--text-secondary)",
              "user-select": "none",
            }}
          >
            <input
              type="checkbox"
              checked={changesOnly()}
              onChange={(e) => setChangesOnly(e.currentTarget.checked)}
              style={{ cursor: "pointer", "accent-color": "var(--accent-primary)" }}
            />
            Changes only
          </label>

          {/* Next change button */}
          <Show when={changeIndices().length > 0}>
            <button
              onClick={handleNextChange}
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border)",
                "border-radius": "0.25rem",
                padding: "0.25rem 0.6rem",
                "font-size": "0.78rem",
                cursor: "pointer",
                "white-space": "nowrap",
              }}
              title="Jump to next change"
            >
              ↓ Next change
            </button>
          </Show>

          {/* Swap button */}
          <button
            onClick={handleSwap}
            style={{
              background: "var(--bg-tertiary)",
              color: "var(--text-secondary)",
              border: "1px solid var(--border)",
              "border-radius": "0.25rem",
              padding: "0.25rem 0.6rem",
              "font-size": "0.78rem",
              cursor: "pointer",
              "white-space": "nowrap",
            }}
            title="Swap left and right"
          >
            ⇅ Swap
          </button>

          <span
            style={{
              "font-size": "0.75rem",
              color: "var(--text-muted)",
            }}
          >
            File limit {formatBytes(DEFAULT_IMPORT_MAX_BYTES)}
          </span>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Error banners from structured normalization                        */}
        {/* ------------------------------------------------------------------ */}
        <Show when={structuredErrors().length > 0}>
          <div
            style={{
              display: "flex",
              "flex-direction": "column",
              gap: "0.375rem",
            }}
          >
            <For each={structuredErrors()}>
              {(err) => (
                <div
                  role="alert"
                  style={{
                    padding: "0.6rem 0.875rem",
                    "border-radius": "0.375rem",
                    border: "1px solid var(--accent-error)",
                    background: "color-mix(in srgb, var(--accent-error) 10%, transparent)",
                    color: "var(--accent-error)",
                    "font-size": "0.8125rem",
                  }}
                >
                  <strong style={{ "text-transform": "capitalize" }}>{err.side}</strong>:{" "}
                  {err.message} — falling back to text diff.
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* ------------------------------------------------------------------ */}
        {/* Diff output table                                                  */}
        {/* ------------------------------------------------------------------ */}
        <Show when={!pending() && diffData() !== null && filteredRows().length > 0}>
          <div
            style={{
              "overflow-x": "auto",
              border: "1px solid var(--border)",
              "border-radius": "0.5rem",
              background: "var(--bg-secondary)",
            }}
          >
            <table
              style={{
                width: "100%",
                "border-collapse": "collapse",
                "table-layout": "fixed",
                "font-size": "0.8125rem",
                "line-height": "1.5",
              }}
            >
              <colgroup>
                <col style={{ width: "2.75rem" }} />
                <col style={{ width: "50%" }} />
                <col style={{ width: "2.75rem" }} />
                <col style={{ width: "50%" }} />
              </colgroup>
              <tbody>
                <For each={filteredRows()}>
                  {(indexedRow, i) => {
                    const { row, sourceIndex } = indexedRow;
                    const prevSourceIndex =
                      i() > 0 ? filteredRows()[i() - 1]?.sourceIndex : undefined;
                    const showSeparator = isSeparator(sourceIndex, prevSourceIndex);

                    return (
                      <>
                        <Show when={showSeparator}>
                          <tr>
                            <td
                              colspan={4}
                              style={{
                                padding: "0.15rem 0.75rem",
                                background: "var(--bg-primary)",
                                color: "var(--text-muted)",
                                "font-size": "0.7rem",
                                "font-family": "var(--font-mono)",
                                "letter-spacing": "0.05em",
                                "border-top": "1px solid var(--border)",
                                "border-bottom": "1px solid var(--border)",
                              }}
                            >
                              · · ·
                            </td>
                          </tr>
                        </Show>
                        <tr
                          data-source-row={sourceIndex}
                          style={{
                            "border-top":
                              showSeparator || i() === 0
                                ? "none"
                                : "1px solid color-mix(in srgb, var(--border) 50%, transparent)",
                          }}
                        >
                          {/* Left line number */}
                          <td style={lineNumStyle(row.type, "left")}>
                            <Show when={row.leftLineNum !== null}>{row.leftLineNum}</Show>
                          </td>
                          {/* Left content */}
                          <td style={contentCellStyle(row.type, "left")}>
                            <Show when={row.left !== null}>{row.left}</Show>
                          </td>
                          {/* Right line number */}
                          <td
                            style={
                              lineNumStyle(row.type, "right") +
                              " border-left: 1px solid var(--border);"
                            }
                          >
                            <Show when={row.rightLineNum !== null}>{row.rightLineNum}</Show>
                          </td>
                          {/* Right content */}
                          <td style={contentCellStyle(row.type, "right")}>
                            <Show when={row.right !== null}>{row.right}</Show>
                          </td>
                        </tr>
                      </>
                    );
                  }}
                </For>
              </tbody>
            </table>
          </div>
        </Show>

        {/* No changes in "changes only" mode but diffs exist */}
        <Show
          when={
            !pending() &&
            diffData() !== null &&
            filteredRows().length === 0 &&
            changesOnly() &&
            !isIdentical()
          }
        >
          <div
            style={{
              "text-align": "center",
              color: "var(--text-muted)",
              "font-size": "0.875rem",
              padding: "1.5rem",
            }}
          >
            No changes to display with current context settings.
          </div>
        </Show>
      </Show>
    </div>
  );
}
