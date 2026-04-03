import { createMemo, createSignal, Show } from "solid-js";

import CopyButton from "@/components/CopyButton";
import ToolActionButton from "@/components/ToolActionButton";
import ToolStatusMessage from "@/components/ToolStatusMessage";
import {
  type Base64Mode,
  type Base64Variant,
  type Base64Workflow,
  encodeBytesToBase64,
  formatBase64FileNotice,
  formatBase64FileTooLargeMessage,
  processBase64Input,
} from "@/lib/base64";
import {
  DEFAULT_IMPORT_MAX_BYTES,
  type FileImportError,
  formatBytes,
  type ImportedFileMeta,
  readImportedFile,
} from "@/lib/fileImport";

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Base64Tool() {
  const [mode, setMode] = createSignal<Base64Mode>("encode");
  const [variant, setVariant] = createSignal<Base64Variant>("standard");
  const [workflow, setWorkflow] = createSignal<Base64Workflow>("text");
  const [input, setInput] = createSignal("");
  const [fileError, setFileError] = createSignal<FileImportError | null>(null);
  const [loadedFile, setLoadedFile] = createSignal<ImportedFileMeta | null>(null);
  const [loadedFileBytes, setLoadedFileBytes] = createSignal<Uint8Array | null>(null);
  const [fileNotice, setFileNotice] = createSignal<string | null>(null);

  const textInput = createMemo(() => (mode() === "encode" && workflow() === "file" ? "" : input()));
  const result = createMemo(() => {
    if (mode() === "encode" && workflow() === "file" && loadedFileBytes()) {
      return {
        ok: true as const,
        value: encodeBytesToBase64(loadedFileBytes() ?? new Uint8Array(), variant()),
        outputKind: "text" as const,
      };
    }

    return processBase64Input(textInput(), mode(), variant(), workflow());
  });
  const outputValue = createMemo(() => {
    const current = result();
    return current.ok ? current.value : "";
  });
  const transformError = createMemo(() => {
    const current = result();
    return current.ok ? null : current.error;
  });
  const fileSummary = createMemo(() => {
    const file = loadedFile();
    if (!file) {
      return "";
    }

    return `${file.name}\n${formatBytes(file.size)}${file.type ? `\n${file.type}` : ""}`;
  });

  function swap() {
    const current = outputValue();
    setFileError(null);
    setFileNotice(null);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setMode((m) => (m === "encode" ? "decode" : "encode"));
    setInput(current);
  }

  function reset() {
    setMode("encode");
    setVariant("standard");
    setWorkflow("text");
    setInput("");
    setFileError(null);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setFileNotice(null);
  }

  function handleModeChange(nextMode: Base64Mode) {
    setMode(nextMode);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setFileError(null);
    setFileNotice(null);
  }

  function handleWorkflowChange(nextWorkflow: Base64Workflow) {
    setWorkflow(nextWorkflow);
    setLoadedFile(null);
    setLoadedFileBytes(null);
    setFileError(null);
    setFileNotice(null);
  }

  async function handleFile(file: File) {
    setFileError(null);
    setFileNotice(null);

    if (mode() === "encode") {
      const result = await readImportedFile(file, {
        as: "bytes",
        policy: { maxBytes: DEFAULT_IMPORT_MAX_BYTES },
      });

      if (!result.ok) {
        setFileError(result.error);
        return;
      }

      if (result.decision.status === "warn") {
        setFileNotice(formatBase64FileNotice(result.file, mode(), workflow()));
      }

      setLoadedFile(result.file);
      setLoadedFileBytes(result.value);
      setWorkflow("file");
      setInput("");
      return;
    }

    const result = await readImportedFile(
      file,
      workflow() === "file"
        ? {
            as: "text",
            policy: { maxBytes: DEFAULT_IMPORT_MAX_BYTES },
          }
        : {
            as: "text",
            policy: { maxBytes: DEFAULT_IMPORT_MAX_BYTES },
          }
    );

    if (!result.ok) {
      setFileError(result.error);
      return;
    }

    if (result.decision.status === "warn") {
      setFileNotice(formatBase64FileNotice(result.file, mode(), workflow()));
    }

    setLoadedFile(result.file);
    setLoadedFileBytes(null);
    setInput(result.value);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleFile(file);
  }

  const fileReadErrorMessage = () => {
    const error = fileError();
    if (!error || error.code !== "read-failed") {
      return null;
    }

    return `${error.file.name} could not be read. ${error.message}.`;
  };

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
      {/* ------------------------------------------------------------------ */}
      {/* Mode toggle + swap                                                  */}
      {/* ------------------------------------------------------------------ */}
      <div style={{ display: "flex", "flex-wrap": "wrap", gap: "0.5rem", "align-items": "center" }}>
        <div
          style={{
            display: "flex",
            "align-items": "center",
            gap: "0.25rem",
            padding: "0.25rem",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            "border-radius": "0.5rem",
          }}
        >
          <ToolActionButton
            active={mode() === "encode"}
            variant={mode() === "encode" ? "primary" : "ghost"}
            onClick={() => handleModeChange("encode")}
          >
            Encode
          </ToolActionButton>
          <ToolActionButton
            active={mode() === "decode"}
            variant={mode() === "decode" ? "primary" : "ghost"}
            onClick={() => handleModeChange("decode")}
          >
            Decode
          </ToolActionButton>
        </div>

        <div style={{ display: "flex", gap: "0.25rem", "align-items": "center" }}>
          <ToolActionButton
            active={variant() === "standard"}
            variant={variant() === "standard" ? "primary" : "ghost"}
            onClick={() => setVariant("standard")}
          >
            Base64
          </ToolActionButton>
          <ToolActionButton
            active={variant() === "url"}
            variant={variant() === "url" ? "primary" : "ghost"}
            onClick={() => setVariant("url")}
          >
            Base64url
          </ToolActionButton>
        </div>

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
            File / binary
          </ToolActionButton>
        </div>

        <div
          style={{ display: "flex", gap: "0.5rem", "align-items": "center", "margin-left": "auto" }}
        >
          <ToolActionButton onClick={swap} title="Swap input/output">
            ⇅ Swap
          </ToolActionButton>
          <ToolActionButton onClick={reset} variant="ghost">
            Reset
          </ToolActionButton>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Input                                                               */}
      {/* ------------------------------------------------------------------ */}
      <div style={{ display: "flex", "flex-direction": "column", gap: "0.5rem" }}>
        <label
          style={{
            "font-size": "0.75rem",
            "font-weight": "600",
            "letter-spacing": "0.05em",
            "text-transform": "uppercase",
            color: "var(--text-secondary)",
          }}
        >
          {mode() === "encode"
            ? workflow() === "text"
              ? "Plain text"
              : "Binary file"
            : variant() === "url"
              ? "Base64url"
              : "Base64"}
        </label>

        {/* Drop zone wrapper */}
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
          style={{ position: "relative" }}
        >
          <textarea
            value={mode() === "encode" && workflow() === "file" ? fileSummary() : input()}
            onInput={(e) => {
              setFileError(null);
              setFileNotice(null);
              setLoadedFile(null);
              setLoadedFileBytes(null);
              setInput(e.currentTarget.value);
            }}
            placeholder={
              mode() === "encode"
                ? workflow() === "text"
                  ? "Type or paste text to encode, or drop a file…"
                  : "Drop or open a file to encode it as Base64…"
                : workflow() === "file"
                  ? "Paste Base64 to inspect as bytes, or drop an encoded file…"
                  : "Paste Base64 to decode as UTF-8 text, or drop a file…"
            }
            rows={8}
            spellcheck={false}
            readOnly={mode() === "encode" && workflow() === "file"}
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

        {/* File open button */}
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
              onChange={(e) => {
                const file = e.currentTarget.files?.[0];
                if (file) handleFile(file);
                e.currentTarget.value = "";
              }}
            />
          </label>
          <span style={{ "font-size": "0.8125rem", color: "var(--text-muted)" }}>
            Local-only input handling with explicit text and file workflows
          </span>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Error banner                                                        */}
      {/* ------------------------------------------------------------------ */}
      <Show when={fileNotice()}>
        <ToolStatusMessage tone="warning">{fileNotice()}</ToolStatusMessage>
      </Show>
      <Show when={fileError()?.code === "file-too-large"}>
        <ToolStatusMessage tone="error">
          {formatBase64FileTooLargeMessage(DEFAULT_IMPORT_MAX_BYTES)}
        </ToolStatusMessage>
      </Show>
      <Show when={fileError()?.code === "read-failed"}>
        <ToolStatusMessage tone="error">{fileReadErrorMessage()}</ToolStatusMessage>
      </Show>
      <Show when={transformError()}>
        <ToolStatusMessage tone="error">{transformError()}</ToolStatusMessage>
      </Show>

      {/* ------------------------------------------------------------------ */}
      {/* Output                                                              */}
      {/* ------------------------------------------------------------------ */}
      <Show when={outputValue()}>
        {(value) => (
          <div
            style={{
              background: "var(--bg-secondary)",
              border: "1px solid var(--border)",
              "border-radius": "0.5rem",
              overflow: "hidden",
            }}
          >
            {/* Output header */}
            <div
              style={{
                display: "flex",
                "align-items": "center",
                "justify-content": "space-between",
                padding: "0.625rem 1rem",
                "border-bottom": "1px solid var(--border)",
              }}
            >
              <span
                style={{
                  "font-size": "0.75rem",
                  "font-weight": "600",
                  "letter-spacing": "0.05em",
                  "text-transform": "uppercase",
                  color: "var(--text-secondary)",
                }}
              >
                {mode() === "encode"
                  ? variant() === "url"
                    ? "Base64url"
                    : "Base64"
                  : workflow() === "file"
                    ? "Decoded bytes"
                    : "Decoded text"}
              </span>
              <CopyButton text={value()} />
            </div>

            {/* Output body */}
            <pre
              style={{
                margin: "0",
                padding: "1rem",
                "overflow-x": "auto",
                "font-size": "0.8125rem",
                "line-height": "1.6",
                color: "var(--text-primary)",
                "font-family": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                "white-space": "pre-wrap",
                "word-break": "break-all",
              }}
            >
              <code>{value()}</code>
            </pre>
          </div>
        )}
      </Show>

      <Show
        when={!input().trim() && !fileSummary() && !fileNotice() && !fileError() && !outputValue()}
      >
        <ToolStatusMessage tone="muted">
          Standard Base64 and Base64url are both supported. File workflows stay local and surface
          large-input warnings instead of failing silently.
        </ToolStatusMessage>
      </Show>
    </div>
  );
}
