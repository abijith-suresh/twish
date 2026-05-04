import { createMemo, createSignal, For, onCleanup, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import {
  DEFAULT_IMPORT_MAX_BYTES,
  type FileImportError,
  formatBytes,
  type ImportedFileMeta,
  readImportedFile,
} from "@/lib/fileImport";
import { hashBytesWithAlgorithms, type HashResult, hashTextWithAlgorithms } from "@/lib/hash";

type HashWorkflow = "text" | "file";

export default function HashGenerator() {
  const [workflow, setWorkflow] = createSignal<HashWorkflow>("text");
  const [input, setInput] = createSignal("");
  const [results, setResults] = createSignal<HashResult[]>([]);
  const [computing, setComputing] = createSignal(false);
  const [fileError, setFileError] = createSignal<FileImportError | null>(null);
  const [loadedFile, setLoadedFile] = createSignal<ImportedFileMeta | null>(null);
  const [loadedFileBytes, setLoadedFileBytes] = createSignal<Uint8Array | null>(null);
  const [fileNotice, setFileNotice] = createSignal<string | null>(null);

  let debounceTimer: ReturnType<typeof setTimeout> | undefined;

  const fileSummary = createMemo(() => {
    const file = loadedFile();
    if (!file) {
      return "";
    }

    return `${file.name}\n${formatBytes(file.size)}${file.type ? `\n${file.type}` : ""}`;
  });
  const readFileError = createMemo(() => {
    const error = fileError();
    return error?.code === "read-failed" ? error : null;
  });

  async function computeText(text: string) {
    if (!text.trim()) {
      setResults([]);
      setComputing(false);
      return;
    }

    setComputing(true);

    try {
      setResults(await hashTextWithAlgorithms(text));
    } finally {
      setComputing(false);
    }
  }

  async function computeBytes(bytes: Uint8Array) {
    if (bytes.length === 0) {
      setResults([]);
      setComputing(false);
      return;
    }

    setComputing(true);

    try {
      setResults(await hashBytesWithAlgorithms(bytes));
    } finally {
      setComputing(false);
    }
  }

  function handleInput(value: string) {
    setInput(value);
    setFileError(null);
    setFileNotice(null);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => void computeText(value), 300);
  }

  function handleWorkflowChange(nextWorkflow: HashWorkflow) {
    clearTimeout(debounceTimer);
    setWorkflow(nextWorkflow);
    setInput("");
    setResults([]);
    setComputing(false);
    setFileError(null);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setFileNotice(null);
  }

  function handleClear() {
    clearTimeout(debounceTimer);
    setInput("");
    setResults([]);
    setComputing(false);
    setFileError(null);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setFileNotice(null);
    setWorkflow("text");
  }

  async function handleFile(file: File) {
    clearTimeout(debounceTimer);
    setFileError(null);
    setFileNotice(null);

    const result = await readImportedFile(file, {
      as: "bytes",
      policy: { maxBytes: DEFAULT_IMPORT_MAX_BYTES },
    });

    if (!result.ok) {
      setFileError(result.error);
      setResults([]);
      return;
    }

    if (result.decision.status === "warn") {
      setFileNotice(
        `${result.file.name} is ${formatBytes(result.file.size)}. Large files may take longer to hash.`
      );
    }

    setWorkflow("file");
    setLoadedFile(result.file);
    setLoadedFileBytes(result.value);
    setInput("");
    await computeBytes(result.value);
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      void handleFile(file);
    }
  }

  onCleanup(() => {
    clearTimeout(debounceTimer);
  });

  return (
    <div
      style={{
        display: "flex",
        "flex-direction": "column",
        gap: "1.25rem",
        padding: "1.5rem",
        "max-width": "860px",
        margin: "0 auto",
        width: "100%",
      }}
    >
      <div
        style={{
          display: "flex",
          "flex-wrap": "wrap",
          "align-items": "center",
          gap: "0.75rem",
        }}
      >
        <div style={{ display: "flex", gap: "0.25rem", "align-items": "center" }}>
          <ToolActionButton
            active={workflow() === "text"}
            variant={workflow() === "text" ? "primary" : "ghost"}
            onClick={() => handleWorkflowChange("text")}
          >
            Text
          </ToolActionButton>
          <ToolActionButton
            active={workflow() === "file"}
            variant={workflow() === "file" ? "primary" : "ghost"}
            onClick={() => handleWorkflowChange("file")}
          >
            File
          </ToolActionButton>
        </div>

        <ToolActionButton
          onClick={() =>
            workflow() === "file"
              ? loadedFileBytes() && void computeBytes(loadedFileBytes() ?? new Uint8Array())
              : void computeText(input())
          }
          variant="primary"
          disabled={workflow() === "file" ? !loadedFileBytes() : !input().trim()}
        >
          Hash input
        </ToolActionButton>
        <ToolActionButton
          onClick={handleClear}
          disabled={!input().trim() && !loadedFileBytes() && results().length === 0}
        >
          Clear
        </ToolActionButton>
        <span style={{ "font-size": "0.8125rem", color: "var(--text-muted)" }}>
          Local-only hashing via the browser&apos;s Web Crypto API
        </span>
      </div>

      <div style={{ display: "flex", "flex-direction": "column", gap: "0.375rem" }}>
        <label
          style={{
            "font-size": "0.75rem",
            "font-weight": "600",
            "letter-spacing": "0.05em",
            "text-transform": "uppercase",
            color: "var(--text-secondary)",
          }}
        >
          {workflow() === "text" ? "Input text" : "Input file"}
        </label>
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDrop}
          style={{ position: "relative" }}
        >
          <textarea
            value={workflow() === "file" ? fileSummary() : input()}
            onInput={(event) => handleInput(event.currentTarget.value)}
            placeholder={
              workflow() === "text"
                ? "Type or paste text to hash…"
                : "Drop a file here or use the file picker to hash it locally…"
            }
            rows={5}
            spellcheck={false}
            readOnly={workflow() === "file"}
            style={{
              width: "100%",
              padding: "0.875rem 1rem",
              "border-radius": "0.5rem",
              border: "1px solid var(--border)",
              background: "var(--bg-secondary)",
              color: "var(--text-primary)",
              "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
              "font-size": "0.875rem",
              "line-height": "1.6",
              resize: "vertical",
              outline: "none",
              "box-sizing": "border-box",
            }}
          />
        </div>

        <div style={{ display: "flex", "align-items": "center", gap: "0.5rem" }}>
          <label
            style={{
              "font-size": "0.8125rem",
              color: "var(--accent-primary)",
              cursor: "pointer",
            }}
          >
            Open file
            <input
              type="file"
              style={{ display: "none" }}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0];
                if (file) {
                  void handleFile(file);
                }
                event.currentTarget.value = "";
              }}
            />
          </label>
          <span style={{ "font-size": "0.8125rem", color: "var(--text-muted)" }}>
            Shared local file import flow with explicit read and size failures
          </span>
        </div>
      </div>

      <Show when={fileNotice()}>
        <ToolStatusMessage tone="warning">{fileNotice()}</ToolStatusMessage>
      </Show>
      <Show when={fileError()?.code === "file-too-large"}>
        <ToolStatusMessage tone="error">
          File is too large. Maximum supported size is {formatBytes(DEFAULT_IMPORT_MAX_BYTES)}.
        </ToolStatusMessage>
      </Show>
      <Show when={readFileError()}>
        {(error) => (
          <ToolStatusMessage tone="error">
            {error().file.name} could not be read. {error().message}.
          </ToolStatusMessage>
        )}
      </Show>

      <Show when={computing()}>
        <ToolStatusMessage tone="muted">Computing…</ToolStatusMessage>
      </Show>

      <Show when={results().length > 0}>
        <div
          style={{
            display: "flex",
            "flex-direction": "column",
            gap: "0.75rem",
          }}
        >
          <For each={results()}>
            {(result) => (
              <div
                style={{
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  "border-radius": "0.5rem",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "space-between",
                    padding: "0.5rem 1rem",
                    "border-bottom": "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      "font-size": "0.75rem",
                      "font-weight": "700",
                      "letter-spacing": "0.05em",
                      "text-transform": "uppercase",
                      color: "var(--accent-primary)",
                    }}
                  >
                    {result.algorithm}
                  </span>
                  <CopyButton text={result.hex} />
                </div>

                <pre
                  style={{
                    margin: "0",
                    padding: "0.75rem 1rem",
                    "font-size": "0.8125rem",
                    "line-height": "1.6",
                    color: "var(--text-primary)",
                    "font-family":
                      "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                    "white-space": "pre-wrap",
                    "word-break": "break-all",
                  }}
                >
                  {result.hex}
                </pre>
              </div>
            )}
          </For>
        </div>
      </Show>

      <Show when={!input().trim() && !loadedFileBytes() && results().length === 0}>
        <ToolStatusMessage tone="muted">
          SHA-1 · SHA-256 · SHA-384 · SHA-512 computed locally for text and file workflows
        </ToolStatusMessage>
      </Show>
    </div>
  );
}
