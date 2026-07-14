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
import Card from "@/components/primitives/solid/Card";
import Label from "@/components/primitives/solid/Label";
import Select from "@/components/primitives/solid/Select";
import type { DiffAnalysisResult } from "@/lib/diffAnalysis";
import { createDiffAnalysisExecutor } from "@/lib/diffExecution";
import {
  DEFAULT_IMPORT_MAX_BYTES,
  formatBytes,
  type ImportedFileMeta,
  readImportedFile,
} from "@/lib/fileImport";
import { type Language, SUPPORTED_LANGUAGES } from "@/lib/language";
import { detectLanguage } from "@/lib/languageDetection";
import { DIFF_SESSION_STORAGE_KEY } from "@/lib/localPersistence";
import { clearSessionState, loadSessionState, saveSessionState } from "@/lib/session";
import {
  DEFAULT_DIFF_SESSION_STATE,
  DIFF_SESSION_VERSION,
  isDiffSessionState,
  shouldPersistDiffSession,
} from "@/tools/diff/diffSession";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEBOUNCE_MS = 400;
const DIFF_CONTEXT = 3;
const EMPTY_STATS = { added: 0, removed: 0 };

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
  fileMeta: ImportedFileMeta | null;
  onContentChange: (v: string) => void;
  onLangChange: (v: Language) => void;
  fileInputRef: (el: HTMLInputElement) => void;
  onFileLoad: (file: File) => void;
}

function InputPanel(props: InputPanelProps) {
  const [dragging, setDragging] = createSignal(false);

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (!dragging()) setDragging(true);
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
      role="none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      class="flex-1 min-w-0 flex flex-col relative rounded-lg transition-[border-color] duration-150"
      classList={{
        "border-2 border-dashed border-[var(--accent-primary)]": dragging(),
        "border-2 border-transparent": !dragging(),
      }}
    >
      {/* Drop overlay */}
      <Show when={dragging()}>
        <div class="absolute inset-0 flex items-center justify-center bg-[color-mix(in_srgb,var(--accent-primary)_10%,transparent)] rounded z-10 pointer-events-none text-base font-semibold text-[var(--accent-primary)]">
          Drop file here
        </div>
      </Show>

      {/* Panel container */}
      <Card class="flex flex-col h-full overflow-hidden p-0 rounded-lg">
        {/* Header */}
        <div class="flex items-center gap-2 px-3 py-2 border-b border-[var(--border)] shrink-0">
          <Label>{props.label}</Label>

          <Select
            value={props.lang}
            onChange={(v) => props.onLangChange(v as Language)}
            options={SUPPORTED_LANGUAGES.map((l) => ({ value: l, label: LANGUAGE_LABELS[l] }))}
            class="w-auto ml-auto"
          />

          <button
            type="button"
            onClick={() => hiddenInput.click()}
            class="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border)] rounded px-2 py-0.5 text-xs cursor-pointer shrink-0 whitespace-nowrap"
          >
            Open file
          </button>

          <input
            ref={(el) => {
              hiddenInput = el;
              props.fileInputRef(el);
            }}
            type="file"
            class="hidden"
            onChange={handleFileChange}
          />
        </div>

        <Show when={props.fileMeta}>
          {(fileMeta) => (
            <div class="flex gap-2 px-3 py-1.5 border-b border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-tertiary)_70%,transparent)] text-[var(--text-muted)] text-xs font-mono">
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
          class="flex-1 w-full p-3 bg-transparent text-[var(--text-primary)] font-mono text-sm leading-[1.6] resize-y min-h-[280px] outline-none tab-size-2"
        />
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function DiffTool() {
  const diffExecutor = createDiffAnalysisExecutor();

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
  const [leftFile, setLeftFile] = createSignal<ImportedFileMeta | null>(null);
  const [rightFile, setRightFile] = createSignal<ImportedFileMeta | null>(null);
  const [analysis, setAnalysis] = createSignal<DiffAnalysisResult | null>(null);

  // diffData holds the committed snapshot used for computing the diff
  const [diffData, setDiffData] = createSignal<{
    original: string;
    modified: string;
    leftLang: Language;
    rightLang: Language;
  } | null>(null);
  let latestAnalysisRun = 0;

  // --- Debounced diff trigger -----------------------------------------------
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  onMount(() => {
    const savedSession = loadSessionState({
      key: DIFF_SESSION_STORAGE_KEY,
      version: DIFF_SESSION_VERSION,
      isData: isDiffSessionState,
      migrate: (value, fromVersion) => {
        if (fromVersion !== 1 || typeof value !== "object" || value === null) {
          return null;
        }

        const legacy = value as Record<string, unknown>;
        if (
          typeof legacy.leftLang !== "string" ||
          typeof legacy.rightLang !== "string" ||
          typeof legacy.changesOnly !== "boolean"
        ) {
          return null;
        }

        return {
          leftLang: legacy.leftLang as Language,
          rightLang: legacy.rightLang as Language,
          changesOnly: legacy.changesOnly,
        };
      },
    });

    if (!savedSession) {
      return;
    }

    batch(() => {
      setLeftLang(savedSession.leftLang);
      setRightLang(savedSession.rightLang);
      setChangesOnly(savedSession.changesOnly);
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
      setAnalysis(null);
      setDiffData(null);
      return;
    }

    setPending(true);
    debounceTimer = setTimeout(() => {
      batch(() => {
        setDiffData({ original: left, modified: right, leftLang: ll, rightLang: rl });
        setCurrentChangeIdx(0);
      });
    }, DEBOUNCE_MS);
  });

  createEffect(() => {
    const data = diffData();
    const changesOnlyEnabled = changesOnly();
    const runId = ++latestAnalysisRun;

    if (!data) {
      setAnalysis(null);
      setPending(false);
      return;
    }

    setPending(true);

    void diffExecutor
      .execute({
        original: data.original,
        modified: data.modified,
        leftLanguage: data.leftLang,
        rightLanguage: data.rightLang,
        changesOnly: changesOnlyEnabled,
        context: DIFF_CONTEXT,
      })
      .then((response) => {
        if (runId !== latestAnalysisRun) {
          return;
        }

        batch(() => {
          setAnalysis(response.result);
          setPending(false);
        });
      })
      .catch(() => {
        if (runId !== latestAnalysisRun) {
          return;
        }

        batch(() => {
          setAnalysis(null);
          setPending(false);
        });
      });
  });

  createEffect(() => {
    const sessionState = {
      leftLang: leftLang(),
      rightLang: rightLang(),
      changesOnly: changesOnly(),
    };

    if (
      sessionState.leftLang === DEFAULT_DIFF_SESSION_STATE.leftLang &&
      sessionState.rightLang === DEFAULT_DIFF_SESSION_STATE.rightLang &&
      sessionState.changesOnly === DEFAULT_DIFF_SESSION_STATE.changesOnly
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
    diffExecutor.dispose();
  });

  // --- Memos ----------------------------------------------------------------
  const filteredRows = createMemo(() => analysis()?.filteredRows ?? []);

  const stats = createMemo(() => analysis()?.stats ?? EMPTY_STATS);

  const changeIndices = createMemo(() => analysis()?.changeIndices ?? []);

  const strategy = createMemo(() => analysis()?.strategy ?? "text");

  const structuredErrors = createMemo(() => analysis()?.errors ?? []);

  const isEmpty = createMemo(() => leftContent() === "" && rightContent() === "");

  const isIdentical = createMemo(() => analysis()?.isIdentical ?? false);

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

  // Separator rows between context groups
  function isSeparator(sourceIndex: number, prevSourceIndex: number | undefined): boolean {
    if (!changesOnly()) return false;
    if (prevSourceIndex === undefined) return false;
    return sourceIndex > prevSourceIndex + 1;
  }

  // ---------------------------------------------------------------------------
  return (
    <div class="flex flex-col gap-4 p-5 mx-auto w-full max-w-none">
      {/* -------------------------------------------------------------------- */}
      {/* Input panels (two columns)                                           */}
      {/* -------------------------------------------------------------------- */}
      <div class="flex gap-3 items-stretch">
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
        <div class="text-center text-[var(--text-muted)] text-sm py-8 px-4">
          Paste two texts to compare, or open files with the buttons above.
        </div>
      </Show>

      <Show when={fileError()}>
        <div
          role="alert"
          class="px-3.5 py-2.5 rounded-md border border-[var(--accent-error)] bg-[color-mix(in_srgb,var(--accent-error)_10%,transparent)] text-[var(--accent-error)] text-sm"
        >
          {fileError()}
        </div>
      </Show>

      <Show when={fileNotice()}>
        <div class="px-3.5 py-2.5 rounded-md border border-[color-mix(in_srgb,var(--accent-warning)_60%,transparent)] bg-[color-mix(in_srgb,var(--accent-warning)_10%,transparent)] text-[var(--accent-warning)] text-sm">
          {fileNotice()}
        </div>
      </Show>

      {/* -------------------------------------------------------------------- */}
      {/* Toolbar (only when there's data or pending)                          */}
      {/* -------------------------------------------------------------------- */}
      <Show when={!isEmpty()}>
        <div class="flex flex-wrap items-center gap-2 px-3.5 py-2.5 bg-[var(--bg-secondary)] border border-[var(--border)] rounded-lg">
          {/* Strategy badge */}
          <span class="text-xs font-semibold tracking-widest uppercase text-[var(--accent-primary)] bg-[color-mix(in_srgb,var(--accent-primary)_12%,transparent)] border border-[color-mix(in_srgb,var(--accent-primary)_30%,transparent)] rounded px-2 py-0.5">
            {STRATEGY_LABELS[strategy()] ?? "Text"}
          </span>

          {/* Pending spinner */}
          <Show when={pending()}>
            <span class="text-sm text-[var(--text-muted)] italic">Comparing...</span>
          </Show>

          {/* Identical label */}
          <Show when={isIdentical()}>
            <span class="text-sm font-medium text-[var(--accent-success)]">Identical</span>
          </Show>

          {/* Stats: +N / -N */}
          <Show when={!pending() && !isIdentical() && diffData() !== null}>
            <span class="text-sm font-semibold text-[var(--accent-success)]">+{stats().added}</span>
            <span class="text-sm font-semibold text-[var(--accent-error)]">-{stats().removed}</span>
          </Show>

          {/* Spacer */}
          <div class="flex-1" />

          {/* Changes only toggle */}
          <label class="flex items-center gap-1.5 cursor-pointer text-sm text-[var(--text-secondary)] select-none">
            <input
              type="checkbox"
              checked={changesOnly()}
              onChange={(e) => setChangesOnly(e.currentTarget.checked)}
              class="cursor-pointer accent-[var(--accent-primary)]"
            />
            Changes only
          </label>

          {/* Next change button */}
          <Show when={changeIndices().length > 0}>
            <button
              type="button"
              onClick={handleNextChange}
              class="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border)] rounded px-2.5 py-1 text-xs cursor-pointer whitespace-nowrap"
              title="Jump to next change"
            >
              ↓ Next change
            </button>
          </Show>

          {/* Swap button */}
          <button
            type="button"
            onClick={handleSwap}
            class="bg-[var(--bg-tertiary)] text-[var(--text-secondary)] border border-[var(--border)] rounded px-2.5 py-1 text-xs cursor-pointer whitespace-nowrap"
            title="Swap left and right"
          >
            ⇅ Swap
          </button>

          <span class="text-xs text-[var(--text-muted)]">
            File limit {formatBytes(DEFAULT_IMPORT_MAX_BYTES)}
          </span>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* Error banners from structured normalization                        */}
        {/* ------------------------------------------------------------------ */}
        <Show when={structuredErrors().length > 0}>
          <div class="flex flex-col gap-1.5">
            <For each={structuredErrors()}>
              {(err) => (
                <div
                  role="alert"
                  class="px-3.5 py-2.5 rounded-md border border-[var(--accent-error)] bg-[color-mix(in_srgb,var(--accent-error)_10%,transparent)] text-[var(--accent-error)] text-sm"
                >
                  <strong class="capitalize">{err.side}</strong>: {err.message} — falling back to
                  text diff.
                </div>
              )}
            </For>
          </div>
        </Show>

        {/* ------------------------------------------------------------------ */}
        {/* Diff output table                                                  */}
        {/* ------------------------------------------------------------------ */}
        <Show when={!pending() && diffData() !== null && filteredRows().length > 0}>
          <div class="overflow-x-auto border border-[var(--border)] rounded-lg bg-[var(--bg-secondary)]">
            <table class="w-full border-collapse table-fixed text-sm leading-[1.5]">
              <colgroup>
                <col style="width: 2.75rem" />
                <col style="width: 50%" />
                <col style="width: 2.75rem" />
                <col style="width: 50%" />
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
                              class="px-3 py-0.5 bg-[var(--bg-primary)] text-[var(--text-muted)] text-xs font-mono tracking-wider border-t border-b border-[var(--border)]"
                            >
                              · · ·
                            </td>
                          </tr>
                        </Show>
                        <tr
                          data-source-row={sourceIndex}
                          classList={{
                            "border-t border-[color-mix(in_srgb,var(--border)_50%,transparent)]":
                              !showSeparator && i() !== 0,
                          }}
                        >
                          {/* Left line number */}
                          <td
                            class="select-none text-right px-2 min-w-[2.5rem] text-[var(--text-muted)] tabular-nums border-r border-[var(--border)] text-xs"
                            classList={{
                              "bg-[color-mix(in_srgb,var(--accent-error)_18%,transparent)]":
                                row.type === "removed",
                              "bg-[color-mix(in_srgb,var(--accent-error)_12%,transparent)]":
                                row.type === "changed",
                            }}
                          >
                            <Show when={row.leftLineNum !== null}>{row.leftLineNum}</Show>
                          </td>
                          {/* Left content */}
                          <td
                            class="px-3 whitespace-pre font-mono text-xs overflow-visible w-1/2"
                            classList={{
                              "bg-[color-mix(in_srgb,var(--accent-error)_18%,transparent)]":
                                row.type === "removed",
                              "bg-[color-mix(in_srgb,var(--accent-error)_12%,transparent)]":
                                row.type === "changed",
                            }}
                          >
                            <Show when={row.left !== null}>{row.left}</Show>
                          </td>
                          {/* Right line number */}
                          <td
                            class="select-none text-right px-2 min-w-[2.5rem] text-[var(--text-muted)] tabular-nums border-r border-[var(--border)] border-l border-[var(--border)] text-xs"
                            classList={{
                              "bg-[color-mix(in_srgb,var(--accent-success)_18%,transparent)]":
                                row.type === "added",
                              "bg-[color-mix(in_srgb,var(--accent-success)_12%,transparent)]":
                                row.type === "changed",
                            }}
                          >
                            <Show when={row.rightLineNum !== null}>{row.rightLineNum}</Show>
                          </td>
                          {/* Right content */}
                          <td
                            class="px-3 whitespace-pre font-mono text-xs overflow-visible w-1/2"
                            classList={{
                              "bg-[color-mix(in_srgb,var(--accent-success)_18%,transparent)]":
                                row.type === "added",
                              "bg-[color-mix(in_srgb,var(--accent-success)_12%,transparent)]":
                                row.type === "changed",
                            }}
                          >
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
          <div class="text-center text-[var(--text-muted)] text-sm py-6">
            No changes to display with current context settings.
          </div>
        </Show>
      </Show>
    </div>
  );
}
